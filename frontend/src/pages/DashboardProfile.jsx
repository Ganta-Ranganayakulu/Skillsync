import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Loading, timeAgo } from '../components/Common';

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return navigate('/login');
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      if (user.role === 'jobseeker') {
        const [apps, saved] = await Promise.all([
          axios.get('/api/applications/my/list'),
          axios.get('/api/jobs/saved/list')
        ]);
        setStats({ applications: apps.data.length, saved: saved.data.length, shortlisted: apps.data.filter(a => a.status === 'shortlisted').length });
        setRecent(apps.data.slice(0, 5));
      } else {
        const jobs = await axios.get('/api/jobs/my-jobs');
        setStats({ jobs: jobs.data.length, active: jobs.data.filter(j => j.is_active).length });
        setRecent(jobs.data.slice(0, 5));
      }
    } catch(e) {} finally { setLoading(false); }
  };

  if (loading) return <Loading />;

  const profilePhotoUrl = user.profile_picture ? (user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:5000${user.profile_picture}`) : null;
  const resumeUrl = user.jobseeker_profile?.resume ? (user.jobseeker_profile.resume.startsWith('http') ? user.jobseeker_profile.resume : `http://localhost:5000${user.jobseeker_profile.resume}`) : null;

  return (
    <div className="container">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1>Welcome back, {user.first_name || user.username}! 👋</h1>
            <p>{user.role === 'jobseeker' ? 'Track your job applications and discover new opportunities' : 'Manage your job postings and review candidates'}</p>
          </div>
          <Link to="/profile" className="btn btn-outline"><i className="fas fa-id-card"></i> Edit Profile</Link>
        </div>

        {/* Profile Summary Card */}
        <div style={{
          background:'var(--bg-secondary)', borderRadius:'var(--border-radius)', padding:20,
          marginBottom:24, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap',
          border:'1px solid var(--border-color)'
        }}>
          <div style={{
            width:72, height:72, borderRadius:'50%', overflow:'hidden', flexShrink:0,
            border:'3px solid var(--primary-color)', background:'var(--bg-card)',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            {profilePhotoUrl
              ? <img src={profilePhotoUrl} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover'}} />
              : <i className="fas fa-user" style={{fontSize:30, color:'var(--text-secondary)'}}></i>
            }
          </div>
          <div style={{flex:1}}>
            <p style={{fontWeight:600, fontSize:16}}>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</p>
            <p style={{fontSize:13, color:'var(--text-secondary)', marginBottom:4}}>{user.email}</p>
            {user.role === 'jobseeker' && (
              <div style={{display:'flex', gap:12, flexWrap:'wrap', marginTop:4}}>
                {user.jobseeker_profile?.skills && (
                  <span style={{fontSize:12, color:'var(--primary-color)', background:'var(--primary-light)', padding:'2px 8px', borderRadius:20}}>
                    <i className="fas fa-code" style={{marginRight:4}}></i>{user.jobseeker_profile.skills.split(',').slice(0,3).join(', ')}
                  </span>
                )}
                {resumeUrl
                  ? <a href={resumeUrl} target="_blank" rel="noreferrer" style={{fontSize:12, color:'var(--success-color)', background:'#e6f7ee', padding:'2px 10px', borderRadius:20, textDecoration:'none'}}>
                      <i className="fas fa-file-pdf" style={{marginRight:4}}></i>Resume uploaded
                    </a>
                  : <span style={{fontSize:12, color:'var(--error-color)', background:'#fff0f0', padding:'2px 10px', borderRadius:20}}>
                      <i className="fas fa-exclamation-circle" style={{marginRight:4}}></i>No resume — <Link to="/profile" style={{color:'var(--error-color)'}}>upload now</Link>
                    </span>
                }
              </div>
            )}
            {user.role === 'jobprovider' && user.company_profile?.company_name && (
              <span style={{fontSize:13, color:'var(--text-secondary)'}}><i className="fas fa-building" style={{marginRight:4}}></i>{user.company_profile.company_name}</span>
            )}
          </div>
          <Link to="/profile" className="btn btn-outline" style={{fontSize:13}}>
            <i className="fas fa-edit"></i> Edit
          </Link>
        </div>

        <div className="dashboard-stats">
          {user.role === 'jobseeker' ? (
            <>
              <div className="stat-card"><div className="stat-icon applications"><i className="fas fa-paper-plane"></i></div><div><div className="stat-value">{stats.applications || 0}</div><div className="stat-label">Applications</div></div></div>
              <div className="stat-card"><div className="stat-icon saved"><i className="fas fa-bookmark"></i></div><div><div className="stat-value">{stats.saved || 0}</div><div className="stat-label">Saved Jobs</div></div></div>
              <div className="stat-card"><div className="stat-icon shortlisted"><i className="fas fa-star"></i></div><div><div className="stat-value">{stats.shortlisted || 0}</div><div className="stat-label">Shortlisted</div></div></div>
            </>
          ) : (
            <>
              <div className="stat-card"><div className="stat-icon jobs"><i className="fas fa-briefcase"></i></div><div><div className="stat-value">{stats.jobs || 0}</div><div className="stat-label">Posted Jobs</div></div></div>
              <div className="stat-card"><div className="stat-icon applications"><i className="fas fa-check-circle"></i></div><div><div className="stat-value">{stats.active || 0}</div><div className="stat-label">Active Jobs</div></div></div>
            </>
          )}
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-section">
            <div className="section-header">
              <h2><i className={`fas fa-${user.role === 'jobseeker' ? 'paper-plane' : 'briefcase'}`}></i> {user.role === 'jobseeker' ? 'Recent Applications' : 'Recent Job Postings'}</h2>
              <Link to={user.role === 'jobseeker' ? '/my-applications' : '/my-jobs'} className="view-all">View All</Link>
            </div>
            {recent.length === 0 ? (
              <p style={{color:'var(--text-secondary)', textAlign:'center', padding:20}}>No {user.role === 'jobseeker' ? 'applications' : 'jobs'} yet</p>
            ) : recent.map(item => (
              <div key={item._id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border-color)'}}>
                <div>
                  <p style={{fontWeight:500}}>{user.role === 'jobseeker' ? item.job?.title : item.title}</p>
                  <p style={{fontSize:13, color:'var(--text-secondary)'}}>{user.role === 'jobseeker' ? item.job?.company_name : item.location} &bull; {timeAgo(item.createdAt)}</p>
                </div>
                {user.role === 'jobseeker' ? <StatusBadge status={item.status} /> : <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>{item.is_active ? 'Active' : 'Inactive'}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            {user.role === 'jobseeker' ? (
              <>
                <div className="action-card" onClick={() => navigate('/jobs')}><div className="action-icon"><i className="fas fa-search"></i></div><span>Browse Jobs</span></div>
                <div className="action-card" onClick={() => navigate('/my-applications')}><div className="action-icon"><i className="fas fa-paper-plane"></i></div><span>My Applications</span></div>
                <div className="action-card" onClick={() => navigate('/saved-jobs')}><div className="action-icon"><i className="fas fa-bookmark"></i></div><span>Saved Jobs</span></div>
                <div className="action-card" onClick={() => navigate('/profile')}><div className="action-icon"><i className="fas fa-user-edit"></i></div><span>Update Profile</span></div>
              </>
            ) : (
              <>
                <div className="action-card" onClick={() => navigate('/post-job')}><div className="action-icon"><i className="fas fa-plus-circle"></i></div><span>Post a Job</span></div>
                <div className="action-card" onClick={() => navigate('/my-jobs')}><div className="action-icon"><i className="fas fa-list"></i></div><span>My Jobs</span></div>
                <div className="action-card" onClick={() => navigate('/find-candidates')}><div className="action-icon"><i className="fas fa-users"></i></div><span>Find Candidates</span></div>
                <div className="action-card" onClick={() => navigate('/profile')}><div className="action-icon"><i className="fas fa-building"></i></div><span>Company Profile</span></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const fileUrl = (p) => p ? (p.startsWith('http') ? p : `${API_BASE}${p}`) : null;

export function Profile() {
  const { user, refreshUser, addMessage } = useAuth();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Photo state
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Resume state
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumePreview, setResumePreview] = useState(null); // { name, url } after instant upload

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '', last_name: user.last_name || '',
        phone: user.phone || '', address: user.address || '', bio: user.bio || '',
        jobseeker_profile: { ...user.jobseeker_profile },
        company_profile: { ...user.company_profile }
      });
      setPhotoPreview(fileUrl(user.profile_picture));
      // If user already has a resume, show it
      if (user.jobseeker_profile?.resume) {
        const url = fileUrl(user.jobseeker_profile.resume);
        setResumePreview({ name: user.jobseeker_profile.resume.split('/').pop(), url });
      } else {
        setResumePreview(null);
      }
    }
  }, [user]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Show local preview right away
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('profile_picture', file);
      const res = await axios.post('/api/profile/upload-photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await refreshUser();
      addMessage('Profile photo updated!', 'success');
      setPhotoPreview(fileUrl(res.data.profile_picture));
    } catch (err) {
      addMessage(err.response?.data?.message || 'Failed to upload photo', 'error');
      setPhotoPreview(fileUrl(user?.profile_picture));
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  // ── Instant resume upload (uploads immediately on file select) 
  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeUploading(true);
    // Show pending state with file name
    setResumePreview({ name: file.name, url: null, uploading: true });
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await axios.post('/api/profile/upload-resume', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await refreshUser();
      const url = fileUrl(res.data.resume);
      setResumePreview({ name: file.name, url });
      addMessage('Resume uploaded successfully!', 'success');
    } catch (err) {
      addMessage(err.response?.data?.message || 'Failed to upload resume. Use PDF, DOC, or DOCX under 5MB.', 'error');
      // Restore previous resume if any
      const prev = user?.jobseeker_profile?.resume;
      setResumePreview(prev ? { name: prev.split('/').pop(), url: fileUrl(prev) } : null);
    } finally {
      setResumeUploading(false);
      e.target.value = '';
    }
  };

  // ── Save profile text fields ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      fd.append('first_name', form.first_name || '');
      fd.append('last_name', form.last_name || '');
      fd.append('phone', form.phone || '');
      fd.append('address', form.address || '');
      fd.append('bio', form.bio || '');
      if (user.role === 'jobseeker') fd.append('jobseeker_profile', JSON.stringify(form.jobseeker_profile));
      if (user.role === 'jobprovider') fd.append('company_profile', JSON.stringify(form.company_profile));
      await axios.put('/api/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      addMessage('Profile saved successfully!', 'success');
    } catch(err) { addMessage(err.response?.data?.message || 'Error saving profile', 'error'); }
    finally { setSaving(false); }
  };

  const setProfile = (field, val) => setForm(f => ({ ...f, jobseeker_profile: {...f.jobseeker_profile, [field]: val} }));
  const setCompany = (field, val) => setForm(f => ({ ...f, company_profile: {...f.company_profile, [field]: val} }));
  const f = (field) => ({ value: form[field] || '', onChange: e => setForm({...form, [field]: e.target.value}) });

  if (!user) return <Loading />;

  return (
    <div className="profile-page">
      <div className="container" style={{maxWidth: 800}}>
        <div className="page-header"><h1><i className="fas fa-id-card"></i> My Profile</h1></div>
        <div className="profile-card">
          <div className="card-header"><h2><i className="fas fa-user"></i> Profile Information</h2></div>
          <form className="profile-form" onSubmit={handleSubmit}>

            {/* ── Profile Photo ─────────────────────────────────────────── */}
            <div className="form-section">
              <h3><i className="fas fa-camera" style={{marginRight:8}}></i>Profile Photo</h3>
              <div style={{display:'flex', alignItems:'center', gap:24, flexWrap:'wrap'}}>
                <div style={{
                  width:100, height:100, borderRadius:'50%', overflow:'hidden', position:'relative',
                  border:'3px solid var(--primary-color)', background:'var(--bg-secondary)',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
                }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="Profile" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    : <i className="fas fa-user" style={{fontSize:40, color:'var(--text-secondary)'}}></i>
                  }
                  {photoUploading && (
                    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%'}}>
                      <i className="fas fa-spinner fa-spin" style={{color:'white',fontSize:20}}></i>
                    </div>
                  )}
                </div>
                <div style={{flex:1}}>
                  <label style={{
                    display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px',
                    background: photoUploading ? 'var(--bg-secondary)' : 'var(--primary-color)',
                    color: photoUploading ? 'var(--text-secondary)' : 'white',
                    borderRadius:'var(--border-radius)', cursor: photoUploading ? 'not-allowed' : 'pointer',
                    fontWeight:500, fontSize:14, border:'none'
                  }}>
                    <i className={`fas fa-${photoUploading ? 'spinner fa-spin' : 'camera'}`}></i>
                    {photoUploading ? 'Uploading...' : photoPreview ? 'Change Photo' : 'Upload Photo'}
                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{display:'none'}} disabled={photoUploading} />
                  </label>
                  <p style={{marginTop:8, fontSize:12, color:'var(--text-secondary)'}}>
                    <i className="fas fa-info-circle" style={{marginRight:4}}></i>
                    JPG, PNG or GIF — max 5MB. Photo uploads instantly and shows in the navbar.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Basic Info ────────────────────────────────────────────── */}
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-row">
                <div className="form-group"><label>First Name</label><input type="text" {...f('first_name')} /></div>
                <div className="form-group"><label>Last Name</label><input type="text" {...f('last_name')} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Phone</label><input type="tel" {...f('phone')} /></div>
                <div className="form-group"><label>Address</label><input type="text" {...f('address')} /></div>
              </div>
              <div className="form-group"><label>Bio</label><textarea rows={3} value={form.bio || ''} onChange={e => setForm({...form, bio: e.target.value})} /></div>
            </div>

            {/* ── Job Seeker fields ─────────────────────────────────────── */}
            {user.role === 'jobseeker' && (
              <div className="form-section">
                <h3>Job Seeker Profile</h3>
                <div className="form-group">
                  <label>Skills (comma-separated)</label>
                  <input type="text" value={form.jobseeker_profile?.skills || ''} onChange={e => setProfile('skills', e.target.value)} placeholder="React, Node.js, MongoDB..." />
                  <small>These skills are used for AI job matching and ranking</small>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Experience (years)</label><input type="number" min={0} value={form.jobseeker_profile?.experience_years || 0} onChange={e => setProfile('experience_years', Number(e.target.value))} /></div>
                  <div className="form-group"><label>Location</label><input type="text" value={form.jobseeker_profile?.location || ''} onChange={e => setProfile('location', e.target.value)} /></div>
                </div>
                <div className="form-group"><label>Education</label><textarea rows={2} value={form.jobseeker_profile?.education || ''} onChange={e => setProfile('education', e.target.value)} /></div>
                <div className="form-row">
                  <div className="form-group"><label>LinkedIn URL</label><input type="url" value={form.jobseeker_profile?.linkedin_url || ''} onChange={e => setProfile('linkedin_url', e.target.value)} /></div>
                  <div className="form-group"><label>GitHub URL</label><input type="url" value={form.jobseeker_profile?.github_url || ''} onChange={e => setProfile('github_url', e.target.value)} /></div>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={form.jobseeker_profile?.is_available !== false} onChange={e => setProfile('is_available', e.target.checked)} />
                    Available for work
                  </label>
                </div>

                {/* ── Resume Upload (instant, standalone) ─────────────── */}
                <div style={{
                  marginTop:20, borderRadius:'var(--border-radius)',
                  border:'2px solid var(--primary-color)', overflow:'hidden'
                }}>
                  {/* Header */}
                  <div style={{background:'var(--primary-color)', padding:'12px 20px', display:'flex', alignItems:'center', gap:10}}>
                    <i className="fas fa-file-alt" style={{color:'white', fontSize:18}}></i>
                    <div>
                      <p style={{color:'white', fontWeight:700, fontSize:15, margin:0}}>Resume / CV</p>
                      <p style={{color:'rgba(255,255,255,0.8)', fontSize:12, margin:0}}>Automatically attached to every job application</p>
                    </div>
                  </div>

                  <div style={{padding:20, background:'var(--bg-card)'}}>
                    {/* Current resume display */}
                    {resumePreview ? (
                      <div style={{
                        display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
                        background: resumePreview.uploading ? '#fff9e6' : '#f0fff4',
                        border:`1px solid ${resumePreview.uploading ? '#f39c12' : '#00b894'}`,
                        borderRadius:'var(--border-radius)', marginBottom:16
                      }}>
                        <div style={{
                          width:44, height:44, borderRadius:8, flexShrink:0,
                          background: resumePreview.uploading ? '#f39c12' : '#00b894',
                          display:'flex', alignItems:'center', justifyContent:'center'
                        }}>
                          {resumePreview.uploading
                            ? <i className="fas fa-spinner fa-spin" style={{color:'white', fontSize:18}}></i>
                            : <i className="fas fa-file-pdf" style={{color:'white', fontSize:20}}></i>
                          }
                        </div>
                        <div style={{flex:1, minWidth:0}}>
                          <p style={{fontWeight:600, fontSize:14, margin:'0 0 2px', color: resumePreview.uploading ? '#f39c12' : '#00b894'}}>
                            {resumePreview.uploading ? 'Uploading resume...' : 'Resume uploaded ✓'}
                          </p>
                          <p style={{fontSize:12, color:'var(--text-secondary)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                            {resumePreview.name}
                          </p>
                        </div>
                        {resumePreview.url && !resumePreview.uploading && (
                          <a href={resumePreview.url} target="_blank" rel="noreferrer"
                            className="btn btn-small btn-outline" style={{flexShrink:0}}>
                            <i className="fas fa-eye"></i> View
                          </a>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        padding:'16px', background:'#fff5f5', border:'1px solid #ffcccc',
                        borderRadius:'var(--border-radius)', marginBottom:16,
                        display:'flex', alignItems:'center', gap:10
                      }}>
                        <i className="fas fa-exclamation-triangle" style={{color:'#e17055', fontSize:18, flexShrink:0}}></i>
                        <p style={{fontSize:13, color:'#c0392b', margin:0}}>
                          No resume uploaded yet. Recruiters will not be able to view your resume.
                        </p>
                      </div>
                    )}

                    {/* Upload button */}
                    <label style={{
                      display:'inline-flex', alignItems:'center', gap:10, padding:'12px 24px',
                      background: resumeUploading ? 'var(--bg-secondary)' : 'var(--primary-color)',
                      color: resumeUploading ? 'var(--text-secondary)' : 'white',
                      borderRadius:'var(--border-radius)', cursor: resumeUploading ? 'not-allowed' : 'pointer',
                      fontWeight:600, fontSize:14, border:'none', transition:'all 0.2s'
                    }}>
                      <i className={`fas fa-${resumeUploading ? 'spinner fa-spin' : resumePreview && !resumePreview.uploading ? 'sync-alt' : 'upload'}`}></i>
                      {resumeUploading ? 'Uploading...' : resumePreview && !resumePreview.uploading ? 'Replace Resume' : 'Upload Resume'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeChange}
                        style={{display:'none'}}
                        disabled={resumeUploading}
                      />
                    </label>
                    <p style={{marginTop:10, fontSize:12, color:'var(--text-secondary)'}}>
                      <i className="fas fa-info-circle" style={{marginRight:4}}></i>
                      PDF, DOC, or DOCX only — max 5MB. Resume uploads instantly without needing to save the form.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Job Provider fields ───────────────────────────────────── */}
            {user.role === 'jobprovider' && (
              <div className="form-section">
                <h3>Company Profile</h3>
                <div className="form-group"><label>Company Name</label><input type="text" value={form.company_profile?.company_name || ''} onChange={e => setCompany('company_name', e.target.value)} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Industry</label><input type="text" value={form.company_profile?.industry || ''} onChange={e => setCompany('industry', e.target.value)} /></div>
                  <div className="form-group">
                    <label>Company Size</label>
                    <select value={form.company_profile?.company_size || ''} onChange={e => setCompany('company_size', e.target.value)}>
                      <option value="">Select size</option>
                      {['1-10','11-50','51-200','201-500','501-1000','1000+'].map(s => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Website</label><input type="url" value={form.company_profile?.company_website || ''} onChange={e => setCompany('company_website', e.target.value)} /></div>
                  <div className="form-group"><label>Headquarters</label><input type="text" value={form.company_profile?.headquarters || ''} onChange={e => setCompany('headquarters', e.target.value)} /></div>
                </div>
                <div className="form-group"><label>Company Description</label><textarea rows={3} value={form.company_profile?.company_description || ''} onChange={e => setCompany('company_description', e.target.value)} /></div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Profile</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
