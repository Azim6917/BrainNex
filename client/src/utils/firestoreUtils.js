/**
 * firestoreUtils.js
 * All Firestore writes happen here — no backend server needed for stats.
 * XP, streaks, badges, quiz history all saved directly to Firestore.
 */
import {
  doc, collection, addDoc, updateDoc, getDoc, getDocs,
  arrayUnion, serverTimestamp, query, orderBy, limit, where,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

const ALL_BADGES = [
  { id: 'first-quiz',    name: 'First Quiz!',     icon: '📝', desc: 'Complete your first quiz' },
  { id: 'perfect-score', name: 'Perfect Score!',  icon: '💯', desc: 'Score 100% on any quiz' },
  { id: '10-quizzes',    name: 'Quiz Veteran',     icon: '🏆', desc: 'Complete 10 quizzes' },
  { id: '25-quizzes',    name: 'Quiz Master',      icon: '🎓', desc: 'Complete 25 quizzes' },
  { id: '1k-xp',         name: '1000 XP Club',     icon: '⚡', desc: 'Earn 1,000 XP total' },
  { id: '5k-xp',         name: 'XP Champion',      icon: '🌟', desc: 'Earn 5,000 XP total' },
  { id: 'streak-3',      name: '3-Day Streak',     icon: '🔥', desc: 'Study 3 days in a row' },
  { id: 'streak-7',      name: 'Week Warrior',     icon: '🔥', desc: 'Study 7 days in a row' },
  { id: 'streak-14',     name: 'Fortnight Fire',   icon: '🔥', desc: 'Study 14 days in a row' },
  { id: 'streak-30',     name: 'Month Master',     icon: '👑', desc: 'Study 30 days in a row' },
  { id: 'multi-subject', name: 'Polymath',         icon: '🧠', desc: 'Study 5 different subjects' },
  { id: 'high-scorer',   name: 'High Scorer',      icon: '🎯', desc: 'Average quiz score above 80%' },
];

function xpForLevel(xp) {
  return Math.floor(xp / 500) + 1;
}

/**
 * Save a quiz result directly to Firestore and update user profile.
 * Returns { xpEarned, newXp, newLevel, newBadges }
 */
export async function saveQuizResultToFirestore(uid, { subject, topic, score, totalQuestions, correctAnswers, difficulty }) {
  if (!uid) return null;

  const xpEarned = correctAnswers * 10 + (score === 100 ? 50 : score >= 80 ? 25 : 10);
  const userRef  = doc(db, 'users', uid);

  try {
    // 1. Save quiz result to subcollection
    await addDoc(collection(db, 'quizResults', uid, 'results'), {
      subject,
      topic,
      score,
      totalQuestions,
      correctAnswers,
      difficulty,
      xpEarned,
      timestamp: serverTimestamp(),
    });

    // 2. Read current user data
    const snap     = await getDoc(userRef);
    const userData = snap.data() || {};

    const newXp          = (userData.xp || 0) + xpEarned;
    const newLevel       = xpForLevel(newXp);
    const totalQuizzes   = (userData.totalQuizzes || 0) + 1;
    const totalCorrect   = (userData.totalCorrect || 0) + correctAnswers;
    const totalQuestions2= (userData.totalQuestions || 0) + totalQuestions;
    const existingBadges = userData.badges || [];
    const existingIds    = new Set(existingBadges.map(b => b.id));
    const subjects       = userData.subjects || [];

    // 3. Check badges
    const newBadges = [];
    const addBadge = (id) => {
      if (!existingIds.has(id)) {
        const b = ALL_BADGES.find(x => x.id === id);
        if (b) { newBadges.push({ ...b, earnedAt: new Date().toISOString() }); existingIds.add(id); }
      }
    };

    if (totalQuizzes === 1)  addBadge('first-quiz');
    if (score === 100)       addBadge('perfect-score');
    if (totalQuizzes >= 10)  addBadge('10-quizzes');
    if (totalQuizzes >= 25)  addBadge('25-quizzes');
    if (newXp >= 1000)       addBadge('1k-xp');
    if (newXp >= 5000)       addBadge('5k-xp');

    // multi-subject badge
    const newSubjects = subjects.includes(subject) ? subjects : [...subjects, subject];
    if (newSubjects.length >= 5) addBadge('multi-subject');

    // high-scorer: check avg
    const avgScore = totalQuestions2 > 0 ? Math.round((totalCorrect / totalQuestions2) * 100) : 0;
    if (avgScore >= 80 && totalQuizzes >= 5) addBadge('high-scorer');

    // 4. Update user doc
    const updates = {
      xp:             newXp,
      level:          newLevel,
      totalQuizzes,
      totalCorrect,
      totalQuestions: totalQuestions2,
      subjects:       newSubjects,
      currentDifficulty: difficulty,
    };
    if (newBadges.length > 0) updates.badges = [...existingBadges, ...newBadges];

    await updateDoc(userRef, updates);

    return { xpEarned, newXp, newLevel, newBadges };
  } catch (err) {
    console.error('saveQuizResultToFirestore error:', err);
    return { xpEarned, newXp: 0, newLevel: 1, newBadges: [] };
  }
}

/**
 * Fetch quiz history directly from Firestore.
 */
export async function getQuizHistoryFromFirestore(uid, limitN = 30) {
  if (!uid) return [];
  try {
    const q    = query(
      collection(db, 'quizResults', uid, 'results'),
      orderBy('timestamp', 'desc'),
      limit(limitN)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.()?.toISOString() || null,
    }));
  } catch (err) {
    console.error('getQuizHistory error:', err);
    return [];
  }
}

/**
 * Get subject-level stats from quiz history.
 */
export async function getSubjectStatsFromFirestore(uid) {
  if (!uid) return [];
  try {
    const snap = await getDocs(collection(db, 'quizResults', uid, 'results'));
    const map  = {};
    snap.docs.forEach(d => {
      const { subject, score, topic } = d.data();
      if (!map[subject]) map[subject] = { scores: [], topics: new Set() };
      map[subject].scores.push(score);
      map[subject].topics.add(topic);
    });
    return Object.entries(map).map(([subject, { scores, topics }]) => ({
      subject,
      totalQuizzes:     scores.length,
      averageScore:     Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      topicsAttempted:  topics.size,
    }));
  } catch (err) {
    console.error('getSubjectStats error:', err);
    return [];
  }
}

/**
 * Update daily streak in Firestore (call once per day on login).
 */
export async function updateStreakInFirestore(uid) {
  if (!uid) return;
  try {
    const userRef  = doc(db, 'users', uid);
    const snap     = await getDoc(userRef);
    const userData = snap.data() || {};
    const today    = new Date().toDateString();
    if (userData.lastActiveDate === today) return userData; // already done

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let streak      = userData.streak || 0;
    if (userData.lastActiveDate === yesterday) streak += 1;
    else streak = 1;
    const longestStreak = Math.max(streak, userData.longestStreak || 0);

    const existingBadges = userData.badges || [];
    const existingIds    = new Set(existingBadges.map(b => b.id));
    const newBadges      = [];
    [3, 7, 14, 30].forEach(m => {
      if (streak >= m && !existingIds.has(`streak-${m}`)) {
        newBadges.push({ id: `streak-${m}`, name: `${m}-Day Streak`, icon: '🔥', earnedAt: new Date().toISOString() });
        existingIds.add(`streak-${m}`);
      }
    });

    const updates = { streak, longestStreak, lastActiveDate: today };
    if (newBadges.length > 0) updates.badges = [...existingBadges, ...newBadges];
    await updateDoc(userRef, updates);
    return { ...userData, ...updates };
  } catch (err) {
    console.error('updateStreak error:', err);
  }
}
