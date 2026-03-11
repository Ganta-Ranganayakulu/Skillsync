const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cover_letter: { type: String, default: '' },
  resume: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
    default: 'pending'
  }
}, { timestamps: true });

jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

const savedJobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true }
}, { timestamps: true });

savedJobSchema.index({ user: 1, job: 1 }, { unique: true });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
const SavedJob = mongoose.model('SavedJob', savedJobSchema);

module.exports = { JobApplication, SavedJob };
