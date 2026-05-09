import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const profilePhotoUrl = user?.profile_picture ? `http://localhost:5000${user.profile_picture}` : null;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-brand">
          <Link to="/"><i className="fas fa-brain"></i> SkillSync</Link>
        </div>
        <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <Link to="/jobs" className="nav-link" onClick={() => setMenuOpen(false)}>
            <i className="fas fa-briefcase"></i> Find Jobs
          </Link>
          {user ? (
            <>
              {user.role === 'jobseeker' ? (
                <>
                  <Link to="/recommendations" className="nav-link" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-robot"></i> AI Recommendations
                  </Link>
                  <Link to="/my-applications" className="nav-link" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-paper-plane"></i> My Applications
                  </Link>
                  <Link to="/saved-jobs" className="nav-link" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-bookmark"></i> Saved Jobs
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/post-job" className="nav-link" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-plus-circle"></i> Post Job
                  </Link>
                  <Link to="/my-jobs" className="nav-link" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-list"></i> My Jobs
                  </Link>
                  <Link to="/find-candidates" className="nav-link" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-users"></i> Find Candidates
                  </Link>
                </>
              )}
              <div className="nav-dropdown">
                <button className="nav-link dropdown-toggle" style={{display:'flex', alignItems:'center', gap:8}}>
                  {/* Profile Photo in Navbar */}
                  <div style={{
                    width:32, height:32, borderRadius:'50%', overflow:'hidden',
                    border:'2px solid var(--primary-color)', background:'var(--bg-secondary)',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
                  }}>
                    {profilePhotoUrl
                      ? <img
                          src={profilePhotoUrl}
                          alt={user.username}
                          style={{width:'100%',height:'100%',objectFit:'cover'}}
                          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                        />
                      : null
                    }
                    <span style={{
                      display: profilePhotoUrl ? 'none' : 'flex',
                      alignItems:'center', justifyContent:'center',
                      width:'100%', height:'100%',
                      fontSize:13, fontWeight:700, color:'var(--primary-color)',
                      background:'var(--primary-light)'
                    }}>
                      {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
                    </span>
                  </div>
                  <span style={{maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                    {user.first_name || user.username}
                  </span>
                </button>
                <div className="dropdown-content">
                  {/* Mini profile card in dropdown */}
                  <div style={{padding:'12px 16px', borderBottom:'1px solid var(--border-color)', display:'flex', alignItems:'center', gap:10, pointerEvents:'none'}}>
                    <div style={{
                      width:40, height:40, borderRadius:'50%', overflow:'hidden',
                      border:'2px solid var(--primary-color)', background:'var(--bg-secondary)',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
                    }}>
                      {profilePhotoUrl
                        ? <img src={profilePhotoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        : <span style={{fontSize:16, fontWeight:700, color:'var(--primary-color)'}}>
                            {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
                          </span>
                      }
                    </div>
                    <div style={{overflow:'hidden'}}>
                      <p style={{fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                      </p>
                      <p style={{fontSize:11, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{user.email}</p>
                    </div>
                  </div>
                  <Link to="/dashboard"><i className="fas fa-tachometer-alt"></i> Dashboard</Link>
                  <Link to="/profile"><i className="fas fa-id-card"></i> Profile</Link>
                  <a onClick={handleLogout} style={{cursor:'pointer'}}><i className="fas fa-sign-out-alt"></i> Logout</a>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link btn-login" onClick={() => setMenuOpen(false)}>
                <i className="fas fa-sign-in-alt"></i> Login
              </Link>
              <Link to="/register" className="nav-link btn-register" onClick={() => setMenuOpen(false)}>
                <i className="fas fa-user-plus"></i> Register
              </Link>
            </>
          )}
        </div>
        <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
          <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>
    </nav>
  );
}
