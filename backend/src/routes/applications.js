const express = require('express');
const router = express.Router();
const { JobApplication } = require('../models/Application');
const Job = require('../models/Job');
const { protect, jobProviderOnly, jobSeekerOnly } = require('../middleware/auth');

// POST /api/applications/:jobId - apply for a job
router.post('/:jobId', protect, jobSeekerOnly, async (req, res) => {
  try {
    const existing = await JobApplication.findOne({ applicant: req.user._id, job: req.params.jobId });
    if (existing) return res.status(400).json({ message: 'You have already applied for this job.' });

    // Auto-attach resume from user profile if not overridden
    const User = require('../models/User');
    const applicant = await User.findById(req.user._id);
    const resumeUrl = req.body.resume_url || applicant?.jobseeker_profile?.resume || '';

    const application = await JobApplication.create({
      job: req.params.jobId,
      applicant: req.user._id,
      cover_letter: req.body.cover_letter || '',
      resume: resumeUrl
    });
    res.status(201).json(application);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/applications/my - job seeker's applications
router.get('/my/list', protect, jobSeekerOnly, async (req, res) => {
  try {
    const applications = await JobApplication.find({ applicant: req.user._id })
      .populate('job').sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/applications/:id/status - update application status (job provider)
router.put('/:id/status', protect, jobProviderOnly, async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (String(application.job.job_provider) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorized' });
    const { status } = req.body;
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    application.status = status;
    await application.save();
    res.json(application);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
