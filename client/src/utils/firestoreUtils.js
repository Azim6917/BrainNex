/**
 * firestoreUtils.js
 * All Firestore writes happen here — no backend server needed for stats.
 * XP, streaks, badges, quiz history all saved directly to Firestore.
 */
import {
  doc, collection, addDoc, updateDoc, getDoc, getDocs, deleteDoc,
  arrayUnion, serverTimestamp, query, orderBy, limit, increment,
} from 'firebase/firestore';
import { db } from './firebase';
import toast from 'react-hot-toast';

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

export const LEVEL_THRESHOLDS = [0, 500, 1000, 2000, 3500, 5000, 8000, 12000, 20000, 50000];

export function xpForLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

/**
 * Save a quiz result and update XP.
 * Uses increment() for atomic XP updates — no transaction needed.
 * Each step is independent: a badge failure won't block XP from saving.
 */
export async function saveQuizResultToFirestore(uid, {
  subject, topic, score, totalQuestions, correctAnswers,
  difficulty, questions, isLearningPath, customXpReward,
}) {
  if (!uid) {
    console.error('saveQuizResult: no uid provided');
    return null;
  }

  const safeCorrect = Number(correctAnswers) || 0;
  const safeTotal   = Number(totalQuestions)  || 1;
  const safeScore   = Number(score)           || 0;
  const xpEarned    = Number(customXpReward)  || (safeCorrect * 10 + (safeScore === 100 ? 50 : safeScore >= 80 ? 25 : 10));

  const userRef = doc(db, 'users', uid);

  // ── STEP 1: Save quiz result record ─────────────────────────────────────────
  try {
    await addDoc(collection(db, 'quizResults', uid, 'results'), {
      subject,
      topic,
      score: safeScore,
      totalQuestions: safeTotal,
      correctAnswers: safeCorrect,
      difficulty,
      xpEarned,
      isLearningPath: isLearningPath || false,
      timestamp: serverTimestamp(),
      ...(questions ? { questions } : {}),
    });
  } catch (err) {
    // Show real error to user so we can diagnose Firestore rules issues
    const msg = err?.message || String(err);
    console.error('saveQuizResult STEP 1 (addDoc) failed:', msg);
    toast.error(`XP save failed (quiz record): ${msg}`, { duration: 6000 });
    return null;
  }

  // ── STEP 2: Atomically increment XP and counters ────────────────────────────
  try {
    await updateDoc(userRef, {
      xp:             increment(xpEarned),
      totalQuizzes:   increment(1),
      totalCorrect:   increment(safeCorrect),
      totalQuestions: increment(safeTotal),
      subjects:       arrayUnion(subject),
      currentDifficulty: difficulty || 'intermediate',
      lastUpdated:    serverTimestamp(),
    });
  } catch (err) {
    const msg = err?.message || String(err);
    console.error('saveQuizResult STEP 2 (increment XP) failed:', msg);
    toast.error(`XP increment failed: ${msg}`, { duration: 6000 });
    return null;
  }

  // ── STEP 3: Read back final XP and update level ──────────────────────────────
  let finalXp = 0;
  let finalLevel = 1;
  try {
    const snap = await getDoc(userRef);
    finalXp    = snap.data()?.xp || 0;
    finalLevel = xpForLevel(finalXp);
    await updateDoc(userRef, { level: finalLevel });
  } catch (err) {
    // Non-critical: XP was already saved. Level display may be stale.
    console.error('saveQuizResult STEP 3 (level sync) failed:', err?.message);
  }

  // ── STEP 4: Badge checks (non-critical, fire-and-forget) ────────────────────
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data           = snap.data();
      const existingIds    = new Set((data.badges || []).map(b => b.id));
      const newBadges      = [];
      const totalQ         = data.totalQuizzes || 0;
      const totalXP        = data.xp || 0;
      const subjArr        = data.subjects || [];

      const give = (id) => {
        if (!existingIds.has(id)) {
          const b = ALL_BADGES.find(x => x.id === id);
          if (b) { newBadges.push({ ...b, earnedAt: new Date().toISOString() }); existingIds.add(id); }
        }
      };

      if (totalQ === 1)        give('first-quiz');
      if (safeScore === 100)   give('perfect-score');
      if (totalQ >= 10)        give('10-quizzes');
      if (totalQ >= 25)        give('25-quizzes');
      if (totalXP >= 1000)     give('1k-xp');
      if (totalXP >= 5000)     give('5k-xp');
      if (subjArr.length >= 5) give('multi-subject');
      if (new Date().getHours() >= 22) give('night-owl');
      if (new Date().getHours() < 7)   give('early-bird');
      if (isLearningPath && safeScore === 100) give('perfect-path');

      if (newBadges.length > 0) {
        await updateDoc(userRef, { badges: arrayUnion(...newBadges) });
        return { xpEarned, newXp: finalXp, newLevel: finalLevel, newBadges };
      }
    }
  } catch (err) {
    console.error('saveQuizResult STEP 4 (badges) failed (non-critical):', err?.message);
  }

  return { xpEarned, newXp: finalXp, newLevel: finalLevel, newBadges: [] };
}

/**
 * Award a specific badge manually.
 */
export async function awardBadgeToFirestore(uid, badgeId) {
  if (!uid || !badgeId) return;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const existingBadges = snap.data().badges || [];
    if (!existingBadges.find(b => b.id === badgeId)) {
      const newBadge = { id: badgeId, earnedAt: new Date().toISOString() };
      await updateDoc(userRef, { badges: arrayUnion(newBadge) });
      return newBadge;
    }
  } catch (err) {
    console.error('awardBadgeToFirestore error:', err?.message);
  }
}

/**
 * Delete a single quiz result from Firestore.
 */
export async function deleteQuizResultFromFirestore(uid, resultId) {
  if (!uid || !resultId) return;
  try {
    await deleteDoc(doc(db, 'quizResults', uid, 'results', resultId));
  } catch (err) {
    console.error('deleteQuizResult error:', err);
    throw err;
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
      totalQuizzes:    scores.length,
      averageScore:    Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      topicsAttempted: topics.size,
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
    if (userData.lastActiveDate === today) return userData;

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let streak      = userData.streak || 0;
    if (userData.lastActiveDate === yesterday) streak += 1;
    else streak = 1;
    const longestStreak = Math.max(streak, userData.longestStreak || 0);

    const existingBadges = userData.badges || [];
    const existingIds    = new Set(existingBadges.map(b => b.id));
    const newBadges      = [];
    [3, 7, 14, 30].forEach(m => {
      const badgeId = `streak-${m}`;
      if (streak >= m && !existingIds.has(badgeId)) {
        newBadges.push({ id: badgeId, name: `${m}-Day Streak`, icon: '🔥', earnedAt: new Date().toISOString() });
        existingIds.add(badgeId);
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
