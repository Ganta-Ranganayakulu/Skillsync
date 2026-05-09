import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { JobTypeBadge, Loading, timeAgo, formatSalary, expLabel } from '../components/Common';

export default function JobDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, addMessage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/api/jobs/${id}`)
      .then(res => setData(res.data))
      .catch(() => navigate('/jobs'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!user) return navigate('/login');
    try {
      if (data.is_saved) {
        await axios.delete(`/api/jobs/${id}/save`);
        setData(d => ({ ...d, is_saved: false }));
        addMessage('Job removed from saved jobs', 'info');
      } else {
        await axios.post(`/api/jobs/${id}/save`);
        setData(d => ({ ...d, is_saved: true }));
        addMessage('Job saved successfully!', 'success');
      }
    } catch (e) { addMessage(e.response?.data?.message || 'Error', 'error'); }
  };

  if (loading) return <Loading />;
  if (!data) return null;

  const { job, is_saved, has_applied, match_info } = data;
  const skills = (job.skills_required || '').split(',').filter(Boolean).map(s => s.trim());
  const score = match_info?.overall_score || 0;

  const scoreColor = score >= 75 ? '#27ae60' : score >= 50 ? '#f39c12' : score >= 25 ? '#e67e22' : '#e74c3c';
  const scoreLabel = score >= 75 ? 'Excellent Match' : score >= 50 ? 'Good Match' : score >= 25 ? 'Partial Match' : 'Low Match';

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
              {/* Header */}
              <div className="job-header">
                <div className="company-info">
                  <div className="company-logo-placeholder large"><i className="fas fa-building"></i></div>
                  <div>
                    <h1>{job.title}</h1>
                    <p className="company-name" style={{ fontSize: 16, marginBottom: 4 }}>
                      {job.company_website
                        ? <a href={job.company_website} className="company-link" target="_blank" rel="noreferrer">{job.company_name}</a>
                        : job.company_name}
                    </p>
                    <JobTypeBadge type={job.job_type} />
                  </div>
                </div>
                {match_info && (
                  <div className="match-score-card" style={{ borderColor: scoreColor }}>
                    <div className="match-circle" style={{ '--score-color': scoreColor, '--deg': `${score * 3.6}deg` }}>
                      <span className="score" style={{ color: scoreColor }}>{score}%</span>
                    </div>
                    <div className="match-label">{scoreLabel}</div>
                    {match_info.ai_powered && (
                      <div className="ai-powered-badge"><i className="fas fa-bolt"></i> AI Powered</div>
                    )}
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="job-meta">
                <span className="meta-item"><i className="fas fa-map-marker-alt"></i>{job.location}</span>
                <span className="meta-item"><i className="fas fa-dollar-sign"></i>{formatSalary(job)}</span>
                <span className="meta-item"><i className="fas fa-layer-group"></i>{expLabel(job.experience_level)}</span>
                <span className="meta-item"><i className="fas fa-eye"></i>{job.views_count} views</span>
                <span className="meta-item"><i className="fas fa-clock"></i>Posted {timeAgo(job.createdAt)}</span>
                {job.application_deadline && (
                  <span className="meta-item deadline"><i className="fas fa-calendar-times"></i>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>
                )}
              </div>

              {/* AI Compatibility Analysis */}
              {match_info && (
                <div className="match-details">
                  <h3><i className="fas fa-robot"></i> AI Compatibility Analysis</h3>

                  {/* Score breakdown bars */}
                  <div className="match-breakdown">
                    {[
                      { label: 'Skills Match', val: match_info.skill_match, weight: '65%' },
                      { label: 'Experience', val: match_info.experience_match, weight: '35%' },
                    ].map(({ label, val, weight }) => (
                      <div className="match-item" key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span className="label">{label}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{weight} weight</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress" style={{
                            width: `${val}%`,
                            background: val >= 75 ? 'var(--success-color)' : val >= 50 ? '#f39c12' : 'var(--error-color)'
                          }}></div>
                        </div>
                        <span className="value" style={{ color: val >= 75 ? 'var(--success-color)' : val >= 50 ? '#f39c12' : 'var(--error-color)' }}>{val}%</span>
                      </div>
                    ))}
                  </div>

                  {/* AI Insights */}
                  {(match_info.strengths || match_info.gaps) && (
                    <div className="ai-insights">
                      {match_info.strengths && (
                        <div className="insight-card strength">
                          <i className="fas fa-thumbs-up"></i>
                          <div>
                            <strong>Strengths</strong>
                            <p>{match_info.strengths}</p>
                          </div>
                        </div>
                      )}
                      {match_info.gaps && (
                        <div className="insight-card gap">
                          <i className="fas fa-exclamation-circle"></i>
                          <div>
                            <strong>Areas to Improve</strong>
                            <p>{match_info.gaps}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Skills breakdown */}
                  <div className="skills-match">
                    {match_info.matched_skills?.length > 0 && (
                      <div>
                        <h4 style={{ color: 'var(--success-color)', marginBottom: 8 }}>
                          <i className="fas fa-check-circle"></i> Matched Skills ({match_info.matched_skills.length})
                        </h4>
                        <div className="skills-list">
                          {match_info.matched_skills.map((s, i) => <span key={i} className="skill-tag matched">{s}</span>)}
                        </div>
                      </div>
                    )}
                    {match_info.partial_skills?.length > 0 && (
                      <div>
                        <h4 style={{ color: '#f39c12', marginBottom: 8 }}>
                          <i className="fas fa-adjust"></i> Partial Match ({match_info.partial_skills.length})
                        </h4>
                        <div className="skills-list">
                          {match_info.partial_skills.map((s, i) => <span key={i} className="skill-tag partial">{s}</span>)}
                        </div>
                      </div>
                    )}
                    {match_info.missing_skills?.length > 0 && (
                      <div>
                        <h4 style={{ color: 'var(--error-color)', marginBottom: 8 }}>
                          <i className="fas fa-times-circle"></i> Missing Skills ({match_info.missing_skills.length})
                        </h4>
                        <div className="skills-list">
                          {match_info.missing_skills.map((s, i) => <span key={i} className="skill-tag missing">{s}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="job-section">
                <h3>Job Description</h3>
                <div className="job-description" style={{ whiteSpace: 'pre-wrap' }}>{job.description}</div>
              </div>
              {job.requirements && (
                <div className="job-section">
                  <h3>Requirements</h3>
                  <div className="job-requirements" style={{ whiteSpace: 'pre-wrap' }}>{job.requirements}</div>
                </div>
              )}
              {job.responsibilities && (
                <div className="job-section">
                  <h3>Responsibilities</h3>
                  <div className="job-responsibilities" style={{ whiteSpace: 'pre-wrap' }}>{job.responsibilities}</div>
                </div>
              )}
              {skills.length > 0 && (
                <div className="job-section">
                  <h3>Required Skills</h3>
                  <div className="skills-required">{skills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}</div>
                </div>
              )}

              {/* Actions */}
              <div className="job-actions">
                {user?.role === 'jobseeker' ? (
                  !has_applied
                    ? <Link to={`/jobs/${job._id}/apply`} className="btn btn-primary"><i className="fas fa-paper-plane"></i> Apply Now</Link>
                    : <button className="btn btn-success" disabled><i className="fas fa-check"></i> Already Applied</button>
                ) : !user ? (
                  <Link to="/register" className="btn btn-primary"><i className="fas fa-user-plus"></i> Register to Apply</Link>
                ) : null}
                <button className={`btn ${is_saved ? 'btn-secondary' : 'btn-outline'}`} onClick={handleSave}>
                  <i className="fas fa-bookmark"></i> {is_saved ? 'Saved' : 'Save Job'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside>
            <div className="sidebar-card">
              <h3>Company Details</h3>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>{job.company_name}</p>
              {job.company_description && <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{job.company_description}</p>}
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
            {!user && (
              <div className="sidebar-card" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-color)' }}>
                <h3 style={{ color: 'var(--primary-color)' }}><i className="fas fa-robot"></i> Get AI Match Score</h3>
                <p style={{ fontSize: 14, marginBottom: 16 }}>Register or login to see how well your skills match this job.</p>
                <Link to="/register" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Get Started Free</Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
