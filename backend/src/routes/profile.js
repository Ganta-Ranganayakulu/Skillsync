const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const resumeDir = path.join(uploadDir, 'resumes');
const photoDir = path.join(uploadDir, 'photos');
[uploadDir, resumeDir, photoDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'resume') cb(null, resumeDir);
    else cb(null, photoDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}_${file.fieldname}_${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    const allowed = ['.pdf', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX files allowed for resume'), false);
  } else if (file.fieldname === 'profile_picture') {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed for profile picture'), false);
  } else cb(null, false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadFields = upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'profile_picture', maxCount: 1 }]);

// GET /api/profile - get current user profile
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/profile - update profile (with optional file uploads)
router.put('/', protect, (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    let body = req.body;
    // parse JSON fields if sent as FormData strings
    let jobseeker_profile = body.jobseeker_profile;
    let company_profile = body.company_profile;
    if (typeof jobseeker_profile === 'string') {
      try { jobseeker_profile = JSON.parse(jobseeker_profile); } catch(e) { jobseeker_profile = undefined; }
    }
    if (typeof company_profile === 'string') {
      try { company_profile = JSON.parse(company_profile); } catch(e) { company_profile = undefined; }
    }

    const user = await User.findById(req.user._id);
    if (body.first_name !== undefined) user.first_name = body.first_name;
    if (body.last_name !== undefined) user.last_name = body.last_name;
    if (body.phone !== undefined) user.phone = body.phone;
    if (body.address !== undefined) user.address = body.address;
    if (body.bio !== undefined) user.bio = body.bio;

    if (user.role === 'jobseeker' && jobseeker_profile) {
      Object.assign(user.jobseeker_profile, jobseeker_profile);
    }
    if (user.role === 'jobprovider' && company_profile) {
      Object.assign(user.company_profile, company_profile);
    }

    // Handle uploaded files
    if (req.files?.profile_picture?.[0]) {
      user.profile_picture = `/uploads/photos/${req.files.profile_picture[0].filename}`;
    }
    if (req.files?.resume?.[0]) {
      user.jobseeker_profile.resume = `/uploads/resumes/${req.files.resume[0].filename}`;
    }

    await user.save();
    const updated = await User.findById(user._id).select('-password');
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
