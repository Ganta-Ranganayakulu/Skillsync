import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { JobTypeBadge, formatSalary } from '../components/Common';

export default function Home() {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [search, setSearch] = useState({ q: '', job_type: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/jobs?limit=6').then(res => setFeaturedJobs(res.data.jobs || [])).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(Object.fromEntries(Object.entries(search).filter(([, v]) => v)));
    navigate(`/jobs?${params}`);
  };

  const handleGetStarted = () => {
    if (user) navigate('/dashboard');
    else navigate('/register');
  };

  const handleFindJobs = () => navigate('/jobs');

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge"><i className="fas fa-robot"></i> AI-Powered Job Matching</div>
          <h1>Find Your <span className="highlight" style={{ color: '#fff', textDecoration: 'underline' }}>Dream Job</span><br />with AI Intelligence</h1>
          <p>SkillSync uses advanced AI to match your skills with the perfect job opportunities</p>
          <div className="hero-buttons">
            <button onClick={handleFindJobs} className="btn btn-primary">
              <i className="fas fa-search"></i> Find Jobs
            </button>
            <button onClick={handleGetStarted} className="btn btn-outline">
              <i className="fas fa-user-plus"></i> {user ? 'Go to Dashboard' : 'Get Started Free'}
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item"><span className="stat-number">10K+</span><span className="stat-label">Active Jobs</span></div>
            <div className="stat-item"><span className="stat-number">50K+</span><span className="stat-label">Job Seekers</span></div>
            <div className="stat-item"><span className="stat-number">5K+</span><span className="stat-label">Companies</span></div>
            <div className="stat-item"><span className="stat-number">95%</span><span className="stat-label">Match Rate</span></div>
          </div>
        </div>
      </section>

      {/* ── Quick Search ── */}
      <section className="container">
        <div className="quick-search">
          <div className="search-box">
            <form onSubmit={handleSearch}>
              <div className="search-row">
                <div className="search-field">
                  <i className="fas fa-search"></i>
                  <input type="text" placeholder="Job title, skills, or keywords" value={search.q} onChange={e => setSearch({ ...search, q: e.target.value })} />
                </div>

                <div className="search-field small">
                  <i className="fas fa-briefcase"></i>
                  <select value={search.job_type} onChange={e => setSearch({ ...search, job_type: e.target.value })}>
                    <option value="">All Types</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-search"><i className="fas fa-search"></i> Search</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge"><i className="fas fa-star"></i> Why SkillSync</span>
            <h2>Intelligent Job Matching <span className="highlight">Powered by AI</span></h2>
            <p>Our advanced AI algorithms analyze your skills and experience to find the perfect match</p>
          </div>
          <div className="features-grid">
            {[
              { icon: 'fa-robot', title: 'AI-Powered Matching', desc: 'Our AI agent semantically analyzes your skills to find jobs with the highest compatibility score — not just keyword matching.' },
              { icon: 'fa-chart-line', title: 'Skill Gap Analysis', desc: 'Get detailed insights on matched, partial, and missing skills with clear guidance on how to close the gaps.' },
              { icon: 'fa-comment-dots', title: 'SkillBot Assistant', desc: 'Get instant answers from our AI chatbot on resume tips, interview prep, salary negotiation and more.' },
              { icon: 'fa-users', title: 'For Employers', desc: 'Find the best candidates with AI-powered matching that ranks applicants by semantic skill compatibility.' },
              { icon: 'fa-shield-alt', title: 'Verified Companies', desc: 'All job postings are from verified companies to ensure a safe and trustworthy job search experience.' },
              { icon: 'fa-rocket', title: 'Fast Apply', desc: 'Apply to multiple jobs quickly with your saved profile and auto-attached resume.' },
            ].map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon"><i className={`fas ${f.icon}`}></i></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How AI Matching Works ── */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge"><i className="fas fa-robot"></i> AI Agent</span>
            <h2>How Our <span className="highlight">AI Agent Works</span></h2>
            <p>A three-step intelligent process that goes far beyond keyword matching</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon"><i className="fas fa-user-cog"></i></div>
              <h3>Profile Analysis</h3>
              <p>The AI agent reads your skills and experience level from your profile to build a semantic understanding of your capabilities.</p>
            </div>
            <div className="step-arrow"><i className="fas fa-arrow-right"></i></div>
            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon"><i className="fas fa-brain"></i></div>
              <h3>Semantic Matching</h3>
              <p>Using Claude AI, the agent understands that "ReactJS" equals "React", "Node" equals "Node.js", and awards partial credit for related technologies.</p>
            </div>
            <div className="step-arrow"><i className="fas fa-arrow-right"></i></div>
            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon"><i className="fas fa-percentage"></i></div>
              <h3>Score & Rank</h3>
              <p>Each job gets an overall compatibility score (0–100%) combining skill match (65%) and experience (35%) weights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Jobs ── */}
      {featuredJobs.length > 0 && (
        <section className="featured-jobs">
          <div className="container">
            <div className="section-header">
              <span className="section-badge"><i className="fas fa-fire"></i> Hot Jobs</span>
              <h2>Featured <span className="highlight">Job Openings</span></h2>
              <p>Explore the latest opportunities from top companies</p>
            </div>
            <div className="featured-jobs-grid">
              {featuredJobs.map(job => (
                <div className="featured-job-card" key={job._id}>
                  <div className="job-card-header">
                    <div className="company-logo"><i className="fas fa-building"></i></div>
                    <JobTypeBadge type={job.job_type} />
                  </div>
                  <div className="job-card-body">
                    <h3>{job.title}</h3>
                    <p className="company-name">{job.company_name}</p>
                    <div className="job-meta">
                      <span><i className="fas fa-map-marker-alt"></i> {job.location}</span>
                      <span><i className="fas fa-dollar-sign"></i> {formatSalary(job)}</span>
                    </div>
                    <div className="job-skills">
                      {(job.skills_required || '').split(',').filter(Boolean).slice(0, 3).map((s, i) => (
                        <span key={i} className="skill-tag">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                  <div className="job-card-footer">
                    <Link to={`/jobs/${job._id}`} className="btn btn-outline">View Details</Link>
                    {user?.role === 'jobseeker'
                      ? <Link to={`/jobs/${job._id}/apply`} className="btn btn-primary">Apply Now</Link>
                      : <button onClick={handleGetStarted} className="btn btn-primary">Apply Now</button>
                    }
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <button onClick={handleFindJobs} className="btn btn-outline"><i className="fas fa-briefcase"></i> View All Jobs</button>
            </div>
          </div>
        </section>
      )}

      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item"><h2>10,000+</h2><p>Active Job Listings</p></div>
            <div className="stat-item"><h2>50,000+</h2><p>Registered Job Seekers</p></div>
            <div className="stat-item"><h2>5,000+</h2><p>Partner Companies</p></div>
            <div className="stat-item"><h2>95%</h2><p>Placement Success Rate</p></div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-icon"><i className="fas fa-rocket"></i></div>
            <h2>Ready to Find Your Dream Job?</h2>
            <p>Join thousands of professionals who found their perfect match using SkillSync's AI agent</p>
            <div className="cta-buttons">
              <button onClick={handleGetStarted} className="btn btn-primary btn-lg">
                <i className="fas fa-user-plus"></i> {user ? 'Go to Dashboard' : 'Create Free Account'}
              </button>
              <button onClick={handleFindJobs} className="btn btn-outline btn-lg">
                <i className="fas fa-search"></i> Browse Jobs
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
