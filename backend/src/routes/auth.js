const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, role } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Please fill all required fields' });
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: 'User with this email or username already exists' });
    const user = await User.create({ username, email, password, first_name: first_name || '', last_name: last_name || '', role: role || 'jobseeker' });
    res.status(201).json({
      _id: user._id, username: user.username, email: user.email,
      role: user.role, first_name: user.first_name, last_name: user.last_name,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await user.matchPassword(password)) {
      res.json({
        _id: user._id, username: user.username, email: user.email,
        role: user.role, first_name: user.first_name, last_name: user.last_name,
        profile_picture: user.profile_picture, token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
});

module.exports = router;
