const express = require('express');
const router  = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { verifyToken } = require('../middleware/auth');
const usageLimiter = require('../middleware/usageLimiter');

const client      = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL       = 'claude-haiku-4-5-20251001';
const MAX_TOKENS  = 600;
const QUIZ_TOKENS = 1500;

const isJunior = g => ['Class 1','Class 2','Class 3','Class 4','Class 5'].includes(g);

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

router.post('/chat', verifyToken, usageLimiter('chat'), async (req, res) => {
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

router.post('/generate-quiz', verifyToken, usageLimiter('quiz'), async (req, res) => {
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

router.post('/learning-path', verifyToken, usageLimiter('learningPath'), async (req, res) => {
  const { subject, currentLevel, completedTopics, goal } = req.body;

  // Compact prompt — one-sentence descriptions keep the JSON under 800 tokens
  const prompt = `Create a ${currentLevel} learning path for ${subject}. Goal: ${goal || 'Master the Basics'}. Previously completed: ${completedTopics?.join(', ') || 'none'}.
Return ONLY minified JSON, no other text:
{"subject":"${subject}","totalTopics":10,"nodes":[{"id":"1","title":"Topic Name","description":"One sentence only.","level":"${currentLevel}","status":"current","prerequisites":[],"estimatedMinutes":30,"xpReward":100}],"connections":[{"from":"1","to":"2"}]}
Rules: exactly 10 nodes, one sentence per description, minified JSON, first node status=current rest=locked, mark any completed topics as completed.`;

  try {
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });
    const m = r.content[0].text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Invalid JSON from AI');
    res.json(JSON.parse(m[0]));
  } catch (err) {
    console.error('Learning path error:', err?.message || err);
    res.status(500).json({ error: 'Failed to generate path.' });
  }
});

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

router.post('/study-session', verifyToken, usageLimiter('studySession'), async (req, res) => {
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

router.post('/flashcards', verifyToken, usageLimiter('flashcards'), async (req, res) => {
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

router.post('/explain-answer', verifyToken, usageLimiter('explainAnswer'), async (req, res) => {
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

router.post('/weekly-report', verifyToken, usageLimiter('weeklyReport'), async (req, res) => {
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

router.post('/topic-lesson', verifyToken, usageLimiter('studySession'), async (req, res) => {
  const { subject, topic, level, goal } = req.body;

  if (!subject || !topic || !level) {
    return res.status(400).json({ error: 'Missing required fields: subject, topic, level' });
  }

  const prompt = `Write a lesson on "${topic}" in ${subject} at ${level} level.
Return ONLY minified JSON (no whitespace, no newlines between keys) matching this structure exactly:
{"title":"${topic}","subject":"${subject}","level":"${level}","sections":[{"id":1,"heading":"Introduction","content":"2-3 sentences introducing the topic.","type":"text"},{"id":2,"heading":"Core Concept","content":"2-3 sentences explaining the main idea.","type":"text"},{"id":3,"heading":"Key Rules","content":"2-3 sentences on important rules or formulas.","type":"highlight"},{"id":4,"heading":"Example","content":"2-3 sentences with a real-world example.","type":"example"},{"id":5,"heading":"Watch Out","content":"2-3 sentences on common mistakes.","type":"warning"}],"keyTakeaways":["Takeaway 1","Takeaway 2","Takeaway 3"],"estimatedMinutes":15}
IMPORTANT: Each content field must be 2-3 sentences maximum. Output minified JSON only.`;

  try {
    const r = await client.messages.create({ model: MODEL, max_tokens: 1800, messages: [{ role: 'user', content: prompt }] });
    const text = r.content[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('Topic lesson: no JSON found in response. Raw text:', text.slice(0, 200));
      throw new Error('AI did not return valid JSON');
    }
    const parsed = JSON.parse(match[0]);
    if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
      throw new Error('AI response missing sections array');
    }
    res.json(parsed);
  } catch (err) {
    console.error('Topic lesson error:', err?.message || err);
    res.status(500).json({ error: 'Failed to generate lesson.' });
  }
});

router.post('/topic-quiz', verifyToken, usageLimiter('quiz'), async (req, res) => {
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
