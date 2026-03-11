const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  job_provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company_name: { type: String, required: true },
  company_logo: { type: String, default: '' },
  company_website: { type: String, default: '' },
  company_description: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String, default: '' },
  responsibilities: { type: String, default: '' },
  skills_required: { type: String, default: '' },
  job_type: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'internship', 'freelance'],
    default: 'full_time'
  },
  experience_level: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'lead', 'manager'],
    default: 'mid'
  },
  location: { type: String, required: true },
  salary_min: { type: Number, default: null },
  salary_max: { type: Number, default: null },
  salary_currency: { type: String, default: 'USD' },
  application_deadline: { type: Date, default: null },
  is_active: { type: Boolean, default: true },
  views_count: { type: Number, default: 0 }
}, { timestamps: true });

jobSchema.methods.getSkillsList = function () {
  return this.skills_required
    ? this.skills_required.split(',').map(s => s.trim()).filter(Boolean)
    : [];
};

jobSchema.methods.getSalaryDisplay = function () {
  if (this.salary_min && this.salary_max)
    return `${this.salary_currency} ${this.salary_min} - ${this.salary_max}`;
  if (this.salary_min) return `${this.salary_currency} ${this.salary_min}+`;
  if (this.salary_max) return `Up to ${this.salary_currency} ${this.salary_max}`;
  return 'Not disclosed';
};

module.exports = mongoose.model('Job', jobSchema);
