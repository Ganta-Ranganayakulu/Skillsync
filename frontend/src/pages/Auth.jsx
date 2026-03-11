import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, addMessage } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.username, form.password);
      addMessage('Login successful!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo"><i className="fas fa-brain"></i> SkillSync</div>
          <h2>Welcome Back!</h2>
          <p>Sign in to continue your job search</p>
        </div>
        {error && <div className="alert alert-error" style={{marginBottom:16}}><i className="fas fa-exclamation-circle"></i> {error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" placeholder="Enter your username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Signing in...</> : <><i className="fas fa-sign-in-alt"></i> Login</>}
          </button>
        </form>
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'jobseeker' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, addMessage } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(form);
      addMessage('Registration successful! Welcome to SkillSync.', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{maxWidth: 500}}>
        <div className="auth-header">
          <div className="logo"><i className="fas fa-brain"></i> SkillSync</div>
          <h2>Create Account</h2>
          <p>Join thousands of professionals finding their dream jobs</p>
        </div>
        {error && <div className="alert alert-error" style={{marginBottom:16}}><i className="fas fa-exclamation-circle"></i> {error}</div>}
        <div style={{marginBottom: 20}}>
          <label style={{display:'block', fontWeight:500, marginBottom:8}}>I am a:</label>
          <div className="role-options">
            <div className={`role-option ${form.role === 'jobseeker' ? 'selected' : ''}`} onClick={() => setForm({...form, role: 'jobseeker'})}>
              <i className="fas fa-user-tie"></i><span>Job Seeker</span>
            </div>
            <div className={`role-option ${form.role === 'jobprovider' ? 'selected' : ''}`} onClick={() => setForm({...form, role: 'jobprovider'})}>
              <i className="fas fa-building"></i><span>Employer</span>
            </div>
          </div>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" placeholder="First name" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" placeholder="Last name" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Username *</label>
            <input type="text" placeholder="Choose a username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input type="password" placeholder="Create a strong password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Creating account...</> : <><i className="fas fa-user-plus"></i> Create Account</>}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
}
