
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

const SYSTEM_PROMPT = `You are SkillBot, the friendly AI assistant for SkillSync — an intelligent job search platform.

Your role is to help users with:
- Job search tips and strategies
- Resume and cover letter advice
- Career guidance and skill development
- How to use SkillSync features
- Interview preparation tips
- Salary negotiation advice
- Understanding job descriptions and requirements

SkillSync Features you know about:
- AI-powered job matching with percentage scores
- Smart job recommendations based on user skills
- Application tracking dashboard
- Job provider portal to post jobs and find candidates
- Profile builder with skill management
- Resume upload and management
- Saved jobs functionality

Rules:
- Be concise, helpful, and encouraging
- Keep responses under 200 words
- Use bullet points for lists
- Be specific and actionable
- If asked about specific jobs on the platform, suggest browsing the Jobs page
- Always stay on topic (jobs, careers, the platform)
- Do not make up specific job listings or company data`;

// POST /api/chatbot/message
router.post('/message', protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message required' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      return res.json({
        reply: getFallbackReply(message),
        ai_powered: false
      });
    }

    // Build conversation messages
    const messages = [];

    // Add recent history (last 6 messages)
    const recentHistory = history.slice(-6);
    for (const h of recentHistory) {
      if (h.role && h.content) messages.push({ role: h.role, content: h.content });
    }
    messages.push({ role: 'user', content: message.trim() });

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5',
        max_tokens: 350,
        system: SYSTEM_PROMPT,
        messages
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 10000
      }
    );

    const reply = response.data.content[0].text;
    res.json({ reply, ai_powered: true });
  } catch (err) {
    console.error('Chatbot error:', err.message);
    res.json({
      reply: getFallbackReply(req.body.message || ''),
      ai_powered: false
    });
  }
});

// Fallback replies when API is not configured
function getFallbackReply(message) {
  const m = message.toLowerCase();
  if (m.includes('resume') || m.includes('cv')) {
    return '📄 **Resume Tips:**\n• Keep it to 1-2 pages\n• Tailor it for each job\n• Use action verbs (built, led, improved)\n• Include measurable achievements\n• Upload your resume in your Profile for auto-attach on applications!';
  }
  if (m.includes('interview')) {
    return '🎯 **Interview Tips:**\n• Research the company beforehand\n• Prepare STAR method stories\n• Practice common questions\n• Prepare questions to ask them\n• Follow up with a thank-you email';
  }
  if (m.includes('salary') || m.includes('pay')) {
    return '💰 **Salary Tips:**\n• Research market rates on Glassdoor/LinkedIn\n• Don\'t reveal your current salary first\n• Negotiate based on value, not need\n• Consider total compensation (benefits, equity)\n• Get the offer in writing';
  }
  if (m.includes('skill') || m.includes('learn')) {
    return '📚 **Skill Development:**\n• Add your skills in your Profile for better job matches\n• Focus on in-demand skills for your field\n• Build projects to showcase skills\n• Certifications can boost your profile\n• Check the AI match score on jobs to see skill gaps!';
  }
  if (m.includes('apply') || m.includes('application')) {
    return '📨 **Application Tips:**\n• Complete your profile first for better matching\n• Upload your resume in Profile settings\n• Write a tailored cover letter\n• Track your applications in My Applications\n• Apply to jobs with high AI match scores first!';
  }
  if (m.includes('match') || m.includes('score')) {
    return '🤖 **AI Match Score:**\n• The score shows how well your skills fit a job\n• 80%+ = Excellent match, apply now!\n• 60-79% = Good match, worth applying\n• 40-59% = Moderate, consider upskilling\n• Below 40% = Skill gap, focus on learning\n• Update your skills in Profile to improve scores!';
  }
  if (m.includes('find') || m.includes('search') || m.includes('job')) {
    return '🔍 **Finding Jobs:**\n• Use the Jobs page to browse all listings\n• Check Recommendations for AI-matched jobs\n• Filter by type, location, and experience\n• Save interesting jobs with the bookmark icon\n• The AI match score helps prioritize applications!';
  }
  return '👋 Hi! I\'m SkillBot. I can help you with:\n• Job search strategies\n• Resume & cover letter tips\n• Interview preparation\n• Understanding your AI match scores\n• Navigating SkillSync features\n\nWhat would you like to know?';
}

module.exports = router;
