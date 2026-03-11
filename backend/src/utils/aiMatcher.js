/**
 * AI Job Matching System
 * Port of Django ai_matcher.py to Node.js
 */

const COMMON_SKILLS = [
  'python','java','javascript','c++','c#','ruby','go','rust','typescript','php','swift','kotlin',
  'html','css','react','angular','vue','django','flask','node.js','express','spring','asp.net',
  'machine learning','deep learning','data science','data analysis','pandas','numpy','tensorflow',
  'pytorch','scikit-learn','nlp','computer vision',
  'sql','mysql','postgresql','mongodb','redis','elasticsearch','oracle',
  'docker','kubernetes','aws','azure','gcp','jenkins','terraform','ci/cd','linux',
  'git','jira','confluence','agile','scrum',
  'communication','leadership','teamwork','problem-solving','project management'
];

function calculateSkillMatch(jobSkills, userSkills) {
  if (!jobSkills.length || !userSkills.length) return { percentage: 0, matched: [], missing: [] };
  const jobSet = new Set(jobSkills.map(s => s.toLowerCase().trim()));
  const userSet = new Set(userSkills.map(s => s.toLowerCase().trim()));
  const matched = [...jobSet].filter(s => userSet.has(s));
  const missing = [...jobSet].filter(s => !userSet.has(s));
  const percentage = Math.round((matched.length / jobSet.size) * 100 * 100) / 100;
  return { percentage, matched, missing };
}

function calculateExperienceMatch(jobExperience, userExperienceYears) {
  const mapping = { entry: 0, mid: 2, senior: 5, lead: 7, manager: 10 };
  const required = mapping[jobExperience] || 0;
  if (userExperienceYears >= required) return 100;
  if (userExperienceYears >= required - 1) return 75;
  if (userExperienceYears >= required - 2) return 50;
  return 25;
}

function calculateLocationScore(jobLocation, userLocation) {
  if (!jobLocation || !userLocation) return 50;
  const jl = jobLocation.toLowerCase().trim();
  const ul = userLocation.toLowerCase().trim();
  if (jl === ul) return 100;
  const jWords = new Set(jl.split(' '));
  const uWords = new Set(ul.split(' '));
  if ([...jWords].some(w => uWords.has(w))) return 75;
  if (jl.includes('remote') || ul.includes('remote')) return 80;
  return 25;
}

function calculateCompatibilityScore(job, profile) {
  if (!profile) return { overall_score: 0, skill_match: 0, experience_match: 0, location_score: 0, matched_skills: [], missing_skills: [] };
  const jobSkills = job.skills_required ? job.skills_required.split(',').map(s => s.trim()).filter(Boolean) : [];
  const userSkills = profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const { percentage: skill_match, matched: matched_skills, missing: missing_skills } = calculateSkillMatch(jobSkills, userSkills);
  const experience_match = calculateExperienceMatch(job.experience_level, profile.experience_years || 0);
  const location_score = calculateLocationScore(job.location, profile.location || '');
  const overall_score = Math.round(((skill_match * 0.5) + (experience_match * 0.3) + (location_score * 0.2)) * 100) / 100;
  return { overall_score, skill_match, experience_match, location_score, matched_skills, missing_skills };
}

function extractSkills(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return COMMON_SKILLS.filter(skill => lower.includes(skill));
}

function normalizeSkills(skills) {
  const map = { js: 'javascript', javascript: 'javascript', py: 'python', python: 'python', ml: 'machine learning', 'machine learning': 'machine learning' };
  return [...new Set(skills.map(s => map[s.trim().toLowerCase()] || s.trim().toLowerCase()))];
}

module.exports = { calculateCompatibilityScore, calculateSkillMatch, extractSkills, normalizeSkills };
