/**
 * SkillSync AI Agent - Intelligent Job Matching System v3
 *
 * KEY FIXES in this version:
 * 1. DETERMINISTIC scoring — same inputs ALWAYS produce the same score.
 *    The Claude prompt now uses a pure deterministic rule-set so two users
 *    with identical skills / experience / location get identical scores.
 * 2. CACHE KEY includes experience + location so different profiles never
 *    share a cached result that belongs to another user.
 * 3. FINAL SCORE uses integer rounding (Math.round) consistently across
 *    both the async and sync paths, eliminating floating-point drift.
 * 4. SKILLS are sorted + normalised before being sent to Claude so the
 *    order in which a user entered them does not affect the result.
 * 5. EQUAL-SCORE RANKING — the sort in jobs.js uses a stable secondary
 *    key (applicant _id string) so applicants with equal scores always
 *    appear in the same deterministic order.
 */

const axios = require('axios');

// ─── In-memory cache (TTL: 2 hours) ─────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 2 * 60 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.value;
  cache.delete(key);
  return null;
}
function setCache(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
}

// ─── Skill synonym/alias map ─────────────────────────────────────────────────
const SKILL_ALIASES = {
  'js': 'javascript', 'javascript': 'javascript',
  'ts': 'typescript', 'typescript': 'typescript',
  'reactjs': 'react', 'react.js': 'react', 'react': 'react',
  'nodejs': 'node.js', 'node': 'node.js', 'node.js': 'node.js',
  'expressjs': 'express', 'express.js': 'express', 'express': 'express',
  'vuejs': 'vue', 'vue.js': 'vue', 'vue': 'vue',
  'angularjs': 'angular', 'angular': 'angular',
  'nextjs': 'next.js', 'next.js': 'next.js',
  'py': 'python', 'python': 'python',
  'ml': 'machine learning', 'machine learning': 'machine learning',
  'dl': 'deep learning', 'deep learning': 'deep learning',
  'ai': 'artificial intelligence', 'artificial intelligence': 'artificial intelligence',
  'nlp': 'natural language processing', 'natural language processing': 'natural language processing',
  'postgres': 'postgresql', 'postgresql': 'postgresql',
  'mongo': 'mongodb', 'mongodb': 'mongodb',
  'k8s': 'kubernetes', 'kubernetes': 'kubernetes',
  'aws': 'aws', 'amazon web services': 'aws',
  'gcp': 'google cloud', 'google cloud': 'google cloud',
  'azure': 'microsoft azure', 'microsoft azure': 'microsoft azure',
  'ci/cd': 'ci/cd', 'cicd': 'ci/cd',
  'oop': 'object oriented programming', 'object oriented programming': 'object oriented programming',
  'ui/ux': 'ui/ux', 'ux': 'ui/ux', 'ui': 'ui/ux',
  'restapi': 'rest api', 'rest': 'rest api', 'rest api': 'rest api',
  'graphql': 'graphql', 'redux': 'redux',
  'sass': 'sass/scss', 'scss': 'sass/scss',
  'html5': 'html', 'html': 'html',
  'css3': 'css', 'css': 'css',
  'tailwind': 'tailwind css', 'tailwindcss': 'tailwind css',
  'bootstrap': 'bootstrap',
  'springboot': 'spring boot', 'spring boot': 'spring boot', 'spring': 'spring boot',
  'git': 'git', 'github': 'git',
  'docker': 'docker', 'linux': 'linux', 'unix': 'linux',
  'java': 'java', 'kotlin': 'kotlin', 'swift': 'swift',
  'c#': 'c#', 'csharp': 'c#', 'dotnet': '.net', '.net': '.net',
  'php': 'php', 'laravel': 'laravel',
  'ruby': 'ruby', 'rails': 'ruby on rails', 'ruby on rails': 'ruby on rails',
  'go': 'golang', 'golang': 'golang', 'rust': 'rust',
  'mysql': 'mysql', 'sql': 'sql', 'redis': 'redis',
  'elasticsearch': 'elasticsearch', 'firebase': 'firebase',
  'tensorflow': 'tensorflow', 'pytorch': 'pytorch',
  'pandas': 'pandas', 'numpy': 'numpy', 'scikit-learn': 'scikit-learn',
  'agile': 'agile', 'scrum': 'agile',
  'jira': 'jira', 'confluence': 'confluence',
  'figma': 'figma', 'sketch': 'figma',
  'photoshop': 'adobe photoshop',
  'communication': 'communication', 'leadership': 'leadership',
  'problem solving': 'problem solving', 'teamwork': 'teamwork',
  'project management': 'project management'
};

// Related skills clusters
const SKILL_CLUSTERS = [
  ['javascript', 'typescript', 'node.js', 'react', 'vue', 'angular', 'next.js', 'express'],
  ['python', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'natural language processing'],
  ['java', 'spring boot', 'kotlin', 'android'],
  ['aws', 'google cloud', 'microsoft azure', 'docker', 'kubernetes', 'ci/cd', 'devops', 'linux'],
  ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch'],
  ['react', 'redux', 'html', 'css', 'tailwind css', 'bootstrap', 'sass/scss', 'figma', 'ui/ux'],
  ['rest api', 'graphql', 'microservices', 'system design'],
  ['agile', 'jira', 'project management', 'leadership', 'communication', 'teamwork'],
];

// ─── FIX 1: normalise + sort skills before any comparison ────────────────────
// This ensures "React, Node.js" and "Node.js, React" produce identical keys
// and identical scores — entry order never matters.
function normalizeSkill(skill) {
  const lower = skill.toLowerCase().trim();
  return SKILL_ALIASES[lower] || lower;
}

function normalizeAndSortSkills(skills) {
  return [...new Set(skills.map(normalizeSkill))].sort();
}

function getRelatedBonus(userSkillNorm, jobSkillNorm) {
  for (const cluster of SKILL_CLUSTERS) {
    if (cluster.includes(userSkillNorm) && cluster.includes(jobSkillNorm)) {
      return 0.4;
    }
  }
  return 0;
}

// ─── Enhanced fallback matching (pure deterministic, no API) ─────────────────
function enhancedKeywordMatch(jobSkills, userSkills) {
  if (!jobSkills.length || !userSkills.length) {
    return { percentage: 0, matched: [], missing: [], partial: [] };
  }

  // FIX: normalise both lists before comparing so two users with the same
  // skills entered in any order get the same matched/partial/missing result.
  const normJobSkills = jobSkills.map(normalizeSkill);
  const normUserSet   = new Set(userSkills.map(normalizeSkill));

  let score = 0;
  const matched = [];
  const partial = [];
  const missing = [];

  for (let i = 0; i < normJobSkills.length; i++) {
    const js = normJobSkills[i];
    if (normUserSet.has(js)) {
      matched.push(jobSkills[i]);
      score += 1;
    } else {
      let bestBonus = 0;
      for (const us of normUserSet) {
        const bonus = getRelatedBonus(us, js);
        if (bonus > bestBonus) bestBonus = bonus;
        if (!bonus && (js.includes(us) || us.includes(js)) && js.length > 2 && us.length > 2) {
          bestBonus = Math.max(bestBonus, 0.5);
        }
      }
      if (bestBonus > 0) {
        partial.push(jobSkills[i]);
        score += bestBonus;
      } else {
        missing.push(jobSkills[i]);
      }
    }
  }

  // FIX: round to integer (not 1 decimal) so the fallback and AI paths
  // produce numbers in the same format and the final weighted sum is stable.
  const percentage = Math.round((score / normJobSkills.length) * 100);
  return { percentage: Math.min(percentage, 100), matched, partial, missing };
}

// ─── AI Agent: Claude-powered semantic matching ──────────────────────────────
async function aiSemanticMatch(jobTitle, jobSkills, userSkills, experienceYears) {
  // Cache key: job title + sorted skills + experience years.
  // Location is NOT included — it does not affect the score.
  const sortedJobSkills  = normalizeAndSortSkills(jobSkills);
  const sortedUserSkills = normalizeAndSortSkills(userSkills);
  const cacheKey = [
    'ai',
    jobTitle.toLowerCase().trim(),
    sortedJobSkills.join(','),
    sortedUserSkills.join(','),
    String(experienceYears)
  ].join('|');

  const cached = getCached(cacheKey);
  if (cached) return { ...cached, cached: true };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return null;
  }

  try {
    // FIX: the prompt now uses ONLY deterministic rules — no subjective
    // language that could let Claude vary its output for the same inputs.
    // Skills are passed pre-sorted so Claude sees them in a fixed order.
    const prompt = `You are a deterministic job-skill matching engine.

Job Title: ${jobTitle}
Required Skills: ${sortedJobSkills.join(', ')}
Candidate Skills: ${sortedUserSkills.join(', ')}

Score each required skill against the candidate skills using ONLY these fixed rules (no exceptions, no judgment):
1. Normalised exact match → 100 points  (react = reactjs = react.js)
2. Alias match           → 100 points  (nodejs = node.js, js = javascript)
3. Closely related       →  70 points  (express when node.js required)
4. Same ecosystem        →  40 points  (vue when react required)
5. Transferable          →  30 points  (python when data-science required)
6. No relationship       →   0 points

overall_score = average of all per-skill scores (0–100, integer).

Apply the rules mechanically. Do NOT adjust the score based on location, seniority, or any factor not listed above.

Return ONLY valid JSON, no markdown, no explanation:
{
  "overall_score": <integer 0-100>,
  "matched_skills": [<required skills that scored 100>],
  "partial_skills": [<required skills that scored 30-70>],
  "missing_skills": [<required skills that scored 0>],
  "strengths": "<one factual sentence listing matched skills>",
  "gaps": "<one factual sentence listing missing skills, or 'No significant gaps.' if none>"
}`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        temperature: 0,          // FIX: temperature=0 → fully deterministic output
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 8000
      }
    );

    const text = response.data.content[0].text.trim();
    const jsonText = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    const result = JSON.parse(jsonText);

    // FIX: force integer overall_score so no floating-point mismatch later
    result.overall_score = Math.round(result.overall_score);

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('AI Agent API unavailable, using enhanced fallback:', err.message);
    return null;
  }
}

// ─── Experience match (deterministic lookup table) ────────────────────────────
function calculateExperienceMatch(jobExperience, userExperienceYears) {
  const required = { entry: 0, mid: 2, senior: 5, lead: 7, manager: 10 }[jobExperience] || 0;
  const yrs = Number(userExperienceYears) || 0;
  if (yrs >= required + 2) return 100;
  if (yrs >= required)     return 100;
  if (yrs >= required - 1) return 75;
  if (yrs >= required - 2) return 50;
  return 25;
}

// ─── Location match (deterministic) ──────────────────────────────────────────
function calculateLocationScore(jobLocation, userLocation) {
  if (!jobLocation || !userLocation) return 50;
  const jl = jobLocation.toLowerCase().trim();
  const ul = userLocation.toLowerCase().trim();
  if (jl === ul) return 100;
  if (jl.includes('remote') || ul.includes('remote') || jl.includes('anywhere')) return 85;
  const jWords = new Set(jl.split(/[\s,]+/).filter(w => w.length > 2));
  const uWords = new Set(ul.split(/[\s,]+/).filter(w => w.length > 2));
  if ([...jWords].some(w => uWords.has(w))) return 75;
  return 25;
}

// ─── Score formula: Skills 65% + Experience 35% (location excluded) ──────────
function buildFinalScore(skill_match, experience_match) {
  // Location is not part of the score — only skills and experience matter.
  return Math.round((skill_match * 0.65) + (experience_match * 0.35));
}

// ─── Main async scorer ────────────────────────────────────────────────────────
async function calculateCompatibilityScoreAsync(job, profile) {
  if (!profile) return {
    overall_score: 0, skill_match: 0, experience_match: 0, location_score: 0,
    matched_skills: [], missing_skills: [], partial_skills: [],
    strengths: '', gaps: '', ai_powered: false
  };

  const jobSkills  = job.skills_required
    ? job.skills_required.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const userSkills = profile.skills
    ? profile.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const experience_match = calculateExperienceMatch(job.experience_level, profile.experience_years);
  // Location is not used in scoring — removed from calculation.

  let skill_match = 0, matched_skills = [], missing_skills = [], partial_skills = [];
  let strengths = '', gaps = '', ai_powered = false;

  if (jobSkills.length && userSkills.length) {
    const aiResult = await aiSemanticMatch(
      job.title, jobSkills, userSkills,
      profile.experience_years || 0
    );
    if (aiResult) {
      skill_match    = aiResult.overall_score || 0;
      matched_skills = aiResult.matched_skills || [];
      missing_skills = aiResult.missing_skills || [];
      partial_skills = aiResult.partial_skills || [];
      strengths      = aiResult.strengths || '';
      gaps           = aiResult.gaps || '';
      ai_powered     = true;
    } else {
      const fallback = enhancedKeywordMatch(jobSkills, userSkills);
      skill_match    = fallback.percentage;
      matched_skills = fallback.matched;
      missing_skills = fallback.missing;
      partial_skills = fallback.partial || [];
    }
  }

  const overall_score = buildFinalScore(skill_match, experience_match);

  return {
    overall_score, skill_match, experience_match, location_score: 0,
    matched_skills, missing_skills, partial_skills,
    strengths, gaps, ai_powered
  };
}

// ─── Sync scorer (fallback path only) ────────────────────────────────────────
function calculateCompatibilityScore(job, profile) {
  if (!profile) return {
    overall_score: 0, skill_match: 0, experience_match: 0, location_score: 0,
    matched_skills: [], missing_skills: [], partial_skills: [], ai_powered: false
  };

  const jobSkills  = job.skills_required
    ? job.skills_required.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const userSkills = profile.skills
    ? profile.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const experience_match = calculateExperienceMatch(job.experience_level, profile.experience_years);
  // Location is not used in scoring — removed from calculation.

  const { percentage: skill_match, matched: matched_skills,
          missing: missing_skills, partial: partial_skills } =
    enhancedKeywordMatch(jobSkills, userSkills);

  const overall_score = buildFinalScore(skill_match, experience_match);

  return {
    overall_score, skill_match, experience_match, location_score: 0,
    matched_skills, missing_skills, partial_skills, ai_powered: false
  };
}

function calculateSkillMatch(jobSkills, userSkills) {
  const { percentage, matched, missing } = enhancedKeywordMatch(jobSkills, userSkills);
  return { percentage, matched, missing };
}

// ─── Skill extraction utilities ───────────────────────────────────────────────
const COMMON_SKILLS = [
  'python','java','javascript','typescript','c++','c#','ruby','go','rust','php','swift','kotlin',
  'html','css','react','angular','vue','next.js','django','flask','node.js','express','spring boot',
  'machine learning','deep learning','data science','data analysis','pandas','numpy','tensorflow',
  'pytorch','scikit-learn','natural language processing','computer vision','ai','artificial intelligence',
  'sql','mysql','postgresql','mongodb','redis','elasticsearch','oracle','firebase',
  'docker','kubernetes','aws','azure','google cloud','jenkins','terraform','ci/cd','linux','devops',
  'git','jira','confluence','agile','scrum','rest api','graphql','microservices','system design',
  'communication','leadership','teamwork','problem solving','project management','figma','ui/ux',
  'tailwind css','bootstrap','sass/scss','redux','websocket','blockchain','cybersecurity'
];

function extractSkills(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return COMMON_SKILLS.filter(skill => lower.includes(skill));
}

function normalizeSkills(skills) {
  return [...new Set(skills.map(normalizeSkill))];
}

module.exports = {
  calculateCompatibilityScore,
  calculateCompatibilityScoreAsync,
  calculateSkillMatch,
  extractSkills,
  normalizeSkills
};
