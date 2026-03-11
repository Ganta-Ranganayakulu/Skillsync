import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-section">
            <h3><i className="fas fa-brain"></i> SkillSync</h3>
            <p>AI-powered intelligent job search system that connects job seekers with their dream job using advanced matching algorithms.</p>
            <div className="social-links">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-linkedin-in"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
            </div>
          </div>
          <div className="footer-section">
            <h4>For Job Seekers</h4>
            <ul>
              <li><Link to="/jobs">Browse Jobs</Link></li>
              <li><Link to="/recommendations">AI Recommendations</Link></li>
              <li><Link to="/register">Create Account</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>For Employers</h4>
            <ul>
              <li><Link to="/post-job">Post a Job</Link></li>
              <li><Link to="/find-candidates">Find Candidates</Link></li>
              <li><Link to="/register">Employer Registration</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <ul>
              <li><i className="fas fa-envelope"></i> support@skillsync.com</li>
              <li><i className="fas fa-phone"></i>+91 8978######</li>
              <li><i className="fas fa-map-marker-alt"></i> 1Stree, Macherla andhra pradesh, India</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 SkillSync. All rights reserved. | Powered by SkillSync</p>
        </div>
      </div>
    </footer>
  );
}

export function Messages() {
  const { messages, removeMessage } = useAuth();
  return (
    <div className="messages-container">
      {messages.map(m => (
        <div key={m.id} className={`alert alert-${m.type}`}>
          <i className={`fas fa-${m.type === 'success' ? 'check-circle' : m.type === 'error' ? 'exclamation-circle' : 'info-circle'}`}></i>
          {m.text}
          <button className="close-btn" onClick={() => removeMessage(m.id)}>&times;</button>
        </div>
      ))}
    </div>
  );
}

export function Loading() {
  return <div className="loading"><div className="spinner"></div></div>;
}

export function JobTypeBadge({ type }) {
  const labels = { full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract', internship: 'Internship', freelance: 'Freelance' };
  return <span className={`job-type-badge ${type}`}>{labels[type] || type}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`status-badge ${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

export function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}d ago`;
  return date.toLocaleDateString();
}

export function formatSalary(job) {
  if (job.salary_min && job.salary_max) return `${job.salary_currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`;
  if (job.salary_min) return `${job.salary_currency} ${job.salary_min.toLocaleString()}+`;
  if (job.salary_max) return `Up to ${job.salary_currency} ${job.salary_max.toLocaleString()}`;
  return 'Not disclosed';
}

export function expLabel(level) {
  const m = { entry: 'Entry Level', mid: 'Mid Level', senior: 'Senior Level', lead: 'Lead', manager: 'Manager' };
  return m[level] || level;
}
