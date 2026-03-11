import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { JobTypeBadge, StatusBadge, Loading, timeAgo, formatSalary, expLabel } from '../components/Common';

export default function JobDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, addMessage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/api/jobs/${id}`).then(res => setData(res.data)).catch(() => navigate('/jobs')).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!user) return navigate('/login');
    try {
      if (data.is_saved) {
        await axios.delete(`/api/jobs/${id}/save`);
        setData(d => ({...d, is_saved: false}));
        addMessage('Job removed from saved jobs', 'info');
      } else {
        await axios.post(`/api/jobs/${id}/save`);
        setData(d => ({...d, is_saved: true}));
        addMessage('Job saved successfully!', 'success');
      }
    } catch(e) { addMessage(e.response?.data?.message || 'Error', 'error'); }
  };

  if (loading) return <Loading />;
  if (!data) return null;
  const { job, is_saved, has_applied, match_info } = data;
  const skills = (job.skills_required||'').split(',').filter(Boolean).map(s => s.trim());
  const score = match_info?.overall_score || 0;
  const deg = score * 3.6;

  return (
    <div className="job-detail-page">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <i className="fas fa-chevron-right"></i>
          <Link to="/jobs">Jobs</Link>
          <i className="fas fa-chevron-right"></i>
          <span>{job.title}</span>
        </div>
        <div className="job-detail-content">
          <div>
            <div className="job-detail-card">
              <div className="job-header">
                <div className="company-info">
                  <div className="company-logo-placeholder large"><i className="fas fa-building"></i></div>
                  <div>
                    <h1>{job.title}</h1>
                    <p className="company-name" style={{fontSize:16, marginBottom:4}}>
                      {job.company_website ? <a href={job.company_website} className="company-link" target="_blank" rel="noreferrer">{job.company_name}</a> : job.company_name}
                    </p>
                    <JobTypeBadge type={job.job_type} />
                  </div>
                </div>
                {match_info && (
                  <div className="match-score-card">
                    <div className="match-circle" style={{'--deg': `${deg}deg`}}>
                      <span className="score">{score}%</span>
                    </div>
                    <div className="match-label">AI Match Score</div>
                  </div>
                )}
              </div>

              <div className="job-meta">
                <span className="meta-item"><i className="fas fa-map-marker-alt"></i>{job.location}</span>
                <span className="meta-item"><i className="fas fa-dollar-sign"></i>{formatSalary(job)}</span>
                <span className="meta-item"><i className="fas fa-layer-group"></i>{expLabel(job.experience_level)}</span>
                <span className="meta-item"><i className="fas fa-eye"></i>{job.views_count} views</span>
                <span className="meta-item"><i className="fas fa-clock"></i>Posted {timeAgo(job.createdAt)}</span>
                {job.application_deadline && <span className="meta-item"><i className="fas fa-calendar-times"></i>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>}
              </div>

              {match_info && (
                <div className="match-details">
                  <h3><i className="fas fa-robot"></i> AI Compatibility Analysis</h3>
                  <div className="match-breakdown">
                    {[['Skills', match_info.skill_match], ['Experience', match_info.experience_match], ['Location', match_info.location_score]].map(([label, val]) => (
                      <div className="match-item" key={label}>
                        <span className="label">{label}</span>
                        <div className="progress-bar"><div className="progress" style={{width:`${val}%`}}></div></div>
                        <span className="value">{val}%</span>
                      </div>
                    ))}
                  </div>
                  {(match_info.matched_skills?.length > 0 || match_info.missing_skills?.length > 0) && (
                    <div className="skills-match">
                      <div>
                        <h4 style={{color:'var(--success-color)', marginBottom:8}}><i className="fas fa-check-circle"></i> Matched Skills</h4>
                        <div className="skills-list">{match_info.matched_skills.map((s,i) => <span key={i} className="skill-tag matched">{s}</span>)}</div>
                      </div>
                      <div>
                        <h4 style={{color:'var(--error-color)', marginBottom:8}}><i className="fas fa-times-circle"></i> Missing Skills</h4>
                        <div className="skills-list">{match_info.missing_skills.map((s,i) => <span key={i} className="skill-tag missing">{s}</span>)}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="job-section">
                <h3>Job Description</h3>
                <div className="job-description">{job.description}</div>
              </div>
              {job.requirements && <div className="job-section"><h3>Requirements</h3><div className="job-requirements">{job.requirements}</div></div>}
              {job.responsibilities && <div className="job-section"><h3>Responsibilities</h3><div className="job-responsibilities">{job.responsibilities}</div></div>}
              {skills.length > 0 && (
                <div className="job-section">
                  <h3>Required Skills</h3>
                  <div className="skills-required">{skills.map((s,i) => <span key={i} className="skill-tag">{s}</span>)}</div>
                </div>
              )}

              <div className="job-actions">
                {!has_applied ? (
                  <Link to={`/jobs/${job._id}/apply`} className="btn btn-primary"><i className="fas fa-paper-plane"></i> Apply Now</Link>
                ) : (
                  <button className="btn btn-success" disabled><i className="fas fa-check"></i> Already Applied</button>
                )}
                <button className={`btn ${is_saved ? 'btn-secondary' : 'btn-outline'}`} onClick={handleSave}>
                  <i className={`fas fa-bookmark`}></i> {is_saved ? 'Saved' : 'Save Job'}
                </button>
              </div>
            </div>
          </div>

          <aside>
            <div className="sidebar-card">
              <h3>Company Details</h3>
              <div className="company-details">
                <p className="company-name" style={{fontWeight:600, color:'var(--text-primary)', marginBottom:16}}>{job.company_name}</p>
                {job.company_description && <p className="company-description">{job.company_description}</p>}
              </div>
            </div>
            <div className="sidebar-card">
              <h3>Job Summary</h3>
              <div className="company-details">
                <p><i className="fas fa-briefcase"></i><span>{expLabel(job.experience_level)}</span></p>
                <p><i className="fas fa-map-marker-alt"></i><span>{job.location}</span></p>
                <p><i className="fas fa-dollar-sign"></i><span>{formatSalary(job)}</span></p>
                <p><i className="fas fa-clock"></i><span>Posted {timeAgo(job.createdAt)}</span></p>
                {job.application_deadline && <p><i className="fas fa-calendar-times"></i><span>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span></p>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
