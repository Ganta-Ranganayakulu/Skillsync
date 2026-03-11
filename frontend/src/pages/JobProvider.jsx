import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Loading, timeAgo } from '../components/Common';

const JOB_FORM_DEFAULT = {
  title:'', description:'', requirements:'', responsibilities:'', skills_required:'',
  job_type:'full_time', experience_level:'mid', location:'', salary_min:'', salary_max:'',
  salary_currency:'USD', application_deadline:''
};

export function PostJob({ editMode = false }) {
  const { id } = useParams();
  const [form, setForm] = useState(JOB_FORM_DEFAULT);
  const [loading, setLoading] = useState(editMode);
  const [submitting, setSubmitting] = useState(false);
  const { addMessage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (editMode && id) {
      axios.get(`/api/jobs/${id}`).then(res => {
        const j = res.data.job;
        setForm({ ...JOB_FORM_DEFAULT, ...j, salary_min: j.salary_min||'', salary_max: j.salary_max||'', application_deadline: j.application_deadline ? j.application_deadline.split('T')[0] : '' });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editMode) { await axios.put(`/api/jobs/${id}`, form); addMessage('Job updated!', 'success'); }
      else { await axios.post('/api/jobs', form); addMessage('Job posted successfully!', 'success'); }
      navigate('/my-jobs');
    } catch(err) { addMessage(err.response?.data?.message || 'Error', 'error'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Loading />;
  const f = (field) => ({ value: form[field], onChange: e => setForm({...form, [field]: e.target.value}) });

  return (
    <div className="post-job-page">
      <div className="container">
        <div className="page-header">
          <h1><i className={`fas fa-${editMode ? 'edit' : 'plus-circle'}`}></i> {editMode ? 'Edit Job' : 'Post a New Job'}</h1>
        </div>
        <div className="job-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-group"><label>Job Title *</label><input type="text" placeholder="e.g. Senior React Developer" required {...f('title')} /></div>
              <div className="form-row">
                <div className="form-group">
                  <label>Job Type</label>
                  <select {...f('job_type')}>
                    <option value="full_time">Full Time</option><option value="part_time">Part Time</option>
                    <option value="contract">Contract</option><option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Experience Level</label>
                  <select {...f('experience_level')}>
                    <option value="entry">Entry Level</option><option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option><option value="lead">Lead</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Location *</label><input type="text" placeholder="e.g. New York, NY or Remote" required {...f('location')} /></div>
            </div>
            <div className="form-section">
              <h3>Job Details</h3>
              <div className="form-group"><label>Job Description *</label><textarea rows={6} placeholder="Describe the role, company, and what you're looking for..." required {...f('description')} /></div>
              <div className="form-group"><label>Requirements</label><textarea rows={4} placeholder="List the requirements (one per line or comma-separated)..." {...f('requirements')} /></div>
              <div className="form-group"><label>Responsibilities</label><textarea rows={4} placeholder="List key responsibilities..." {...f('responsibilities')} /></div>
              <div className="form-group"><label>Required Skills *</label><input type="text" placeholder="e.g. React, Node.js, MongoDB (comma-separated)" {...f('skills_required')} /><small>Separate skills with commas. These are used for AI matching.</small></div>
            </div>
            <div className="form-section">
              <h3>Compensation & Deadline</h3>
              <div className="form-row">
                <div className="form-group"><label>Currency</label><select {...f('salary_currency')}><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="INR">INR</option></select></div>
                <div className="form-group"><label>Min Salary</label><input type="number" placeholder="50000" {...f('salary_min')} /></div>
                <div className="form-group"><label>Max Salary</label><input type="number" placeholder="80000" {...f('salary_max')} /></div>
              </div>
              <div className="form-group"><label>Application Deadline</label><input type="date" {...f('application_deadline')} /></div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <><i className="fas fa-spinner fa-spin"></i> {editMode ? 'Updating...' : 'Posting...'}</> : <><i className="fas fa-check"></i> {editMode ? 'Update Job' : 'Post Job'}</>}
              </button>
              <Link to="/my-jobs" className="btn btn-outline">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function MyPostedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addMessage } = useAuth();

  useEffect(() => { axios.get('/api/jobs/my-jobs').then(res => setJobs(res.data)).finally(() => setLoading(false)); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    try {
      await axios.delete(`/api/jobs/${id}`);
      setJobs(j => j.filter(job => job._id !== id));
      addMessage('Job deleted', 'success');
    } catch(e) { addMessage('Error deleting job', 'error'); }
  };

  const handleToggle = async (job) => {
    try {
      await axios.put(`/api/jobs/${job._id}`, { is_active: !job.is_active });
      setJobs(j => j.map(jb => jb._id === job._id ? {...jb, is_active: !jb.is_active} : jb));
    } catch(e) {}
  };

  if (loading) return <Loading />;

  return (
    <div className="container">
      <div className="page-header">
        <h1><i className="fas fa-list"></i> My Posted Jobs</h1>
        <Link to="/post-job" className="btn btn-primary"><i className="fas fa-plus"></i> Post New Job</Link>
      </div>
      {jobs.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-briefcase"></i><h3>No jobs posted yet</h3><p>Post your first job to start finding candidates</p>
          <Link to="/post-job" className="btn btn-primary">Post a Job</Link>
        </div>
      ) : (
        <div className="jobs-table">
          <table>
            <thead><tr><th>Job Title</th><th>Location</th><th>Applications</th><th>Status</th><th>Posted</th><th>Actions</th></tr></thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job._id}>
                  <td><span className="job-title">{job.title}</span></td>
                  <td>{job.location}</td>
                  <td><Link to={`/jobs/${job._id}/applicants`}><span className="application-count">View Applicants</span></Link></td>
                  <td><span className={`status-badge ${job.is_active ? 'active' : 'inactive'}`}>{job.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>{timeAgo(job.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/jobs/${job._id}/edit`} className="btn btn-small btn-outline"><i className="fas fa-edit"></i></Link>
                      <button className="btn btn-small btn-secondary" onClick={() => handleToggle(job)}>{job.is_active ? 'Deactivate' : 'Activate'}</button>
                      <button className="btn btn-small btn-danger" onClick={() => handleDelete(job._id)}><i className="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ManageApplicants() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { addMessage } = useAuth();

  useEffect(() => { axios.get(`/api/jobs/${id}/applicants`).then(res => setData(res.data)).finally(() => setLoading(false)); }, [id]);

  const updateStatus = async (appId, status) => {
    try {
      await axios.put(`/api/applications/${appId}/status`, { status });
      setData(d => ({ ...d, applications: d.applications.map(a => a._id === appId ? {...a, status} : a) }));
      addMessage(`Status updated to ${status}`, 'success');
    } catch(e) {}
  };

  if (loading) return <Loading />;
  if (!data) return null;
  const { job, applications } = data;
  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  return (
    <div className="container">
      <div className="page-header">
        <h1><i className="fas fa-users"></i> Applicants for: {job.title}</h1>
        <Link to="/my-jobs" className="btn btn-outline"><i className="fas fa-arrow-left"></i> Back</Link>
      </div>
      <div className="applicants-filters">
        {['all','pending','reviewed','shortlisted','rejected','hired'].map(s => (
          <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)} {s === 'all' ? `(${applications.length})` : `(${applications.filter(a=>a.status===s).length})`}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><i className="fas fa-users"></i><h3>No applicants {filter !== 'all' ? `with status: ${filter}` : 'yet'}</h3></div>
      ) : filtered.map(app => {
        const profile = app.applicant?.jobseeker_profile;
        const initials = (app.applicant?.first_name?.[0] || '') + (app.applicant?.last_name?.[0] || '') || app.applicant?.username?.[0]?.toUpperCase() || '?';
        return (
          <div className="applicant-card" key={app._id}>
            <div className="applicant-header">
              <div className="applicant-info">
                <div className="applicant-avatar-placeholder">{initials}</div>
                <div>
                  <h3>{app.applicant?.first_name} {app.applicant?.last_name} <span style={{fontWeight:400, color:'var(--text-secondary)'}}>@{app.applicant?.username}</span></h3>
                  <p className="email">{app.applicant?.email}</p>
                  {profile?.experience_years != null && <p style={{fontSize:13, color:'var(--text-secondary)'}}>{profile.experience_years} years experience</p>}
                </div>
              </div>
              <StatusBadge status={app.status} />
            </div>
            {profile?.skills && (
              <div style={{marginBottom:12}}>
                <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                  {profile.skills.split(',').filter(Boolean).slice(0,8).map((s,i) => <span key={i} className="skill-tag">{s.trim()}</span>)}
                </div>
              </div>
            )}
            {app.cover_letter && (
              <div className="cover-letter"><h4>Cover Letter</h4><p>{app.cover_letter}</p></div>
            )}
            <div style={{display:'flex', alignItems:'center', gap:16, marginTop:16}}>
              <select className="status-select" value={app.status} onChange={e => updateStatus(app._id, e.target.value)}>
                {['pending','reviewed','shortlisted','rejected','hired'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
              <span style={{fontSize:13, color:'var(--text-light)'}}>Applied {timeAgo(app.createdAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FindCandidates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ jobs: [], candidates: [], selected_job: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = searchParams.get('job') ? { job_id: searchParams.get('job') } : {};
    axios.get('/api/jobs/candidates/find', { params }).then(res => setData(res.data)).finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) return <Loading />;

  return (
    <div className="container">
      <div className="page-header"><h1><i className="fas fa-users"></i> Find Candidates</h1></div>
      <div className="card" style={{marginBottom:24}}>
        <div className="form-group" style={{marginBottom:0}}>
          <label>Select a Job to Find Matching Candidates</label>
          <select style={{width:'100%', padding:'12px 16px', border:'2px solid var(--border-color)', borderRadius:'var(--border-radius)', fontFamily:'inherit', fontSize:14}} value={searchParams.get('job') || ''} onChange={e => e.target.value ? setSearchParams({job: e.target.value}) : setSearchParams({})}>
            <option value="">-- Select a Job --</option>
            {data.jobs.map(job => <option key={job._id} value={job._id}>{job.title}</option>)}
          </select>
        </div>
      </div>
      {data.selected_job && (
        <>
          <h2 style={{marginBottom:16}}>Matching Candidates for: {data.selected_job.title}</h2>
          {data.candidates.length === 0 ? (
            <div className="empty-state"><i className="fas fa-user-slash"></i><h3>No matching candidates found</h3><p>No candidates with at least 30% skill match were found</p></div>
          ) : data.candidates.map(({candidate, match_score, matched_skills}) => {
            const initials = (candidate.first_name?.[0]||'') + (candidate.last_name?.[0]||'') || candidate.username?.[0]?.toUpperCase() || '?';
            return (
              <div className="candidate-card" key={candidate._id}>
                <div className="candidate-header">
                  <div className="candidate-info">
                    <div className="candidate-avatar">{initials}</div>
                    <div>
                      <h3>{candidate.first_name} {candidate.last_name} <span style={{fontWeight:400, color:'var(--text-secondary)'}}>@{candidate.username}</span></h3>
                      <p style={{color:'var(--text-secondary)', fontSize:14}}>{candidate.email}</p>
                      {candidate.jobseeker_profile?.experience_years != null && <p style={{fontSize:13}}>{candidate.jobseeker_profile.experience_years} years exp &bull; {candidate.jobseeker_profile.location || 'Location not set'}</p>}
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'1.5rem', fontWeight:700, color:'var(--primary-color)'}}>{Math.round(match_score)}%</div>
                    <div style={{fontSize:12, color:'var(--text-secondary)'}}>Match Score</div>
                  </div>
                </div>
                {matched_skills.length > 0 && (
                  <div>
                    <p style={{fontSize:13, fontWeight:500, marginBottom:8}}>Matched Skills:</p>
                    <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                      {matched_skills.map((s,i) => <span key={i} className="skill-tag matched">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
      {!data.selected_job && data.jobs.length > 0 && (
        <div className="empty-state"><i className="fas fa-search"></i><h3>Select a job to find candidates</h3><p>Choose one of your active jobs to see AI-matched candidates</p></div>
      )}
    </div>
  );
}
