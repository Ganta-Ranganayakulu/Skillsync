const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) return res.status(401).json({ message: 'User not found' });
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
};

const jobProviderOnly = (req, res, next) => {
  if (req.user && req.user.role === 'jobprovider') return next();
  res.status(403).json({ message: 'Access denied. Job providers only.' });
};

const jobSeekerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'jobseeker') return next();
  res.status(403).json({ message: 'Access denied. Job seekers only.' });
};

// Validates MongoDB ObjectID params to prevent CastError 500s
const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const val = req.params[paramName];
  if (val && !mongoose.Types.ObjectId.isValid(val)) {
    return res.status(400).json({ message: `Invalid ${paramName}: "${val}" is not a valid ID` });
  }
  next();
};

module.exports = { protect, jobProviderOnly, jobSeekerOnly, validateObjectId };
