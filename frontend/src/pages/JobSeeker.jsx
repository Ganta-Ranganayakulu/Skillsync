import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Loading, timeAgo, formatSalary, expLabel, JobTypeBadge } from '../components/Common';

export function ApplyJob() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, addMessage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/api/jobs/${id}`).then(res => setJob(res.data.job)).catch(() => navigate('/jobs')).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`/api/applications/${id}`, { cover_letter: coverLetter });
      addMessage('Application submitted successfully!', 'success');
      navigate('/my-applications');
    } catch(err) { addMessage(err.response?.data?.message || 'Error submitting', 'error'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Loading />;
  if (!job) return null;

  const resumeUrl = user?.jobseeker_profile?.resume ? `http://localhost:5000${user.jobseeker_profile.resume}` : null;
  const resumeFilename = resumeUrl ? resumeUrl.split('/').pop() : null;

  return (
    <div className="apply-job-page">
      <div className="container">
        <div className="page-header">
          <h1><i className="fas fa-paper-plane"></i> Apply for Job</h1>
        </div>
        <div className="apply-form-card">
          <div style={{background:'var(--primary-light)', borderRadius:'var(--border-radius)', padding:20, marginBottom:24}}>
            <h3>{job.title}</h3>
            <p style={{color:'var(--text-secondary)'}}>{job.company_name} &bull; {job.location}</p>
          </div>

          {/* Resume Auto-attach Notice */}
          <div style={{
            padding:16, borderRadius:'var(--border-radius)', marginBottom:24,
            border: resumeUrl ? '1px solid var(--success-color)' : '1px solid var(--error-color)',
            background: resumeUrl ? '#f0fff4' : '#fff5f5'
          }}>
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <i className={`fas fa-${resumeUrl ? 'check-circle' : 'exclamation-circle'}`}
                style={{fontSize:20, color: resumeUrl ? 'var(--success-color)' : 'var(--error-color)', flexShrink:0}}></i>
              <div style={{flex:1}}>
                {resumeUrl ? (
                  <>
                    <p style={{fontWeight:600, color:'var(--success-color)', marginBottom:4}}>
                      Resume will be automatically attached
                    </p>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      <i className="fas fa-file-pdf" style={{color:'var(--text-secondary)'}}></i>
                      <span style={{fontSize:13, color:'var(--text-secondary)'}}>{resumeFilename}</span>
                      <a href={resumeUrl} target="_blank" rel="noreferrer"
                        style={{fontSize:12, color:'var(--primary-color)', marginLeft:4}}>
                        <i className="fas fa-eye"></i> Preview
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{fontWeight:600, color:'var(--error-color)', marginBottom:4}}>No resume on file</p>
                    <p style={{fontSize:13, color:'var(--text-secondary)'}}>
                      Upload a resume in your <Link to="/profile" style={{color:'var(--primary-color)'}}>Profile</Link> to attach it automatically to all applications.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Cover Letter (Optional)</label>
              <textarea rows={8} placeholder="Write a compelling cover letter explaining why you are the right candidate..." value={coverLetter} onChange={e => setCoverLetter(e.target.value)} style={{resize:'vertical'}} />
              <small>A well-written cover letter increases your chances of getting noticed</small>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : <><i className="fas fa-paper-plane"></i> Submit Application</>}
              </button>
              <Link to={`/jobs/${id}`} className="btn btn-outline">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/applications/my/list').then(res => setApplications(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="container">
      <div className="page-header">
        <h1><i className="fas fa-paper-plane"></i> My Applications</h1>
      </div>
      {applications.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-paper-plane"></i>
          <h3>No applications yet</h3>
          <p>Start applying to jobs to see them here</p>
          <Link to="/jobs" className="btn btn-primary">Browse Jobs</Link>
        </div>
      ) : applications.map(app => {
        const resumeUrl = app.resume ? (app.resume.startsWith('http') ? app.resume : `http://localhost:5000${app.resume}`) : null;
        const resumeFilename = resumeUrl ? resumeUrl.split('/').pop() : null;
        return (
          <div className="application-card" key={app._id}>
            <div className="application-header">
              <div className="job-info">
                <h3><Link to={`/jobs/${app.job?._id}`}>{app.job?.title}</Link></h3>
                <p className="company" style={{color:'var(--text-secondary)'}}>{app.job?.company_name}</p>
                <div className="job-meta" style={{border:'none', padding:0}}>
                  <span className="meta-item"><i className="fas fa-map-marker-alt"></i>{app.job?.location}</span>
                  <span className="meta-item"><i className="fas fa-briefcase"></i>{expLabel(app.job?.experience_level)}</span>
                </div>
              </div>
              <div className="application-status">
                <StatusBadge status={app.status} />
                <span className="applied-date">Applied {timeAgo(app.createdAt)}</span>
              </div>
            </div>
            {/* Resume attached indicator */}
            {resumeUrl ? (
              <div style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                background:'#f0fff4', border:'1px solid #00b894', borderRadius:'var(--border-radius)',
                marginTop:12, fontSize:13
              }}>
                <i className="fas fa-file-alt" style={{color:'#00b894'}}></i>
                <span style={{color:'var(--text-secondary)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{resumeFilename}</span>
                <a href={resumeUrl} target="_blank" rel="noreferrer" style={{color:'var(--primary-color)', fontWeight:500, whiteSpace:'nowrap'}}>
                  <i className="fas fa-eye" style={{marginRight:4}}></i>View Resume
                </a>
              </div>
            ) : (
              <div style={{marginTop:12, fontSize:12, color:'#e17055', padding:'6px 10px', background:'#fff5f5', borderRadius:6}}>
                <i className="fas fa-exclamation-circle" style={{marginRight:5}}></i>No resume was attached to this application
              </div>
            )}
            {app.cover_letter && (
              <div className="cover-letter">
                <h4>Your Cover Letter</h4>
                <p>{app.cover_letter}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
//     </div>
//   );
// }

export function SavedJobs() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addMessage } = useAuth();

  useEffect(() => {
    axios.get('/api/jobs/saved/list').then(res => setSaved(res.data)).finally(() => setLoading(false));
  }, []);

  const handleUnsave = async (jobId) => {
    try {
      await axios.delete(`/api/jobs/${jobId}/save`);
      setSaved(s => s.filter(item => item.job?._id !== jobId));
      addMessage('Job removed from saved jobs', 'info');
    } catch(e) {}
  };

  if (loading) return <Loading />;

  return (
    <div className="container">
      <div className="page-header">
        <h1><i className="fas fa-bookmark"></i> Saved Jobs</h1>
      </div>
      {saved.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-bookmark"></i>
          <h3>No saved jobs</h3>
          <p>Save jobs to review them later</p>
          <Link to="/jobs" className="btn btn-primary">Browse Jobs</Link>
        </div>
      ) : saved.map(item => (
        <div className="saved-job-card" key={item._id}>
          <div className="job-info">
            <h3><Link to={`/jobs/${item.job?._id}`}>{item.job?.title}</Link></h3>
            <p className="company" style={{color:'var(--text-secondary)', marginBottom:8}}>{item.job?.company_name}</p>
            <div style={{display:'flex', gap:16}}>
              <span className="detail-item"><i className="fas fa-map-marker-alt"></i>{item.job?.location}</span>
              <span className="detail-item"><i className="fas fa-dollar-sign"></i>{item.job && formatSalary(item.job)}</span>
            </div>
          </div>
          <div className="job-actions" style={{border:'none', padding:0, margin:0}}>
            <Link to={`/jobs/${item.job?._id}/apply`} className="btn btn-primary btn-small">Apply Now</Link>
            <button className="btn btn-outline btn-small" onClick={() => handleUnsave(item.job?._id)}>
              <i className="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addMessage } = useAuth();

  useEffect(() => {
    axios.get('/api/jobs/recommendations').then(res => setRecommendations(res.data)).finally(() => setLoading(false));
  }, []);

  const handleSave = async (jobId) => {
    try {
      await axios.post(`/api/jobs/${jobId}/save`);
      addMessage('Job saved!', 'success');
    } catch (e) { addMessage(e.response?.data?.message || 'Error', 'error'); }
  };

  if (loading) return <Loading />;

  return (
    <div className="container">
      <div className="page-header">
        <h1><i className="fas fa-robot"></i> AI Job Recommendations</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Personalized matches powered by the SkillSync AI agent</p>
      </div>

      {/* AI info banner */}
      <div style={{ background: 'linear-gradient(135deg,#e8f4fd,#f0e6ff)', border: '1px solid #c3a6f0', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
        <i className="fas fa-brain" style={{ fontSize: 28, color: '#7c3aed', flexShrink: 0 }}></i>
        <div>
          <strong style={{ color: '#5b21b6' }}>AI Agent Active</strong>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Our AI agent semantically matches your skills with job requirements — understanding synonyms, related technologies, and experience levels to give you accurate scores.
          </p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-robot"></i>
          <h3>No recommendations yet</h3>
          <p>Complete your profile with skills and experience to get personalized AI recommendations</p>
          <Link to="/profile" className="btn btn-primary">Update Profile</Link>
        </div>
      ) : (
        <div className="recommendations-grid">
          {recommendations.map(({ job, scores }) => {
            const sc = scores.overall_score;
            const color = sc >= 75 ? 'var(--success-color)' : sc >= 50 ? '#f39c12' : sc >= 25 ? '#e67e22' : 'var(--error-color)';
            const label = sc >= 75 ? 'Excellent' : sc >= 50 ? 'Good' : sc >= 25 ? 'Partial' : 'Low';
            return (
              <div className="recommendation-card" key={job._id}>
                <div className="match-score-header" style={{ borderBottom: `3px solid ${color}` }}>
                  <div className="match-percentage" style={{ color }}>{sc}%</div>
                  <div className="match-label">{label} Match</div>
                  {scores.ai_powered && (
                    <span style={{ fontSize: 10, background: 'linear-gradient(135deg,#9b59b6,#8e44ad)', color: 'white', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                      <i className="fas fa-bolt"></i> AI
                    </span>
                  )}
                </div>

                <div className="job-info" style={{ marginBottom: 16 }}>
                  <h3><Link to={`/jobs/${job._id}`}>{job.title}</Link></h3>
                  <p className="company" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>{job.company_name}</p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span className="detail-item"><i className="fas fa-map-marker-alt"></i>{job.location}</span>
                    <span className="detail-item"><i className="fas fa-dollar-sign"></i>{formatSalary(job)}</span>
                  </div>
                </div>

                <div className="match-details" style={{ margin: '0 -24px', padding: '16px 24px', background: 'var(--bg-light)', borderRadius: 0 }}>
                  {[['Skills', scores.skill_match], ['Experience', scores.experience_match]].map(([lbl, val]) => (
                    <div className="match-item" key={lbl} style={{ fontSize: 13 }}>
                      <span className="label">{lbl}</span>
                      <div className="progress-bar">
                        <div className="progress" style={{ width: `${val}%`, background: val >= 75 ? 'var(--success-color)' : val >= 50 ? '#f39c12' : 'var(--error-color)' }}></div>
                      </div>
                      <span className="value">{val}%</span>
                    </div>
                  ))}
                </div>

                {/* Skills breakdown */}
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {scores.matched_skills?.length > 0 && (
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--success-color)', fontWeight: 600 }}>✓ Matched: </span>
                      {scores.matched_skills.slice(0, 4).map((s, i) => <span key={i} className="skill-tag matched" style={{ fontSize: 11 }}>{s}</span>)}
                      {scores.matched_skills.length > 4 && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}> +{scores.matched_skills.length - 4}</span>}
                    </div>
                  )}
                  {scores.partial_skills?.length > 0 && (
                    <div>
                      <span style={{ fontSize: 12, color: '#f39c12', fontWeight: 600 }}>~ Partial: </span>
                      {scores.partial_skills.slice(0, 3).map((s, i) => <span key={i} className="skill-tag partial" style={{ fontSize: 11 }}>{s}</span>)}
                    </div>
                  )}
                  {scores.missing_skills?.length > 0 && (
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--error-color)', fontWeight: 600 }}>✗ Missing: </span>
                      {scores.missing_skills.slice(0, 3).map((s, i) => <span key={i} className="skill-tag missing" style={{ fontSize: 11 }}>{s}</span>)}
                    </div>
                  )}
                </div>

                <div className="card-actions" style={{ marginTop: 16 }}>
                  <Link to={`/jobs/${job._id}`} className="btn btn-outline btn-small" style={{ flex: 1 }}>View Details</Link>
                  <Link to={`/jobs/${job._id}/apply`} className="btn btn-primary btn-small" style={{ flex: 1 }}>Apply Now</Link>
                  <button className="btn btn-icon btn-outline" onClick={() => handleSave(job._id)}><i className="fas fa-bookmark"></i></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
