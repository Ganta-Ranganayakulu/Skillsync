const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { JobApplication, SavedJob } = require('../models/Application');
const User = require('../models/User');
const { protect, jobProviderOnly, jobSeekerOnly, validateObjectId } = require('../middleware/auth');
const { calculateCompatibilityScore, calculateCompatibilityScoreAsync, calculateSkillMatch, extractSkills, normalizeSkills } = require('../utils/aiMatcher');

// GET /api/jobs/recommendations  — AI-powered recommendations
router.get('/recommendations', protect, jobSeekerOnly, async (req, res) => {
  try {
    const profile = req.user.jobseeker_profile;
    const jobs = await Job.find({ is_active: true }).sort({ createdAt: -1 }).limit(50);
    const scoredPromises = jobs.map(async (job) => {
      const scores = await calculateCompatibilityScoreAsync(job, profile);
      return { job, scores };
    });
    const scored = await Promise.all(scoredPromises);

    const result = scored
      .filter(x => x.scores.overall_score > 0)
      .sort((a, b) => {
        const diff = b.scores.overall_score - a.scores.overall_score;
        if (diff !== 0) return diff;
        return String(a.job._id).localeCompare(String(b.job._id));
      })
      .slice(0, 20);

    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/jobs/my-jobs
router.get('/my-jobs', protect, jobProviderOnly, async (req, res) => {
  try {
    const jobs = await Job.find({ job_provider: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/jobs/saved/list
router.get('/saved/list', protect, async (req, res) => {
  try {
    const saved = await SavedJob.find({ user: req.user._id }).populate('job').sort({ createdAt: -1 });
    res.json(saved);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/jobs/candidates/find
router.get('/candidates/find', protect, jobProviderOnly, async (req, res) => {
  try {
    const { job_id } = req.query;
    const myJobs = await Job.find({ job_provider: req.user._id, is_active: true });
    if (!job_id) return res.json({ jobs: myJobs, candidates: [], selected_job: null });
    const selectedJob = await Job.findOne({ _id: job_id, job_provider: req.user._id });
    if (!selectedJob) return res.status(404).json({ message: 'Job not found' });
    const candidates = await User.find({ role: 'jobseeker', 'jobseeker_profile.is_available': true }).select('-password');
    const jobSkills = selectedJob.skills_required ? selectedJob.skills_required.split(',').map(s => s.trim()) : [];
    const scored = candidates.map(c => {
      const userSkills = c.jobseeker_profile?.skills ? c.jobseeker_profile.skills.split(',').map(s => s.trim()) : [];
      const { percentage, matched, missing } = calculateSkillMatch(jobSkills, userSkills);
      return { candidate: c, match_score: percentage, matched_skills: matched, missing_skills: missing };
    }).filter(c => c.match_score >= 20).sort((a, b) => {
      const diff = b.match_score - a.match_score;
      if (diff !== 0) return diff;
      // stable tie-break
      return String(a.candidate._id).localeCompare(String(b.candidate._id));
    }).slice(0, 30);
    res.json({ jobs: myJobs, candidates: scored, selected_job: selectedJob });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/jobs/utils/extract-skills
router.get('/utils/extract-skills', (req, res) => {
  const { text } = req.query;
  const skills = extractSkills(text || '');
  const normalized = normalizeSkills(skills);
  res.json({ extracted_skills: skills, normalized_skills: normalized });
});

// GET /api/jobs (list + search + filter)
router.get('/', async (req, res) => {
  try {
    const { q, location, job_type, experience, skills, page = 1, limit = 10 } = req.query;
    let filter = { is_active: true };
    if (q) filter.$or = [
      { title: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') },
      { skills_required: new RegExp(q, 'i') },
      { company_name: new RegExp(q, 'i') }
    ];
    if (location) filter.location = new RegExp(location, 'i');
    if (job_type) filter.job_type = job_type;
    if (experience) filter.experience_level = experience;
    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ jobs, total, pages: Math.ceil(total / limit), page: Number(page) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/jobs
router.post('/', protect, jobProviderOnly, async (req, res) => {
  try {
    const { title, description, requirements, responsibilities, skills_required, job_type, experience_level, location, salary_min, salary_max, salary_currency, application_deadline } = req.body;
    const company = req.user.company_profile;
    const job = await Job.create({
      job_provider: req.user._id,
      company_name: company?.company_name || req.user.username,
      company_logo: company?.company_logo || '',
      company_website: company?.company_website || '',
      company_description: company?.company_description || '',
      title, description, requirements, responsibilities, skills_required,
      job_type, experience_level, location, salary_min, salary_max,
      salary_currency: salary_currency || 'USD', application_deadline
    });
    res.status(201).json(job);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/jobs/:id/applicants
router.get('/:id/applicants', protect, jobProviderOnly, validateObjectId(), async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, job_provider: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const applications = await JobApplication.find({ job: req.params.id }).populate('applicant', '-password').sort({ createdAt: -1 });
    const rankedApplications = await Promise.all(applications.map(async (app) => {
      const profile = app.applicant?.jobseeker_profile;
      const scores = await calculateCompatibilityScoreAsync(job, profile);
      return {
        ...app.toObject(),
        resume: app.resume || profile?.resume || '',
        match_score: scores.overall_score,
        skill_match: scores.skill_match,
        matched_skills: scores.matched_skills,
        missing_skills: scores.missing_skills,
        partial_skills: scores.partial_skills,
        strengths: scores.strengths,
        gaps: scores.gaps,
        ai_powered: scores.ai_powered
      };
    }));

    rankedApplications.sort((a, b) => {
      const diff = b.match_score - a.match_score;
      if (diff !== 0) return diff;
      return String(a.applicant?._id || a._id).localeCompare(String(b.applicant?._id || b._id));
    });

    let rankCounter = 1;
    for (let i = 0; i < rankedApplications.length; i++) {
      if (i > 0 && rankedApplications[i].match_score === rankedApplications[i - 1].match_score) {
        rankedApplications[i].rank = rankedApplications[i - 1].rank; // tied rank
      } else {
        rankedApplications[i].rank = rankCounter;
      }
      rankCounter++;
    }

    res.json({ job, applications: rankedApplications });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/jobs/:id/match
router.get('/:id/match', protect, jobSeekerOnly, validateObjectId(), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const match_info = await calculateCompatibilityScoreAsync(job, req.user.jobseeker_profile);
    res.json(match_info);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/jobs/:id/save
router.post('/:id/save', protect, validateObjectId(), async (req, res) => {
  try {
    const existing = await SavedJob.findOne({ user: req.user._id, job: req.params.id });
    if (existing) return res.status(400).json({ message: 'Job already saved' });
    await SavedJob.create({ user: req.user._id, job: req.params.id });
    res.json({ message: 'Job saved successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/jobs/:id/save
router.delete('/:id/save', protect, validateObjectId(), async (req, res) => {
  try {
    await SavedJob.findOneAndDelete({ user: req.user._id, job: req.params.id });
    res.json({ message: 'Job removed from saved jobs' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/jobs/:id  (single job — must be last)
router.get('/:id', validateObjectId(), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.views_count += 1;
    await job.save();
    let is_saved = false, has_applied = false, match_info = null;
    if (req.headers.authorization) {
      const jwt = require('jsonwebtoken');
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          is_saved = !!(await SavedJob.findOne({ user: user._id, job: job._id }));
          has_applied = !!(await JobApplication.findOne({ applicant: user._id, job: job._id }));
          if (user.role === 'jobseeker') match_info = await calculateCompatibilityScoreAsync(job, user.jobseeker_profile);
        }
      } catch (_) {}
    }
    res.json({ job, is_saved, has_applied, match_info });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/jobs/:id
router.put('/:id', protect, jobProviderOnly, validateObjectId(), async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, job_provider: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/jobs/:id
router.delete('/:id', protect, jobProviderOnly, validateObjectId(), async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, job_provider: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
