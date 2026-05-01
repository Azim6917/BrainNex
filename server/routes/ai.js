const express = require('express');
const router  = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { verifyToken } = require('../middleware/auth');

const client      = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL       = 'claude-haiku-4-5-20251001';
const MAX_TOKENS  = 600;
const QUIZ_TOKENS = 1500;

/* ── Grade helpers ── */
const isJunior = g => ['Class 1','Class 2','Class 3','Class 4','Class 5'].includes(g);
const isMiddle = g => ['Class 6','Class 7','Class 8'].includes(g);

function buildChatSystem(subject, level, grade) {
  return `You are Nex, an expert AI tutor on BrainNex helping a ${grade || 'student'} study ${subject || 'various topics'}.

Your role:
- Explain concepts clearly and accurately for the subject: ${subject}
- Give examples, solve problems, and quiz the student on ${subject}
- Adapt complexity to ${level || 'intermediate'} level
- Be encouraging and educational
- For programming subjects like Python, JavaScript etc: provide code examples in code blocks
- For any subject provided, you are an expert in it

Keep responses concise but thorough. Use markdown formatting for better readability.`;
}

/* ─── Chat ─────────────────────────────────────────────────────── */
router.post('/chat', verifyToken, async (req, res) => {
  const { messages, subject, studentLevel, grade } = req.body;
  try {
    const response = await client.messages.create({
      model: MODEL, max_tokens: MAX_TOKENS,
      system: buildChatSystem(subject, studentLevel, grade),
      messages: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
    });
    res.json({ content: response.content[0].text });
  } catch (err) {
    console.error('Chat error:', err.message);
    if (err.status === 401) return res.status(500).json({ error: 'Invalid Anthropic API key.' });
    if (err.status === 429) return res.status(500).json({ error: 'Rate limit hit. Wait a moment.' });
    res.status(500).json({ error: 'AI unavailable. Try again.' });
  }
});

/* ─── Quiz Generator ────────────────────────────────────────────── */
router.post('/generate-quiz', verifyToken, async (req, res) => {
  const { subject, topic, difficulty, numQuestions = 5, grade } = req.body;
  const safeNum = Math.min(+numQuestions, 5);
  const kid     = isJunior(grade);

  const prompt = kid
    ? `Create a fun quiz for a ${grade} child about "${topic}" in ${subject}. ${safeNum} easy, playful questions.
Return ONLY valid JSON:
{
  "title": "Fun ${topic} Quiz! 🌟",
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "beginner",
  "questions": [{
    "id": 1,
    "question": "Simple question with emoji?",
    "options": ["Option A 🐱","Option B 🐶","Option C 🐸","Option D 🐻"],
    "correctIndex": 0,
    "explanation": "One simple sentence. 😊",
    "hint": "Easy hint"
  }]
}
Use emojis. Keep language very simple.`
    : `Generate a ${difficulty} quiz on "${topic}" in ${subject}. ${safeNum} questions.
Return ONLY valid JSON:
{
  "title": "Quiz title",
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [{
    "id": 1,
    "question": "Question?",
    "options": ["A","B","C","D"],
    "correctIndex": 0,
    "explanation": "Clear 2-sentence explanation.",
    "hint": "Helpful hint"
  }]
}`;

  try {
    const response = await client.messages.create({ model:MODEL, max_tokens:QUIZ_TOKENS, messages:[{ role:'user', content:prompt }] });
    const text  = response.content[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid JSON');
    res.json(JSON.parse(match[0]));
  } catch (err) {
    console.error('Quiz error:', err.message);
    res.status(500).json({ error: 'Quiz generation failed.' });
  }
});

/* ─── Weak Topic Detector ───────────────────────────────────────── */
router.post('/detect-weak-topics', verifyToken, async (req, res) => {
  const { quizHistory } = req.body;
  if (!quizHistory?.length) return res.json({ weakTopics:[], insights:'Take more quizzes for insights!' });

  const prompt = `Analyze quiz history, find weak areas:
${JSON.stringify(quizHistory.slice(0,20))}
Return ONLY JSON:
{"weakTopics":[{"subject":"","topic":"","averageScore":0,"attempts":1,"priority":"high","recommendation":"One sentence tip"}],"insights":"2 sentences","suggestedFocus":"Most important topic","strengths":[]}
Only topics below 65%. Priority: high<50%, medium 50-64%.`;

  try {
    const r = await client.messages.create({ model:MODEL, max_tokens:600, messages:[{ role:'user', content:prompt }] });
    const m = r.content[0].text.match(/\{[\s\S]*\}/);
    res.json(m ? JSON.parse(m[0]) : { weakTopics:[], insights:'Analysis complete.' });
  } catch { res.status(500).json({ error:'Analysis failed.' }); }
});

/* ─── Learning Path ─────────────────────────────────────────── */
router.post('/learning-path', verifyToken, async (req, res) => {
  const { subject, currentLevel, completedTopics, goal } = req.body;
  const prompt = `Create a highly detailed, comprehensive learning path for ${subject} at ${currentLevel} level. Completed: ${completedTopics?.join(',') || 'none'}. Student goal: ${goal || 'Master the Basics'}.
Break down the subject into specific, deeply focused sub-topics rather than broad categories. Ensure it forms a complete step-by-step curriculum.
Return ONLY JSON (10 nodes):
{"subject":"${subject}","totalTopics":10,"nodes":[{"id":"1","title":"Specific Topic Name","description":"Detailed explanation of what this covers","level":"beginner","status":"completed","prerequisites":[],"estimatedMinutes":30,"xpReward":50}],"connections":[{"from":"1","to":"2"}]}
Status: completed=done, current=next logical, locked=rest.`;

  try {
    const r = await client.messages.create({ model: MODEL, max_tokens: QUIZ_TOKENS, messages: [{ role: 'user', content: prompt }] });
    const m = r.content[0].text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Invalid');
    res.json(JSON.parse(m[0]));
  } catch { res.status(500).json({ error: 'Failed to generate path.' }); }
});

/* ─── Adaptive Difficulty (no AI — pure logic) ──────────────────── */
router.post('/adaptive-difficulty', verifyToken, async (req, res) => {
  const { recentScores, currentDifficulty } = req.body;
  if (!recentScores?.length) return res.json({ recommendedDifficulty: currentDifficulty||'intermediate', reason:'Take more quizzes to calibrate.' });
  const avg = recentScores.reduce((a,b)=>a+b,0)/recentScores.length;
  let rec = currentDifficulty, reason = '';
  if (avg>=85 && currentDifficulty!=='advanced') {
    rec = currentDifficulty==='beginner' ? 'intermediate' : 'advanced';
    reason = `Excellent ${Math.round(avg)}% average! Time to level up to ${rec}.`;
  } else if (avg<55 && currentDifficulty!=='beginner') {
    rec = currentDifficulty==='advanced' ? 'intermediate' : 'beginner';
    reason = `${Math.round(avg)}% average — let's build a stronger foundation at ${rec} level.`;
  } else {
    reason = `You're performing well at ${Math.round(avg)}% — keep going at ${currentDifficulty} level!`;
  }
  res.json({ recommendedDifficulty:rec, reason, averageScore:Math.round(avg) });
});

/* ─── Study Session ─────────────────────────────────────────────── */
router.post('/study-session', verifyToken, async (req, res) => {
  const { subject, topic, level = 'intermediate', grade } = req.body;
  const kid = isJunior(grade);

  const prompt = kid
    ? `Create a fun study session for a ${grade} child learning "${topic}" in ${subject}.
Return ONLY valid JSON:
{
  "topic": "${topic}",
  "subject": "${subject}",
  "level": "beginner",
  "estimatedMinutes": 10,
  "cards": [
    {"id":1,"title":"What is it? 🤔","emoji":"📖","content":"Very simple 2-sentence explanation a child understands.","formula":null,"formulaLabel":null,"example":"Relatable example using toys/animals/food.","keyPoints":["Simple point 1 😊","Simple point 2 🌟","Simple point 3 🎉"]}
  ],
  "checkpoints": [
    {"afterCard":2,"question":"Simple question? 🎮","options":["Option A 🐱","Option B 🐶","Option C 🐸","Option D 🐻"],"correctIndex":0,"explanation":"Simple 1-sentence explanation."}
  ]
}
Create 5 cards, 2 checkpoints. Use emojis. Very simple language.`
    : `Create a structured study session for a ${level} student learning "${topic}" in ${subject}.
Return ONLY valid JSON:
{
  "topic": "${topic}",
  "subject": "${subject}",
  "level": "${level}",
  "estimatedMinutes": 15,
  "cards": [
    {"id":1,"title":"Introduction","emoji":"📖","content":"Clear 2-3 sentence explanation.","formula":null,"formulaLabel":null,"example":"Real-world example.","keyPoints":["Point 1","Point 2","Point 3"]}
  ],
  "checkpoints": [
    {"afterCard":2,"question":"Comprehension question?","options":["A","B","C","D"],"correctIndex":0,"explanation":"Brief explanation."}
  ]
}
5 cards: Introduction, Core Concept, Formula/Rules, Application, Common Mistakes. 2 checkpoints.`;

  try {
    const r = await client.messages.create({ model:MODEL, max_tokens:2000, messages:[{ role:'user', content:prompt }] });
    const m = r.content[0].text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Invalid JSON');
    res.json(JSON.parse(m[0]));
  } catch { res.status(500).json({ error:'Failed to generate study session.' }); }
});

/* ─── Flashcards ─────────────────────────────────────────────────── */
router.post('/flashcards', verifyToken, async (req, res) => {
  const { subject, topic, wrongQuestions, grade } = req.body;
  const kid = isJunior(grade);
  const prompt = `Create 5 ${kid?'fun, simple':'clear'} flashcards for "${topic}" in ${subject}.
Focus on: ${wrongQuestions?.join(', ')||'key concepts'}.
Return ONLY JSON:
{"flashcards":[{"id":1,"front":"${kid?'Fun question? 🤔':'Question or concept'}","back":"${kid?'Simple answer! 😊':'Clear answer'}","hint":"${kid?'Easy hint 🌟':'Helpful hint'}","difficulty":"easy"}]}`;

  try {
    const r = await client.messages.create({ model:MODEL, max_tokens:800, messages:[{ role:'user', content:prompt }] });
    const m = r.content[0].text.match(/\{[\s\S]*\}/);
    res.json(m ? JSON.parse(m[0]) : { flashcards:[] });
  } catch { res.status(500).json({ error:'Flashcard generation failed.' }); }
});

/* ─── Explain Answer ─────────────────────────────────────────────── */
router.post('/explain-answer', verifyToken, async (req, res) => {
  const { question, correctAnswer, subject, grade } = req.body;
  const kid = isJunior(grade);
  const prompt = kid
    ? `A child got this ${subject} question wrong: "${question}". Correct answer: "${correctAnswer}".
Explain in 2 simple sentences using very easy words and 1 emoji. Be encouraging! 🌟`
    : `A student got this ${subject} question wrong: "${question}". Correct: "${correctAnswer}".
Give a clear 3-4 sentence explanation: why correct, an analogy, and what to avoid. Under 80 words. Be encouraging.`;

  try {
    const r = await client.messages.create({ model:MODEL, max_tokens:200, messages:[{ role:'user', content:prompt }] });
    res.json({ explanation: r.content[0].text.trim() });
  } catch { res.status(500).json({ error:'Explanation failed.' }); }
});

/* ─── Weekly Report ─────────────────────────────────────────────── */
router.post('/weekly-report', verifyToken, async (req, res) => {
  const { quizHistory, streak, totalXP, grade } = req.body;
  if (!quizHistory?.length) return res.json({ report:"Take some quizzes this week to get your AI report!" });
  const kid = isJunior(grade);
  const prompt = kid
    ? `Write a fun, encouraging weekly report for a ${grade} student!
Data: ${quizHistory.length} quizzes, ${streak} day streak, ${totalXP} XP.
Write 2-3 warm, playful sentences. Use emojis. Celebrate what they did well. Under 60 words.`
    : `Write a brief weekly study report for a student.
Data: ${quizHistory.length} quizzes, ${streak} day streak, ${totalXP} XP.
Quiz results: ${JSON.stringify(quizHistory.slice(0,10))}.
3-4 sentences: highlight strongest subject, one improvement area, celebrate streak/XP, one specific tip. Under 80 words.`;

  try {
    const r = await client.messages.create({ model:MODEL, max_tokens:200, messages:[{ role:'user', content:prompt }] });
    res.json({ report: r.content[0].text.trim() });
  } catch { res.status(500).json({ error:'Report failed.' }); }
});

/* ─── Topic Lesson ──────────────────────────────────────────────────────────── */
router.post('/topic-lesson', verifyToken, async (req, res) => {
  const { subject, topic, level, goal } = req.body;
  const prompt = `Create a highly detailed, comprehensive lesson for topic "${topic}" in ${subject} at ${level} level. Goal: ${goal || 'Master the Basics'}.
Make the content rich, in-depth, and highly relevant to the specific topic.
Return ONLY valid JSON:
{
  "title": "${topic}",
  "subject": "${subject}",
  "level": "${level}",
  "sections": [
    { "id": 1, "heading": "Introduction", "content": "Detailed 2-3 paragraph introduction covering the fundamentals.", "type": "text" },
    { "id": 2, "heading": "In-Depth Core Concept", "content": "Comprehensive explanation diving deep into the mechanics.", "type": "text" },
    { "id": 3, "heading": "Key Principles & Rules", "content": "Crucial rules, formulas, or standards to memorize.", "type": "highlight" },
    { "id": 4, "heading": "Real World Application", "content": "Detailed practical application and use cases.", "type": "example" },
    { "id": 5, "heading": "Common Pitfalls", "content": "What to avoid, why, and best practices.", "type": "warning" }
  ],
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4"],
  "estimatedMinutes": 25
}`;

  try {
    const r = await client.messages.create({ model: MODEL, max_tokens: 1500, messages: [{ role: 'user', content: prompt }] });
    const m = r.content[0].text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Invalid JSON');
    res.json(JSON.parse(m[0]));
  } catch { res.status(500).json({ error: 'Failed to generate lesson.' }); }
});

/* ─── Topic Quiz ─────────────────────────────────────────────────────────────── */
router.post('/topic-quiz', verifyToken, async (req, res) => {
  const { subject, topic, level } = req.body;
  const prompt = `Generate a ${level} quiz on "${topic}" in ${subject}. 5 questions.
Return ONLY valid JSON:
{
  "title": "${topic} Quiz",
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "${level}",
  "questions": [{
    "id": 1,
    "question": "Question?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "Clear 2-sentence explanation.",
    "hint": "Helpful hint"
  }]
}`;

  try {
    const r = await client.messages.create({ model: MODEL, max_tokens: 1200, messages: [{ role: 'user', content: prompt }] });
    const m = r.content[0].text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Invalid JSON');
    res.json(JSON.parse(m[0]));
  } catch { res.status(500).json({ error: 'Quiz generation failed.' }); }
});

/* ─── Topic Resources ────────────────────────────────────────────────────────── */
router.post('/topic-resources', verifyToken, async (req, res) => {
  const { subject, topic } = req.body;
  const prompt = `Suggest 4 highly relevant learning resources for "${topic}" in ${subject}.
To avoid broken links, YOU MUST ONLY RETURN SEARCH URLs or guaranteed working URLs.
For YouTube: https://www.youtube.com/results?search_query=YOUR+SEARCH+QUERY
For MDN: https://developer.mozilla.org/en-US/search?q=YOUR+SEARCH+QUERY
For Khan Academy: https://www.khanacademy.org/search?page_search_query=YOUR+SEARCH+QUERY
For freeCodeCamp: https://www.freecodecamp.org/news/search/?query=YOUR+SEARCH+QUERY

Return ONLY valid JSON:
{
  "resources": [
    { "title": "Resource name", "url": "Search URL from above formats", "type": "documentation|tutorial|video|course", "description": "One sentence about what they will learn", "platform": "Platform Name" }
  ]
}
Type must be one of: documentation, tutorial, video, course.`;

  try {
    const r = await client.messages.create({ model: MODEL, max_tokens: 600, messages: [{ role: 'user', content: prompt }] });
    const m = r.content[0].text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Invalid JSON');
    res.json(JSON.parse(m[0]));
  } catch { res.status(500).json({ error: 'Resource generation failed.' }); }
});

module.exports = router;
