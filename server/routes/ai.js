// const express = require('express');
// const router = express.Router();
// const Anthropic = require('@anthropic-ai/sdk');
// const { verifyToken } = require('../middleware/auth');

// const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// // ─── AI Chat Tutor ────────────────────────────────────────────────────────────
// router.post('/chat', verifyToken, async (req, res) => {
//   const { messages, subject, studentLevel } = req.body;

//   const systemPrompt = `You are Nex, an expert AI tutor for the BrainNex education platform. 
// You are helping a student study ${subject || 'various subjects'} at ${studentLevel || 'intermediate'} level.

// Your personality:
// - Encouraging, patient, and enthusiastic about learning
// - Break down complex concepts into simple, digestible explanations
// - Use real-world examples and analogies
// - Ask follow-up questions to check understanding
// - Offer to generate a quiz when a concept is explained
// - Use markdown formatting for clarity (bold, code blocks for formulas/equations)
// - Keep responses concise but thorough

// When explaining concepts, always structure as:
// 1. Simple explanation first
// 2. Key formula or rule (if applicable, use code block)
// 3. Real-world example
// 4. Quick comprehension check

// Respond in a friendly, mentor-like tone.`;

//   try {
//     const response = await client.messages.create({
//       model: 'claude-haiku-4-5-20251001',
//       max_tokens: 1024,
//       system: systemPrompt,
//       messages: messages.map(m => ({ role: m.role, content: m.content })),
//     });

//     res.json({
//       content: response.content[0].text,
//       usage: response.usage,
//     });
//   } catch (err) {
//     console.error('AI chat error:', err);
//     res.status(500).json({ error: 'AI service unavailable. Please try again.' });
//   }
// });

// // ─── Quiz Generator ───────────────────────────────────────────────────────────
// router.post('/generate-quiz', verifyToken, async (req, res) => {
//   const { subject, topic, difficulty, numQuestions = 5 } = req.body;

//   const prompt = `Generate a quiz for a student studying ${subject} on the topic: "${topic}".
// Difficulty: ${difficulty} (beginner = basic recall, intermediate = application, advanced = analysis/synthesis)
// Number of questions: ${numQuestions}

// Return ONLY valid JSON in this exact format, no markdown, no extra text:
// {
//   "title": "Quiz title",
//   "subject": "${subject}",
//   "topic": "${topic}",
//   "difficulty": "${difficulty}",
//   "questions": [
//     {
//       "id": 1,
//       "question": "Question text here?",
//       "options": ["Option A", "Option B", "Option C", "Option D"],
//       "correctIndex": 1,
//       "explanation": "Detailed explanation of why this answer is correct and why others are wrong.",
//       "hint": "A helpful hint without giving away the answer"
//     }
//   ]
// }

// Make questions progressively harder. Ensure exactly one correct answer per question. Explanations should be educational and reinforce learning.`;

//   try {
//     const response = await client.messages.create({
//       model: 'claude-haiku-4-5-20251001',
//       max_tokens: 2048,
//       messages: [{ role: 'user', content: prompt }],
//     });

//     const text = response.content[0].text.trim();
//     const jsonMatch = text.match(/\{[\s\S]*\}/);
//     if (!jsonMatch) throw new Error('Invalid JSON response from AI');

//     const quiz = JSON.parse(jsonMatch[0]);
//     res.json(quiz);
//   } catch (err) {
//     console.error('Quiz generation error:', err);
//     res.status(500).json({ error: 'Failed to generate quiz. Please try again.' });
//   }
// });

// // ─── Weak Topic Detector ──────────────────────────────────────────────────────
// router.post('/detect-weak-topics', verifyToken, async (req, res) => {
//   const { quizHistory } = req.body; // Array of { subject, topic, score, difficulty, timestamp }

//   if (!quizHistory || quizHistory.length === 0) {
//     return res.json({ weakTopics: [], insights: 'Take more quizzes to get personalized insights!' });
//   }

//   const prompt = `Analyze this student's quiz performance history and identify weak areas:

// ${JSON.stringify(quizHistory, null, 2)}

// Return ONLY valid JSON:
// {
//   "weakTopics": [
//     {
//       "subject": "subject name",
//       "topic": "specific topic",
//       "averageScore": 45,
//       "attempts": 3,
//       "priority": "high|medium|low",
//       "recommendation": "Specific study recommendation for this topic"
//     }
//   ],
//   "insights": "2-3 sentence personalized analysis of overall performance patterns",
//   "suggestedFocus": "The single most important area to study next",
//   "strengths": ["topic1", "topic2"]
// }

// Topics below 60% average are weak. Prioritize by frequency of low scores.`;

//   try {
//     const response = await client.messages.create({
//       model: 'claude-haiku-4-5-20251001',
//       max_tokens: 1024,
//       messages: [{ role: 'user', content: prompt }],
//     });

//     const text = response.content[0].text.trim();
//     const jsonMatch = text.match(/\{[\s\S]*\}/);
//     const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { weakTopics: [], insights: 'Analysis complete.' };
//     res.json(result);
//   } catch (err) {
//     console.error('Weak topic detection error:', err);
//     res.status(500).json({ error: 'Analysis failed.' });
//   }
// });

// // ─── Learning Path Generator ──────────────────────────────────────────────────
// router.post('/learning-path', verifyToken, async (req, res) => {
//   const { subject, currentLevel, completedTopics } = req.body;

//   const prompt = `Create a structured learning path for ${subject} at ${currentLevel} level.
// Completed topics: ${completedTopics?.join(', ') || 'none yet'}

// Return ONLY valid JSON:
// {
//   "subject": "${subject}",
//   "totalTopics": 12,
//   "nodes": [
//     {
//       "id": "1",
//       "title": "Topic Name",
//       "description": "Brief description",
//       "level": "beginner|intermediate|advanced",
//       "status": "completed|current|locked",
//       "prerequisites": [],
//       "estimatedMinutes": 30,
//       "xpReward": 50
//     }
//   ],
//   "connections": [
//     { "from": "1", "to": "2" }
//   ]
// }

// Create 10-14 nodes organized in a logical progression. Mark completed topics as "completed", the next logical topic as "current", rest as "locked". Connect prerequisites with edges.`;

//   try {
//     const response = await client.messages.create({
//       model: 'claude-haiku-4-5-20251001',
//       max_tokens: 2048,
//       messages: [{ role: 'user', content: prompt }],
//     });

//     const text = response.content[0].text.trim();
//     const jsonMatch = text.match(/\{[\s\S]*\}/);
//     const path = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
//     if (!path) throw new Error('Invalid path data');
//     res.json(path);
//   } catch (err) {
//     console.error('Learning path error:', err);
//     res.status(500).json({ error: 'Failed to generate learning path.' });
//   }
// });

// // ─── Adaptive Difficulty Suggestion ──────────────────────────────────────────
// router.post('/adaptive-difficulty', verifyToken, async (req, res) => {
//   const { recentScores, currentDifficulty } = req.body;

//   if (!recentScores || recentScores.length === 0) {
//     return res.json({ recommendedDifficulty: currentDifficulty || 'intermediate', reason: 'Not enough data yet.' });
//   }

//   const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
//   let recommendedDifficulty = currentDifficulty;
//   let reason = '';

//   if (avg >= 85 && currentDifficulty !== 'advanced') {
//     recommendedDifficulty = currentDifficulty === 'beginner' ? 'intermediate' : 'advanced';
//     reason = `Excellent performance (${Math.round(avg)}% avg)! You're ready for a bigger challenge.`;
//   } else if (avg < 55 && currentDifficulty !== 'beginner') {
//     recommendedDifficulty = currentDifficulty === 'advanced' ? 'intermediate' : 'beginner';
//     reason = `Let's build a stronger foundation (${Math.round(avg)}% avg). Dropping difficulty to solidify understanding.`;
//   } else {
//     reason = `You're performing well at this level (${Math.round(avg)}% avg). Keep it up!`;
//   }

//   res.json({ recommendedDifficulty, reason, averageScore: Math.round(avg) });
// });

// module.exports = router;


const express = require('express');
const router  = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { verifyToken } = require('../middleware/auth');
 
// ─── THE CHEAPEST CLAUDE MODEL ────────────────────────────────
// claude-haiku-4-5-20251001 costs:
//   Input:  $0.80 per million tokens
//   Output: $4.00 per million tokens
// For a student with $5, this is ideal — thousands of interactions.
const MODEL       = 'claude-haiku-4-5-20251001';
const MAX_TOKENS  = 600;   // keep responses short → saves money
const QUIZ_TOKENS = 1500;  // quizzes need more tokens for JSON
 
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 
// ─── AI Chat Tutor ────────────────────────────────────────────
router.post('/chat', verifyToken, async (req, res) => {
  const { messages, subject, studentLevel } = req.body;
 
  const systemPrompt = `You are Nex, a friendly AI tutor for the BrainNex education platform.
Help the student study ${subject || 'any subject'} at ${studentLevel || 'intermediate'} level.
 
Rules:
- Be encouraging and clear
- Use simple language and real-world examples  
- Use **bold** for key terms and \`code blocks\` for formulas
- Keep responses concise (3-5 paragraphs max) to be cost-efficient
- Offer to quiz the student after explaining a concept`;
 
  try {
    const response = await client.messages.create({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     systemPrompt,
      // Only send last 8 messages to save tokens
      messages: messages.slice(-8).map(m => ({
        role:    m.role,
        content: m.content,
      })),
    });
 
    res.json({ content: response.content[0].text });
  } catch (err) {
    console.error('AI chat error:', err.message);
 
    // Friendly error if API key is wrong or limit hit
    if (err.status === 401) {
      return res.status(500).json({ error: 'Invalid API key. Check your .env file.' });
    }
    if (err.status === 429) {
      return res.status(500).json({ error: 'Rate limit hit. Wait a moment and try again.' });
    }
    res.status(500).json({ error: 'AI is unavailable right now. Try again shortly.' });
  }
});
 
// ─── Quiz Generator ───────────────────────────────────────────
router.post('/generate-quiz', verifyToken, async (req, res) => {
  const { subject, topic, difficulty, numQuestions = 5 } = req.body;
 
  // Cap at 5 questions to save tokens
  const safeNum = Math.min(numQuestions, 5);
 
  const prompt = `Generate a ${difficulty} quiz about "${topic}" in ${subject}. Exactly ${safeNum} questions.
 
Return ONLY this JSON, no other text:
{
  "title": "Quiz title",
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct (2 sentences max)",
      "hint": "A short hint"
    }
  ]
}`;
 
  try {
    const response = await client.messages.create({
      model:      MODEL,
      max_tokens: QUIZ_TOKENS,
      messages:   [{ role: 'user', content: prompt }],
    });
 
    const text      = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI returned invalid format');
 
    const quiz = JSON.parse(jsonMatch[0]);
    res.json(quiz);
  } catch (err) {
    console.error('Quiz generation error:', err.message);
    res.status(500).json({ error: 'Quiz generation failed. Please try again.' });
  }
});
 
// ─── Weak Topic Detector ──────────────────────────────────────
router.post('/detect-weak-topics', verifyToken, async (req, res) => {
  const { quizHistory } = req.body;
 
  if (!quizHistory || quizHistory.length === 0) {
    return res.json({
      weakTopics: [],
      insights: 'Take more quizzes to get personalized insights!',
    });
  }
 
  // Only analyze last 20 quizzes to save tokens
  const recent = quizHistory.slice(0, 20);
 
  const prompt = `Analyze this student's quiz history and find weak topics:
${JSON.stringify(recent)}
 
Return ONLY this JSON:
{
  "weakTopics": [
    {
      "subject": "subject",
      "topic": "topic name",
      "averageScore": 45,
      "attempts": 2,
      "priority": "high",
      "recommendation": "One sentence study tip"
    }
  ],
  "insights": "2 sentences about overall performance",
  "suggestedFocus": "Most important topic to study next",
  "strengths": ["topic1"]
}
 
Only include topics below 65% average. Priority: high < 50%, medium 50-64%.`;
 
  try {
    const response = await client.messages.create({
      model:      MODEL,
      max_tokens: 600,
      messages:   [{ role: 'user', content: prompt }],
    });
 
    const text      = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result    = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { weakTopics: [], insights: 'Analysis complete.' };
 
    res.json(result);
  } catch (err) {
    console.error('Weak topic error:', err.message);
    res.status(500).json({ error: 'Analysis failed.' });
  }
});
 
// ─── Learning Path Generator ──────────────────────────────────
router.post('/learning-path', verifyToken, async (req, res) => {
  const { subject, currentLevel, completedTopics } = req.body;
 
  const prompt = `Create a learning path for ${subject} at ${currentLevel} level.
Completed: ${completedTopics?.join(', ') || 'none'}
 
Return ONLY this JSON (exactly 10 nodes):
{
  "subject": "${subject}",
  "totalTopics": 10,
  "nodes": [
    {
      "id": "1",
      "title": "Topic Name",
      "description": "One sentence description",
      "level": "beginner",
      "status": "completed",
      "prerequisites": [],
      "estimatedMinutes": 30,
      "xpReward": 50
    }
  ],
  "connections": [{ "from": "1", "to": "2" }]
}
 
Status rules: completed topics → "completed", next logical → "current", rest → "locked"`;
 
  try {
    const response = await client.messages.create({
      model:      MODEL,
      max_tokens: QUIZ_TOKENS,
      messages:   [{ role: 'user', content: prompt }],
    });
 
    const text      = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid path data');
 
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('Learning path error:', err.message);
    res.status(500).json({ error: 'Failed to generate learning path.' });
  }
});
 
// ─── Adaptive Difficulty ──────────────────────────────────────
// This one uses NO AI — pure logic, costs $0
router.post('/adaptive-difficulty', verifyToken, async (req, res) => {
  const { recentScores, currentDifficulty } = req.body;
 
  if (!recentScores || recentScores.length === 0) {
    return res.json({
      recommendedDifficulty: currentDifficulty || 'intermediate',
      reason: 'Take more quizzes so AI can calibrate your difficulty.',
    });
  }
 
  const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  let recommendedDifficulty = currentDifficulty;
  let reason = '';
 
  if (avg >= 85 && currentDifficulty !== 'advanced') {
    recommendedDifficulty = currentDifficulty === 'beginner' ? 'intermediate' : 'advanced';
    reason = `You're averaging ${Math.round(avg)}% — excellent! Time to level up to ${recommendedDifficulty}.`;
  } else if (avg < 55 && currentDifficulty !== 'beginner') {
    recommendedDifficulty = currentDifficulty === 'advanced' ? 'intermediate' : 'beginner';
    reason = `You're averaging ${Math.round(avg)}%. Let's build a stronger foundation at ${recommendedDifficulty} level first.`;
  } else {
    reason = `You're averaging ${Math.round(avg)}% at ${currentDifficulty} level — right on track! Keep going.`;
  }
 
  res.json({ recommendedDifficulty, reason, averageScore: Math.round(avg) });
});
 
module.exports = router;
 