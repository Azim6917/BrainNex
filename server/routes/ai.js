const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { verifyToken } = require('../middleware/auth');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── AI Chat Tutor ────────────────────────────────────────────────────────────
router.post('/chat', verifyToken, async (req, res) => {
  const { messages, subject, studentLevel } = req.body;

  const systemPrompt = `You are Nex, an expert AI tutor for the BrainNex education platform. 
You are helping a student study ${subject || 'various subjects'} at ${studentLevel || 'intermediate'} level.

Your personality:
- Encouraging, patient, and enthusiastic about learning
- Break down complex concepts into simple, digestible explanations
- Use real-world examples and analogies
- Ask follow-up questions to check understanding
- Offer to generate a quiz when a concept is explained
- Use markdown formatting for clarity (bold, code blocks for formulas/equations)
- Keep responses concise but thorough

When explaining concepts, always structure as:
1. Simple explanation first
2. Key formula or rule (if applicable, use code block)
3. Real-world example
4. Quick comprehension check

Respond in a friendly, mentor-like tone.`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    res.json({
      content: response.content[0].text,
      usage: response.usage,
    });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'AI service unavailable. Please try again.' });
  }
});

// ─── Quiz Generator ───────────────────────────────────────────────────────────
router.post('/generate-quiz', verifyToken, async (req, res) => {
  const { subject, topic, difficulty, numQuestions = 5 } = req.body;

  const prompt = `Generate a quiz for a student studying ${subject} on the topic: "${topic}".
Difficulty: ${difficulty} (beginner = basic recall, intermediate = application, advanced = analysis/synthesis)
Number of questions: ${numQuestions}

Return ONLY valid JSON in this exact format, no markdown, no extra text:
{
  "title": "Quiz title",
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 1,
      "explanation": "Detailed explanation of why this answer is correct and why others are wrong.",
      "hint": "A helpful hint without giving away the answer"
    }
  ]
}

Make questions progressively harder. Ensure exactly one correct answer per question. Explanations should be educational and reinforce learning.`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON response from AI');

    const quiz = JSON.parse(jsonMatch[0]);
    res.json(quiz);
  } catch (err) {
    console.error('Quiz generation error:', err);
    res.status(500).json({ error: 'Failed to generate quiz. Please try again.' });
  }
});

// ─── Weak Topic Detector ──────────────────────────────────────────────────────
router.post('/detect-weak-topics', verifyToken, async (req, res) => {
  const { quizHistory } = req.body; // Array of { subject, topic, score, difficulty, timestamp }

  if (!quizHistory || quizHistory.length === 0) {
    return res.json({ weakTopics: [], insights: 'Take more quizzes to get personalized insights!' });
  }

  const prompt = `Analyze this student's quiz performance history and identify weak areas:

${JSON.stringify(quizHistory, null, 2)}

Return ONLY valid JSON:
{
  "weakTopics": [
    {
      "subject": "subject name",
      "topic": "specific topic",
      "averageScore": 45,
      "attempts": 3,
      "priority": "high|medium|low",
      "recommendation": "Specific study recommendation for this topic"
    }
  ],
  "insights": "2-3 sentence personalized analysis of overall performance patterns",
  "suggestedFocus": "The single most important area to study next",
  "strengths": ["topic1", "topic2"]
}

Topics below 60% average are weak. Prioritize by frequency of low scores.`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { weakTopics: [], insights: 'Analysis complete.' };
    res.json(result);
  } catch (err) {
    console.error('Weak topic detection error:', err);
    res.status(500).json({ error: 'Analysis failed.' });
  }
});

// ─── Learning Path Generator ──────────────────────────────────────────────────
router.post('/learning-path', verifyToken, async (req, res) => {
  const { subject, currentLevel, completedTopics } = req.body;

  const prompt = `Create a structured learning path for ${subject} at ${currentLevel} level.
Completed topics: ${completedTopics?.join(', ') || 'none yet'}

Return ONLY valid JSON:
{
  "subject": "${subject}",
  "totalTopics": 12,
  "nodes": [
    {
      "id": "1",
      "title": "Topic Name",
      "description": "Brief description",
      "level": "beginner|intermediate|advanced",
      "status": "completed|current|locked",
      "prerequisites": [],
      "estimatedMinutes": 30,
      "xpReward": 50
    }
  ],
  "connections": [
    { "from": "1", "to": "2" }
  ]
}

Create 10-14 nodes organized in a logical progression. Mark completed topics as "completed", the next logical topic as "current", rest as "locked". Connect prerequisites with edges.`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const path = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (!path) throw new Error('Invalid path data');
    res.json(path);
  } catch (err) {
    console.error('Learning path error:', err);
    res.status(500).json({ error: 'Failed to generate learning path.' });
  }
});

// ─── Adaptive Difficulty Suggestion ──────────────────────────────────────────
router.post('/adaptive-difficulty', verifyToken, async (req, res) => {
  const { recentScores, currentDifficulty } = req.body;

  if (!recentScores || recentScores.length === 0) {
    return res.json({ recommendedDifficulty: currentDifficulty || 'intermediate', reason: 'Not enough data yet.' });
  }

  const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  let recommendedDifficulty = currentDifficulty;
  let reason = '';

  if (avg >= 85 && currentDifficulty !== 'advanced') {
    recommendedDifficulty = currentDifficulty === 'beginner' ? 'intermediate' : 'advanced';
    reason = `Excellent performance (${Math.round(avg)}% avg)! You're ready for a bigger challenge.`;
  } else if (avg < 55 && currentDifficulty !== 'beginner') {
    recommendedDifficulty = currentDifficulty === 'advanced' ? 'intermediate' : 'beginner';
    reason = `Let's build a stronger foundation (${Math.round(avg)}% avg). Dropping difficulty to solidify understanding.`;
  } else {
    reason = `You're performing well at this level (${Math.round(avg)}% avg). Keep it up!`;
  }

  res.json({ recommendedDifficulty, reason, averageScore: Math.round(avg) });
});

module.exports = router;

// ─── Study Session Generator ──────────────────────────────────────────────────
router.post('/study-session', verifyToken, async (req, res) => {
  const { subject, topic, level = 'intermediate' } = req.body;

  const prompt = `Create a structured study session for a ${level} student learning about "${topic}" in ${subject}.

Return ONLY valid JSON, no markdown, no extra text:
{
  "topic": "${topic}",
  "subject": "${subject}",
  "level": "${level}",
  "estimatedMinutes": 15,
  "cards": [
    {
      "id": 1,
      "title": "Introduction",
      "emoji": "📖",
      "content": "Clear explanation of the concept in 2-3 sentences. Use simple language.",
      "formula": "Optional formula/rule (null if not applicable)",
      "formulaLabel": "Optional label like 'Key Formula'",
      "example": "A concrete real-world example that makes it relatable",
      "keyPoints": ["Point 1", "Point 2", "Point 3"]
    }
  ],
  "checkpoints": [
    {
      "afterCard": 2,
      "question": "A comprehension question based on cards 1-2?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Requirements:
- Exactly 5 cards: Introduction, Core Concept, Formula/Rules, Real-World Application, Common Mistakes
- Exactly 2 checkpoints: after card 2 and after card 4
- Cards should flow logically from simple to complex
- Use emojis that match each card's theme
- Make content engaging and student-friendly
- keyPoints should have exactly 3 items`;

  try {
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages:   [{ role: 'user', content: prompt }],
    });

    const text  = response.content[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid JSON from AI');

    const session = JSON.parse(match[0]);
    res.json(session);
  } catch (err) {
    console.error('Study session error:', err.message);
    res.status(500).json({ error: 'Failed to generate study session. Please try again.' });
  }
});

// ─── Flashcard Generator ──────────────────────────────────────────────────────
router.post('/flashcards', verifyToken, async (req, res) => {
  const { subject, topic, wrongQuestions } = req.body;

  const prompt = `Create 5 flashcards to help a student review "${topic}" in ${subject}.
Focus on these areas they struggled with: ${wrongQuestions?.join(', ') || 'general concepts'}.

Return ONLY valid JSON:
{
  "flashcards": [
    {
      "id": 1,
      "front": "Question or concept on the front of the card",
      "back": "Clear answer or explanation on the back",
      "hint": "A brief hint to help recall",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Make flashcards concise. Front should be a question or term. Back should be the answer.`;

  try {
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages:   [{ role: 'user', content: prompt }],
    });

    const text  = response.content[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid JSON');
    res.json(JSON.parse(match[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate flashcards.' });
  }
});

// ─── Explain Answer ───────────────────────────────────────────────────────────
router.post('/explain-answer', verifyToken, async (req, res) => {
  const { question, correctAnswer, subject } = req.body;

  const prompt = `A student got this ${subject} question wrong and wants a deeper explanation:

Question: ${question}
Correct Answer: ${correctAnswer}

Give a clear, friendly explanation in 3-4 sentences. Include:
1. Why the correct answer is right
2. A helpful analogy or memory trick
3. One common mistake to avoid

Keep it under 100 words. Be encouraging.`;

  try {
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages:   [{ role: 'user', content: prompt }],
    });
    res.json({ explanation: response.content[0].text.trim() });
  } catch (err) {
    res.status(500).json({ error: 'Explanation failed.' });
  }
});

// ─── Weekly AI Report ─────────────────────────────────────────────────────────
router.post('/weekly-report', verifyToken, async (req, res) => {
  const { quizHistory, streak, totalXP } = req.body;

  if (!quizHistory || quizHistory.length === 0) {
    return res.json({ report: "You haven't taken any quizzes this week yet. Start a quiz to get your personalized weekly report!" });
  }

  const prompt = `Generate a brief, encouraging weekly study report for a student.

Their data:
- Quizzes taken: ${quizHistory.length}
- Current streak: ${streak} days
- Total XP: ${totalXP}
- Quiz results: ${JSON.stringify(quizHistory.slice(0, 10))}

Write a 3-4 sentence personalized report that:
1. Highlights their strongest subject this week
2. Identifies one area to focus on
3. Celebrates their streak/XP progress
4. Gives one specific actionable tip for next week

Be warm, encouraging, and specific. Use their actual data. Keep it under 80 words.`;

  try {
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages:   [{ role: 'user', content: prompt }],
    });
    res.json({ report: response.content[0].text.trim() });
  } catch (err) {
    res.status(500).json({ error: 'Report generation failed.' });
  }
});
