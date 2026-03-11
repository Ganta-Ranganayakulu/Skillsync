import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { JobTypeBadge, Loading, timeAgo, formatSalary, expLabel } from '../components/Common';

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, addMessage } = useAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    job_type: searchParams.get('job_type') || '',
    experience: searchParams.get('experience') || '',
    page: Number(searchParams.get('page')) || 1
  });

  useEffect(() => {
    fetchJobs();
    if (user?.role === 'jobseeker') fetchRecommendations();
  }, [searchParams]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/jobs', { params: Object.fromEntries(searchParams) });
      setJobs(res.data.jobs); setTotal(res.data.total); setPages(res.data.pages);
    } catch(e) {} finally { setLoading(false); }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get('/api/jobs/recommendations');
      setRecommendations(res.data.slice(0, 5));
    } catch(e) {}
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (filters.q) params.q = filters.q;
    if (filters.location) params.location = filters.location;
    if (filters.job_type) params.job_type = filters.job_type;
    if (filters.experience) params.experience = filters.experience;
    setSearchParams(params);
  };

  const handleSave = async (jobId) => {
    if (!user) return navigate('/login');
    try {
      await axios.post(`/api/jobs/${jobId}/save`);
      addMessage('Job saved!', 'success');
    } catch(e) { addMessage(e.response?.data?.message || 'Error', 'error'); }
  };

  const paginate = (p) => {
    const params = Object.fromEntries(searchParams);
    setSearchParams({...params, page: p});
  };

  return (
    <>
      <section className="search-section">
        <div className="container">
          <h1>Find Your Perfect Job</h1>
          <p>Discover thousands of opportunities with AI-powered matching</p>
          <div className="search-form">
            <form onSubmit={handleSearch}>
              <div className="search-row">
                <div className="search-field">
                  <i className="fas fa-search"></i>
                  <input type="text" placeholder="Job title, skills, or keywords" value={filters.q} onChange={e => setFilters({...filters, q: e.target.value})} />
                </div>
                <div className="search-field">
                  <i className="fas fa-map-marker-alt"></i>
                  <input type="text" placeholder="Location" value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})} />
                </div>
                <div className="search-field small">
                  <i className="fas fa-briefcase"></i>
                  <select value={filters.job_type} onChange={e => setFilters({...filters, job_type: e.target.value})}>
                    <option value="">All Types</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
                <div className="search-field small">
                  <i className="fas fa-layer-group"></i>
                  <select value={filters.experience} onChange={e => setFilters({...filters, experience: e.target.value})}>
                    <option value="">All Levels</option>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="lead">Lead</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary"><i className="fas fa-search"></i> Search</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="jobs-content">
          <div className="jobs-main">
            <div className="results-header">
              <h2>{total} Jobs Found</h2>
            </div>
            {loading ? <Loading /> : jobs.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-search"></i>
                <h3>No jobs found</h3>
                <p>Try adjusting your search filters</p>
                <Link to="/jobs" className="btn btn-primary">Clear Filters</Link>
              </div>
            ) : (
              <div className="job-listings">
                {jobs.map(job => (
                  <div className="job-card" key={job._id}>
                    <div className="job-card-header">
                      <div className="company-logo-placeholder"><i className="fas fa-building"></i></div>
                      <div className="job-title-section">
                        <h3><Link to={`/jobs/${job._id}`}>{job.title}</Link></h3>
                        <span className="company-name">{job.company_name}</span>
                      </div>
                      <JobTypeBadge type={job.job_type} />
                    </div>
                    <div className="job-card-body">
                      <div className="job-details">
                        <span className="detail-item"><i className="fas fa-map-marker-alt"></i>{job.location}</span>
                        <span className="detail-item"><i className="fas fa-dollar-sign"></i>{formatSalary(job)}</span>
                        <span className="detail-item"><i className="fas fa-layer-group"></i>{expLabel(job.experience_level)}</span>
                      </div>
                      <div className="job-skills">
                        {(job.skills_required||'').split(',').filter(Boolean).slice(0,5).map((s,i) => (
                          <span key={i} className="skill-tag">{s.trim()}</span>
                        ))}
                      </div>
                    </div>
                    <div className="job-card-footer">
                      <span className="posted-date"><i className="fas fa-clock"></i>{timeAgo(job.createdAt)}</span>
                      <div className="job-actions">
                        <button className="btn btn-icon btn-outline" onClick={() => handleSave(job._id)} title="Save job">
                          <i className="fas fa-bookmark"></i>
                        </button>
                        <Link to={`/jobs/${job._id}`} className="btn btn-outline btn-small">View Details</Link>
                        <Link to={`/jobs/${job._id}/apply`} className="btn btn-primary btn-small">Apply</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pages > 1 && (
              <div className="pagination">
                {Array.from({length: pages}, (_, i) => i+1).map(p => (
                  <button key={p} className={`page-link ${p === (Number(searchParams.get('page'))||1) ? 'active' : ''}`} onClick={() => paginate(p)}>{p}</button>
                ))}
              </div>
            )}
          </div>

          <aside className="jobs-sidebar">
            {user?.role === 'jobseeker' && recommendations.length > 0 && (
              <div className="sidebar-widget">
                <h3><i className="fas fa-robot"></i> AI Recommendations</h3>
                <p>Based on your profile</p>
                <div className="recommended-jobs">
                  {recommendations.map(({job, scores}) => (
                    <div className="recommended-job" key={job._id}>
                      <h4><Link to={`/jobs/${job._id}`}>{job.title}</Link></h4>
                      <p>{job.company_name}</p>
                      <div className="match-indicator">
                        <div className="match-bar">
                          <div className="match-bar-fill" style={{width: `${scores.overall_score}%`}}></div>
                        </div>
                        <span>{scores.overall_score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="sidebar-widget">
              <h3><i className="fas fa-filter"></i> Filter by Type</h3>
              <div style={{display:'flex', flexDirection:'column', gap: 8}}>
                {['full_time','part_time','contract','internship','freelance'].map(t => (
                  <label key={t} style={{display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer'}}>
                    <input type="checkbox" checked={filters.job_type === t} onChange={() => { setFilters(f => ({...f, job_type: f.job_type === t ? '' : t})); }} style={{accentColor:'var(--primary-color)'}}/>
                    {t.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </label>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
