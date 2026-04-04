const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken } = require('../middleware/auth');

const db = admin.firestore();

// ─── Get User Profile & Stats ─────────────────────────────────────────────────
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('users').doc(uid).get();

    if (!doc.exists) {
      const newUser = {
        uid,
        displayName: req.user.name || 'Student',
        email: req.user.email,
        xp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        totalQuizzes: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        subjects: [],
        badges: [],
        currentDifficulty: 'intermediate',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection('users').doc(uid).set(newUser);
      return res.json(newUser);
    }

    res.json(doc.data());
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── Update Streak ────────────────────────────────────────────────────────────
router.post('/update-streak', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};

    const today = new Date().toDateString();
    const lastActive = userData.lastActiveDate;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let streak = userData.streak || 0;
    let longestStreak = userData.longestStreak || 0;

    if (lastActive === today) {
      return res.json({ streak, longestStreak, message: 'Already updated today' });
    } else if (lastActive === yesterday) {
      streak += 1;
    } else if (lastActive !== today) {
      streak = 1;
    }

    if (streak > longestStreak) longestStreak = streak;

    await userRef.update({
      streak,
      longestStreak,
      lastActiveDate: today,
    });

    // Check streak badges
    const newBadges = [];
    const existingBadges = userData.badges || [];
    const streakMilestones = [3, 7, 14, 30, 60, 100];
    for (const milestone of streakMilestones) {
      if (streak >= milestone && !existingBadges.find(b => b.id === `streak-${milestone}`)) {
        newBadges.push({ id: `streak-${milestone}`, name: `${milestone}-Day Streak`, icon: '🔥', earnedAt: new Date().toISOString() });
      }
    }
    if (newBadges.length > 0) {
      await userRef.update({ badges: admin.firestore.FieldValue.arrayUnion(...newBadges) });
    }

    res.json({ streak, longestStreak, newBadges });
  } catch (err) {
    console.error('Streak update error:', err);
    res.status(500).json({ error: 'Failed to update streak' });
  }
});

// ─── Save Quiz Result ─────────────────────────────────────────────────────────
router.post('/quiz-result', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { subject, topic, score, totalQuestions, correctAnswers, difficulty, timeTaken } = req.body;

    const xpEarned = correctAnswers * 10 + (score === 100 ? 100 : score >= 80 ? 50 : 20);

    // Save result
    await db.collection('quizResults').doc(uid).collection('results').add({
      subject,
      topic,
      score,
      totalQuestions,
      correctAnswers,
      difficulty,
      timeTaken,
      xpEarned,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user stats
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};

    const newXp = (userData.xp || 0) + xpEarned;
    const newLevel = Math.floor(newXp / 500) + 1;
    const newBadges = [];
    const existingBadges = userData.badges || [];
    const totalQuizzesNew = (userData.totalQuizzes || 0) + 1;

    // Badge checks
    if (totalQuizzesNew === 1 && !existingBadges.find(b => b.id === 'first-quiz'))
      newBadges.push({ id: 'first-quiz', name: 'First Quiz!', icon: '📝', earnedAt: new Date().toISOString() });
    if (score === 100 && !existingBadges.find(b => b.id === 'perfect-score'))
      newBadges.push({ id: 'perfect-score', name: 'Perfect Score!', icon: '💯', earnedAt: new Date().toISOString() });
    if (totalQuizzesNew >= 10 && !existingBadges.find(b => b.id === '10-quizzes'))
      newBadges.push({ id: '10-quizzes', name: 'Quiz Veteran', icon: '🏆', earnedAt: new Date().toISOString() });
    if (newXp >= 1000 && !existingBadges.find(b => b.id === '1k-xp'))
      newBadges.push({ id: '1k-xp', name: '1000 XP Club', icon: '⚡', earnedAt: new Date().toISOString() });

    const updateData = {
      xp: newXp,
      level: newLevel,
      totalQuizzes: totalQuizzesNew,
      totalCorrect: (userData.totalCorrect || 0) + correctAnswers,
      totalQuestions: (userData.totalQuestions || 0) + totalQuestions,
      currentDifficulty: difficulty,
    };

    if (!userData.subjects?.includes(subject)) {
      updateData.subjects = admin.firestore.FieldValue.arrayUnion(subject);
    }
    if (newBadges.length > 0) {
      updateData.badges = admin.firestore.FieldValue.arrayUnion(...newBadges);
    }

    await userRef.update(updateData);
    res.json({ xpEarned, newXp, newLevel, newBadges });
  } catch (err) {
    console.error('Save quiz result error:', err);
    res.status(500).json({ error: 'Failed to save result' });
  }
});

// ─── Get Quiz History ─────────────────────────────────────────────────────────
router.get('/quiz-history', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const limit = parseInt(req.query.limit) || 20;

    const snapshot = await db
      .collection('quizResults')
      .doc(uid)
      .collection('results')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate?.()?.toISOString() }));
    res.json(results);
  } catch (err) {
    console.error('Quiz history error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ─── Update User Difficulty ───────────────────────────────────────────────────
router.post('/update-difficulty', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { difficulty } = req.body;
    await db.collection('users').doc(uid).update({ currentDifficulty: difficulty });
    res.json({ success: true, difficulty });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update difficulty' });
  }
});

// ─── Get Subject Progress ─────────────────────────────────────────────────────
router.get('/subject-progress', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const snapshot = await db.collection('quizResults').doc(uid).collection('results').get();
    const subjectMap = {};

    snapshot.docs.forEach(doc => {
      const d = doc.data();
      if (!subjectMap[d.subject]) subjectMap[d.subject] = { total: 0, scores: [], topics: new Set() };
      subjectMap[d.subject].total++;
      subjectMap[d.subject].scores.push(d.score);
      subjectMap[d.subject].topics.add(d.topic);
    });

    const progress = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      totalQuizzes: data.total,
      averageScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      topicsAttempted: data.topics.size,
    }));

    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subject progress' });
  }
});

module.exports = router;
