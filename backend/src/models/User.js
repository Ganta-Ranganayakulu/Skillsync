const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const jobSeekerProfileSchema = new mongoose.Schema({
  skills: { type: String, default: '' },
  experience_years: { type: Number, default: 0 },
  education: { type: String, default: '' },
  expected_salary: { type: Number, default: null },
  location: { type: String, default: '' },
  linkedin_url: { type: String, default: '' },
  github_url: { type: String, default: '' },
  is_available: { type: Boolean, default: true },
  resume: { type: String, default: '' }
});

const companyProfileSchema = new mongoose.Schema({
  company_name: { type: String, default: '' },
  company_website: { type: String, default: '' },
  company_size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', ''],
    default: ''
  },
  industry: { type: String, default: '' },
  company_description: { type: String, default: '' },
  company_logo: { type: String, default: '' },
  founded_year: { type: Number, default: null },
  headquarters: { type: String, default: '' }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  first_name: { type: String, default: '' },
  last_name: { type: String, default: '' },
  role: { type: String, enum: ['jobseeker', 'jobprovider'], default: 'jobseeker' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  profile_picture: { type: String, default: '' },
  bio: { type: String, default: '' },
  jobseeker_profile: { type: jobSeekerProfileSchema, default: () => ({}) },
  company_profile: { type: companyProfileSchema, default: () => ({}) }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getSkillsList = function () {
  const skills = this.jobseeker_profile?.skills || '';
  return skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
};

module.exports = mongoose.model('User', userSchema);
