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
  const [expandedApp, setExpandedApp] = useState(null);
  const [profileModal, setProfileModal] = useState(null);
  const { addMessage } = useAuth();

  useEffect(() => {
    axios.get(`/api/jobs/${id}/applicants`).then(res => setData(res.data)).finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (appId, status) => {
    try {
      await axios.put(`/api/applications/${appId}/status`, { status });
      setData(d => ({ ...d, applications: d.applications.map(a => a._id === appId ? {...a, status} : a) }));
      setProfileModal(m => m && m._id === appId ? {...m, status} : m);
      addMessage(`Status updated to ${status}`, 'success');
    } catch(e) {}
  };

  if (loading) return <Loading />;
  if (!data) return null;
  const { job, applications } = data;
  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  const getRankColor = (rank) => { if (rank===1) return '#FFD700'; if (rank===2) return '#C0C0C0'; if (rank===3) return '#CD7F32'; return 'var(--primary-color)'; };
  const getRankLabel = (rank) => { if (rank===1) return '🥇'; if (rank===2) return '🥈'; if (rank===3) return '🥉'; return `#${rank}`; };
  // FIX: use server-assigned rank so tied applicants share the same rank number
  const rankMap = {};
  applications.forEach((app) => { rankMap[app._id] = app.rank || 1; });
  const resolveUrl = (p) => p ? (p.startsWith('http') ? p : `http://localhost:5000${p}`) : null;

  /* ── Full Profile Modal ──────────────────────────────────────────────────── */
  const ProfileModal = ({ app, onClose }) => {
    if (!app) return null;
    const profile = app.applicant?.jobseeker_profile;
    const photoUrl = resolveUrl(app.applicant?.profile_picture);
    const rawResume = app.resume || profile?.resume || '';
    const resumeUrl = resolveUrl(rawResume);
    const resumeFilename = rawResume ? rawResume.split('/').pop() : null;
    const matchScore = app.match_score || 0;
    const rank = rankMap[app._id];
    const email = app.applicant?.email || '';
    const fullName = [app.applicant?.first_name, app.applicant?.last_name].filter(Boolean).join(' ') || app.applicant?.username || 'Unknown';

    // Open mail client — uses window.location.href so it works in all browsers
    const openMail = (e, subject) => {
      e.stopPropagation();
      const uri = subject
        ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
        : `mailto:${email}`;
      window.location.href = uri;
    };

    return (
      <div
        style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.6)',
          backdropFilter:'blur(3px)',display:'flex',alignItems:'center',
          justifyContent:'center',padding:16,overflowY:'auto'}}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Hardcoded white card — no CSS variables so theme cannot interfere */}
        <div
          style={{background:'#ffffff',borderRadius:16,width:'100%',maxWidth:660,
            maxHeight:'92vh',overflowY:'auto',
            boxShadow:'0 24px 60px rgba(0,0,0,0.35)',position:'relative'}}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Gradient header ── */}
          <div style={{background:'linear-gradient(135deg,#6c63ff,#4834d4)',
            padding:'24px 24px 22px',borderRadius:'16px 16px 0 0',position:'relative'}}>
            <button onClick={onClose}
              style={{position:'absolute',top:14,right:14,background:'rgba(255,255,255,0.25)',
                border:'none',borderRadius:'50%',width:34,height:34,cursor:'pointer',
                color:'white',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>

            <div style={{display:'flex',alignItems:'flex-start',gap:16}}>
              {/* Avatar */}
              <div style={{width:74,height:74,borderRadius:'50%',overflow:'hidden',flexShrink:0,
                border:'3px solid rgba(255,255,255,0.85)',background:'rgba(255,255,255,0.2)',
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                {photoUrl
                  ? <img src={photoUrl} alt={fullName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : <span style={{fontSize:28,fontWeight:700,color:'white'}}>
                      {(app.applicant?.first_name?.[0]||app.applicant?.username?.[0]||'?').toUpperCase()}
                    </span>
                }
              </div>
              <div style={{flex:1,minWidth:0}}>
                <h2 style={{color:'#fff',margin:'0 0 2px',fontSize:20,fontWeight:700}}>{fullName}</h2>
                <p style={{color:'rgba(255,255,255,0.75)',fontSize:13,margin:'0 0 10px'}}>@{app.applicant?.username}</p>
                {/* Email button — opens mail client via window.location.href */}
                <button
                  onClick={e => openMail(e)}
                  title="Click to open your email client"
                  style={{display:'inline-flex',alignItems:'center',gap:7,
                    background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.5)',
                    borderRadius:20,padding:'6px 14px',color:'#fff',fontSize:13,
                    fontWeight:500,cursor:'pointer',maxWidth:'100%',
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                    transition:'background 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.35)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'}
                >
                  <i className="fas fa-envelope" style={{fontSize:12,flexShrink:0}}></i>
                  <span style={{overflow:'hidden',textOverflow:'ellipsis'}}>{email}</span>
                </button>
              </div>
              {/* Match score ring */}
              <div style={{textAlign:'center',flexShrink:0}}>
                <div style={{width:62,height:62,borderRadius:'50%',
                  background:`conic-gradient(${matchScore>=70?'#00e5a0':matchScore>=40?'#ffd166':'#ff6b6b'} ${matchScore*3.6}deg, rgba(255,255,255,0.15) 0deg)`,
                  display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 6px'}}>
                  <div style={{width:48,height:48,borderRadius:'50%',background:'rgba(0,0,0,0.3)',
                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:13,fontWeight:800,color:'#fff',lineHeight:1}}>{Math.round(matchScore)}%</span>
                    <span style={{fontSize:9,color:'rgba(255,255,255,0.75)',lineHeight:1.4}}>match</span>
                  </div>
                </div>
                <span style={{background:'rgba(255,255,255,0.22)',color:'#fff',borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>
                  {getRankLabel(rank)} #{rank}
                </span>
              </div>
            </div>
          </div>

          {/* ── Pure white body ── */}
          <div style={{padding:'22px 24px',background:'#ffffff'}}>

            {/* Quick info grid */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginBottom:20}}>
              {[
                {icon:'fa-briefcase',label:'Experience',value:profile?.experience_years!=null?`${profile.experience_years} yr${profile.experience_years!==1?'s':''}`:'Not set'},
                {icon:'fa-map-marker-alt',label:'Location',value:profile?.location||'Not set'},
                {icon:'fa-graduation-cap',label:'Education',value:profile?.education||'Not set'},
                {icon:'fa-check-circle',label:'Available',value:profile?.is_available!==false?'Yes':'No'},
              ].map(({icon,label,value})=>(
                <div key={label} style={{background:'#f5f6fa',borderRadius:10,padding:'10px 14px',border:'1px solid #e2e8f0'}}>
                  <p style={{fontSize:11,color:'#718096',marginBottom:3}}>
                    <i className={`fas ${icon}`} style={{marginRight:4,color:'#6c63ff'}}></i>{label}
                  </p>
                  <p style={{fontSize:13,fontWeight:700,color:'#1a202c',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{value}</p>
                </div>
              ))}
            </div>

            {/* Email contact card */}
            <div style={{background:'#f0f4ff',border:'1.5px solid #6c63ff',borderRadius:12,
              padding:'14px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:42,height:42,borderRadius:'50%',background:'#6c63ff',
                display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <i className="fas fa-envelope" style={{color:'white',fontSize:16}}></i>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:11,color:'#718096',margin:'0 0 3px'}}>Registered Login Email</p>
                <p style={{fontSize:15,fontWeight:700,color:'#1a202c',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{email}</p>
              </div>
              <button
                onClick={e => openMail(e, `Regarding your application for ${job.title}`)}
                style={{display:'inline-flex',alignItems:'center',gap:6,background:'#6c63ff',
                  color:'white',borderRadius:8,padding:'9px 18px',border:'none',
                  fontSize:13,fontWeight:600,flexShrink:0,cursor:'pointer',whiteSpace:'nowrap'}}
              >
                <i className="fas fa-paper-plane"></i> Send Email
              </button>
            </div>

            {/* Skills */}
            {profile?.skills && (
              <div style={{marginBottom:18}}>
                <p style={{fontSize:13,fontWeight:700,marginBottom:8,color:'#1a202c'}}>
                  <i className="fas fa-code" style={{marginRight:6,color:'#6c63ff'}}></i>Skills
                </p>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {profile.skills.split(',').filter(Boolean).map((s,i)=>{
                    const matched = app.matched_skills?.includes(s.trim().toLowerCase());
                    return (
                      <span key={i} style={{fontSize:12,padding:'4px 11px',borderRadius:20,fontWeight:600,
                        background:matched?'#e6fff5':'#f0f4ff',color:matched?'#00875a':'#4a5568',
                        border:`1px solid ${matched?'#00b894':'#cbd5e0'}`}}>
                        {matched && '✓ '}{s.trim()}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Skill match bar */}
            {app.skill_match !== undefined && (
              <div style={{marginBottom:18,padding:'14px 16px',background:'#f5f6fa',borderRadius:10,border:'1px solid #e2e8f0'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8}}>
                  <span style={{fontWeight:700,color:'#1a202c'}}>Skill Match — <em style={{fontStyle:'normal',color:'#6c63ff'}}>{job.title}</em></span>
                  <span style={{fontWeight:700,color:app.skill_match>=70?'#00875a':app.skill_match>=40?'#b7791f':'#c53030'}}>{Math.round(app.skill_match)}%</span>
                </div>
                <div style={{height:10,background:'#e2e8f0',borderRadius:5,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:5,width:`${app.skill_match}%`,transition:'width 0.6s ease',
                    background:app.skill_match>=70?'#00b894':app.skill_match>=40?'#f6ad55':'#fc8181'}}></div>
                </div>
                {app.missing_skills?.length>0 && (
                  <p style={{fontSize:12,color:'#718096',marginTop:8,margin:'8px 0 0'}}>
                    <strong>Missing:</strong> {app.missing_skills.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Resume */}
            <div style={{marginBottom:18}}>
              <p style={{fontSize:13,fontWeight:700,marginBottom:8,color:'#1a202c'}}>
                <i className="fas fa-file-alt" style={{marginRight:6,color:'#6c63ff'}}></i>Resume / CV
              </p>
              {resumeUrl ? (
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'#f0fff4',border:'1.5px solid #00b894',borderRadius:10}}>
                  <div style={{width:42,height:42,borderRadius:8,background:'#00b894',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <i className="fas fa-file-pdf" style={{color:'white',fontSize:18}}></i>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontWeight:700,color:'#00875a',margin:'0 0 2px',fontSize:13}}>Resume Uploaded ✓</p>
                    <p style={{fontSize:12,color:'#4a5568',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{resumeFilename}</p>
                  </div>
                  <a href={resumeUrl} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                    style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',background:'#00b894',color:'white',borderRadius:8,textDecoration:'none',fontSize:13,fontWeight:600,flexShrink:0}}>
                    <i className="fas fa-eye"></i> View
                  </a>
                  <a href={resumeUrl} download onClick={e=>e.stopPropagation()}
                    style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:36,height:36,background:'#fff',border:'1px solid #cbd5e0',borderRadius:8,color:'#4a5568',textDecoration:'none',flexShrink:0}}>
                    <i className="fas fa-download"></i>
                  </a>
                </div>
              ) : (
                <div style={{padding:'12px 16px',background:'#fff5f5',border:'1px solid #fed7d7',borderRadius:10,color:'#c53030',fontSize:13,display:'flex',alignItems:'center',gap:8}}>
                  <i className="fas fa-exclamation-triangle"></i> No resume uploaded by this applicant
                </div>
              )}
            </div>

            {/* Social links */}
            {(profile?.linkedin_url||profile?.github_url) && (
              <div style={{display:'flex',gap:10,marginBottom:18,flexWrap:'wrap'}}>
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                    style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 18px',background:'#0077b5',color:'white',borderRadius:8,textDecoration:'none',fontSize:13,fontWeight:600}}>
                    <i className="fab fa-linkedin"></i> LinkedIn Profile
                  </a>
                )}
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                    style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 18px',background:'#24292e',color:'white',borderRadius:8,textDecoration:'none',fontSize:13,fontWeight:600}}>
                    <i className="fab fa-github"></i> GitHub Profile
                  </a>
                )}
              </div>
            )}

            {/* Cover letter */}
            {app.cover_letter && (
              <div style={{marginBottom:18}}>
                <p style={{fontSize:13,fontWeight:700,marginBottom:8,color:'#1a202c'}}>
                  <i className="fas fa-envelope-open-text" style={{marginRight:6,color:'#6c63ff'}}></i>Cover Letter
                </p>
                <div style={{padding:'14px 16px',background:'#f5f6fa',borderRadius:10,fontSize:14,lineHeight:1.75,color:'#2d3748',border:'1px solid #e2e8f0',whiteSpace:'pre-wrap'}}>
                  {app.cover_letter}
                </div>
              </div>
            )}

            {/* Bio */}
            {app.applicant?.bio && (
              <div style={{marginBottom:18}}>
                <p style={{fontSize:13,fontWeight:700,marginBottom:8,color:'#1a202c'}}>
                  <i className="fas fa-user" style={{marginRight:6,color:'#6c63ff'}}></i>About
                </p>
                <p style={{fontSize:14,color:'#4a5568',lineHeight:1.7,margin:0,padding:'12px 16px',background:'#f5f6fa',borderRadius:10,border:'1px solid #e2e8f0'}}>
                  {app.applicant.bio}
                </p>
              </div>
            )}

            {/* Status + footer */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,paddingTop:16,borderTop:'2px solid #e2e8f0',marginTop:4}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <label style={{fontSize:13,fontWeight:700,color:'#4a5568'}}>Update Status:</label>
                <select className="status-select" value={app.status} onChange={e=>updateStatus(app._id,e.target.value)}>
                  {['pending','reviewed','shortlisted','rejected','hired'].map(s=>
                    <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                  )}
                </select>
              </div>
              <span style={{fontSize:12,color:'#718096'}}>
                <i className="fas fa-clock" style={{marginRight:4}}></i>Applied {timeAgo(app.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      {profileModal && <ProfileModal app={profileModal} onClose={() => setProfileModal(null)} />}

      <div className="page-header">
        <h1><i className="fas fa-users"></i> Applicants for: {job.title}</h1>
        <Link to="/my-jobs" className="btn btn-outline"><i className="fas fa-arrow-left"></i> Back</Link>
      </div>

      {applications.length > 0 && (
        <div style={{background:'linear-gradient(135deg, var(--primary-color), #6c5ce7)', borderRadius:'var(--border-radius)', padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:12, color:'white'}}>
          <i className="fas fa-trophy" style={{fontSize:22}}></i>
          <div>
            <p style={{fontWeight:600, marginBottom:2}}>Applicants Ranked by AI Match Score</p>
            <p style={{fontSize:13, opacity:0.9}}>{applications.length} applicant{applications.length!==1?'s':''} — click <strong>View Full Profile</strong> to see resume, email, and full details</p>
          </div>
        </div>
      )}

      <div className="applicants-filters">
        {['all','pending','reviewed','shortlisted','rejected','hired'].map(s => (
          <button key={s} className={`filter-btn ${filter===s?'active':''}`} onClick={()=>setFilter(s)}>
            {s.charAt(0).toUpperCase()+s.slice(1)} {s==='all'?`(${applications.length})`:`(${applications.filter(a=>a.status===s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><i className="fas fa-users"></i><h3>No applicants {filter!=='all'?`with status: ${filter}`:'yet'}</h3></div>
      ) : filtered.map(app => {
        const profile = app.applicant?.jobseeker_profile;
        const initials = (app.applicant?.first_name?.[0]||'')+(app.applicant?.last_name?.[0]||'')||app.applicant?.username?.[0]?.toUpperCase()||'?';
        const photoUrl = resolveUrl(app.applicant?.profile_picture);
        const rawResume = app.resume||profile?.resume||'';
        const resumeUrl = resolveUrl(rawResume);
        const rank = rankMap[app._id];
        const matchScore = app.match_score||0;
        const isExpanded = expandedApp===app._id;
        const email = app.applicant?.email||'';

        return (
          <div className="applicant-card" key={app._id} style={{border:rank<=3?`2px solid ${getRankColor(rank)}`:'1px solid var(--border-color)', position:'relative', overflow:'visible'}}>
            {/* Rank badge */}
            <div style={{position:'absolute',top:-12,left:16,background:rank<=3?getRankColor(rank):'var(--primary-color)',color:rank===1?'#000':'#fff',borderRadius:20,padding:'2px 12px',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:6,boxShadow:'0 2px 6px rgba(0,0,0,0.2)'}}>
              {getRankLabel(rank)} Rank {rank}
            </div>

            <div className="applicant-header" style={{marginTop:8}}>
              <div className="applicant-info">
                <div style={{width:52,height:52,borderRadius:'50%',overflow:'hidden',flexShrink:0,border:`2px solid ${rank<=3?getRankColor(rank):'var(--border-color)'}`,background:'var(--bg-secondary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'var(--primary-color)'}}>
                  {photoUrl?<img src={photoUrl} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:initials}
                </div>
                <div>
                  <h3 style={{margin:'0 0 2px'}}>
                    {app.applicant?.first_name} {app.applicant?.last_name}
                    <span style={{fontWeight:400,color:'var(--text-secondary)',fontSize:14}}> @{app.applicant?.username}</span>
                  </h3>
                  {/* Clickable email directly below name */}
                  <a href={`mailto:${email}`}
                    title="Click to send email"
                    style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:13,color:'var(--primary-color)',fontWeight:500,textDecoration:'none',marginBottom:4}}
                    onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'}
                    onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>
                    <i className="fas fa-envelope" style={{fontSize:11}}></i>{email}
                  </a>
                  {profile?.experience_years!=null && (
                    <p style={{fontSize:13,color:'var(--text-secondary)',margin:0}}>
                      {profile.experience_years} yr{profile.experience_years!==1?'s':''} experience{profile.location?` · ${profile.location}`:''}
                    </p>
                  )}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                <div style={{width:60,height:60,borderRadius:'50%',background:`conic-gradient(${matchScore>=70?'#00b894':matchScore>=40?'#fdcb6e':'#e17055'} ${matchScore*3.6}deg, var(--bg-secondary) 0deg)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <div style={{width:46,height:46,borderRadius:'50%',background:'var(--bg-card)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:13,fontWeight:700,color:matchScore>=70?'#00b894':matchScore>=40?'#e6a817':'#e17055',lineHeight:1}}>{Math.round(matchScore)}%</span>
                    <span style={{fontSize:9,color:'var(--text-secondary)',lineHeight:1.3}}>match</span>
                  </div>
                </div>
                <StatusBadge status={app.status}/>
              </div>
            </div>

            {/* Skills preview */}
            {profile?.skills && (
              <div style={{margin:'10px 0 8px',display:'flex',flexWrap:'wrap',gap:5}}>
                {profile.skills.split(',').filter(Boolean).slice(0,6).map((s,i)=>{
                  const matched=app.matched_skills?.includes(s.trim().toLowerCase());
                  return <span key={i} style={{fontSize:11,padding:'2px 8px',borderRadius:12,fontWeight:500,background:matched?'#e6f7ee':'var(--bg-secondary)',color:matched?'#00b894':'var(--text-secondary)',border:`1px solid ${matched?'#00b894':'var(--border-color)'}`}}>{matched&&'✓ '}{s.trim()}</span>;
                })}
              </div>
            )}

            {/* Resume quick row */}
            {resumeUrl ? (
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'#f0fff4',border:'1px solid #00b894',borderRadius:8,marginBottom:10,fontSize:13}}>
                <i className="fas fa-file-pdf" style={{color:'#00b894',flexShrink:0}}></i>
                <span style={{flex:1,color:'#00b894',fontWeight:600}}>Resume attached</span>
                <a href={resumeUrl} target="_blank" rel="noreferrer" style={{color:'#00b894',fontSize:12,fontWeight:600,textDecoration:'none'}}><i className="fas fa-eye" style={{marginRight:3}}></i>View</a>
              </div>
            ) : (
              <div style={{padding:'7px 12px',background:'#fff5f5',border:'1px solid #ffcccc',borderRadius:8,marginBottom:10,fontSize:12,color:'#e17055'}}>
                <i className="fas fa-exclamation-circle" style={{marginRight:5}}></i>No resume uploaded
              </div>
            )}

            {/* Cover letter toggle */}
            {app.cover_letter && (
              <div className="cover-letter" style={{marginBottom:10}}>
                <h4 style={{cursor:'pointer',fontSize:13}} onClick={()=>setExpandedApp(isExpanded?null:app._id)}>
                  <i className="fas fa-file-alt" style={{marginRight:5}}></i>Cover Letter
                  <i className={`fas fa-chevron-${isExpanded?'up':'down'}`} style={{fontSize:11,marginLeft:6}}></i>
                </h4>
                {isExpanded && <p style={{fontSize:13,lineHeight:1.6}}>{app.cover_letter}</p>}
              </div>
            )}

            {/* Bottom row */}
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10,flexWrap:'wrap',borderTop:'1px solid var(--border-color)',paddingTop:10}}>
              <button className="btn btn-primary btn-small" onClick={()=>setProfileModal(app)} style={{display:'flex',alignItems:'center',gap:5}}>
                <i className="fas fa-id-card"></i> View Full Profile
              </button>
              <a href={`mailto:${email}?subject=Regarding your application for ${job.title}`} className="btn btn-outline btn-small" style={{display:'inline-flex',alignItems:'center',gap:5}}>
                <i className="fas fa-envelope"></i> Email
              </a>
              <select className="status-select" value={app.status} onChange={e=>updateStatus(app._id,e.target.value)} style={{marginLeft:'auto'}}>
                {['pending','reviewed','shortlisted','rejected','hired'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
              <span style={{fontSize:12,color:'var(--text-light)'}}>{timeAgo(app.createdAt)}</span>
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
