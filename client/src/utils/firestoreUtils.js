/**
 * firestoreUtils.js
 * All Firestore writes happen here — no backend server needed for stats.
 * XP, streaks, badges, quiz history all saved directly to Firestore.
 */
import {
  doc, collection, addDoc, updateDoc, getDoc, getDocs, deleteDoc,
  arrayUnion, serverTimestamp, query, orderBy, limit,
  runTransaction,
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

export const LEVEL_THRESHOLDS = [0, 500, 1000, 2000, 3500, 5000, 8000, 12000, 20000, 50000];

export function xpForLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Save a quiz result directly to Firestore and update user profile.
 * Returns { xpEarned, newXp, newLevel, newBadges }
 */
export async function saveQuizResultToFirestore(uid, { subject, topic, score, totalQuestions, correctAnswers, difficulty, questions, isLearningPath, customXpReward }) {
  if (!uid) return null;

  const xpEarned = customXpReward || (correctAnswers * 10 + (score === 100 ? 50 : score >= 80 ? 25 : 10));
  const userRef  = doc(db, 'users', uid);

  try {
    await addDoc(collection(db, 'quizResults', uid, 'results'), {
      subject,
      topic,
      score,
      totalQuestions,
      correctAnswers,
      difficulty,
      xpEarned,
      timestamp: serverTimestamp(),
      ...(questions ? { questions } : {}),
    });

    const preSnap    = await getDoc(userRef);
    const preData    = preSnap.data() || {};
    const preQuizzes = (preData.totalQuizzes  || 0) + 1;
    const preCorrect = (preData.totalCorrect  || 0) + correctAnswers;
    const preQns     = (preData.totalQuestions|| 0) + totalQuestions;
    const preXp      = (preData.xp            || 0) + xpEarned;

    const existingBadges = preData.badges || [];
    const existingIds    = new Set(existingBadges.map(b => b.id));
    const preSubjects    = preData.subjects || [];
    const newSubjects    = preSubjects.includes(subject) ? preSubjects : [...preSubjects, subject];

    const newBadges = [];
    const addBadge = (id) => {
      if (!existingIds.has(id)) {
        const b = ALL_BADGES.find(x => x.id === id);
        if (b) { newBadges.push({ ...b, earnedAt: new Date().toISOString() }); existingIds.add(id); }
      }
    };

    if (preQuizzes === 1)  addBadge('first-quiz');
    if (score === 100)     addBadge('perfect-score');
    if (preQuizzes >= 10)  addBadge('10-quizzes');
    if (preQuizzes >= 25)  addBadge('25-quizzes');
    if (preXp >= 1000)     addBadge('1k-xp');
    if (preXp >= 5000)     addBadge('5k-xp');
    if (newSubjects.length >= 5) addBadge('multi-subject');

    const avgScore = preQns > 0 ? Math.round((preCorrect / preQns) * 100) : 0;
    if (avgScore >= 80 && preQuizzes >= 5) addBadge('high-scorer');

    const hour = new Date().getHours();
    if (hour >= 22) addBadge('night-owl');
    if (hour < 7)   addBadge('early-bird');
    if (isLearningPath && score === 100) addBadge('perfect-path');

    const subjQ    = query(collection(db, 'quizResults', uid, 'results'), orderBy('timestamp', 'desc'), limit(20));
    const subjSnap = await getDocs(subjQ);
    const subjectDocs = subjSnap.docs.filter(d => d.data().subject === subject);
    if (subjectDocs.length >= 5) {
      let totalS = 0;
      subjectDocs.slice(0, 5).forEach(d => { totalS += d.data().score; });
      if (totalS / 5 > 90) addBadge('subject-master');
    }

    let finalXp, finalLevel;
    await runTransaction(db, async (transaction) => {
      const txSnap = await transaction.get(userRef);
      if (!txSnap.exists()) return;

      const txData     = txSnap.data();
      finalXp          = (txData.xp            || 0) + xpEarned;
      finalLevel       = xpForLevel(finalXp);
      const txTotalQ   = (txData.totalQuizzes   || 0) + 1;
      const txTotalC   = (txData.totalCorrect   || 0) + correctAnswers;
      const txTotalQns = (txData.totalQuestions || 0) + totalQuestions;
      const txSubs     = txData.subjects || [];
      const txNewSubs  = txSubs.includes(subject) ? txSubs : [...txSubs, subject];

      const txUpdates = {
        xp:                finalXp,
        level:             finalLevel,
        totalQuizzes:      txTotalQ,
        totalCorrect:      txTotalC,
        totalQuestions:    txTotalQns,
        subjects:          txNewSubs,
        currentDifficulty: difficulty,
        lastUpdated:       serverTimestamp(),
      };
      if (newBadges.length > 0) {
        const txBadges      = txData.badges || [];
        const txBadgeIds    = new Set(txBadges.map(b => b.id));
        const dedupedBadges = newBadges.filter(b => !txBadgeIds.has(b.id));
        if (dedupedBadges.length > 0) {
          txUpdates.badges = [...txBadges, ...dedupedBadges];
        }
      }

      transaction.update(userRef, txUpdates);
    });

    return { xpEarned, newXp: finalXp ?? preXp, newLevel: finalLevel ?? xpForLevel(preXp), newBadges };
  } catch (err) {
    console.error('saveQuizResultToFirestore error:', err);
    return { xpEarned, newXp: 0, newLevel: 1, newBadges: [] };
  }
}

/**
 * Utility to award a specific badge manually from anywhere
 */
export async function awardBadgeToFirestore(uid, badgeId) {
  if (!uid || !badgeId) return;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const userData = snap.data();
    const existingBadges = userData.badges || [];
    if (!existingBadges.find(b => b.id === badgeId)) {
      const newBadge = { id: badgeId, earnedAt: new Date().toISOString() };
      await updateDoc(userRef, { badges: arrayUnion(newBadge) });
      return newBadge;
    }
  } catch (err) {
    console.error('awardBadgeToFirestore error:', err);
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
    const docs = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.()?.toISOString() || null,
    }));

    if (docs.length >= 10) {
      await awardBadgeToFirestore(uid, 'quiz-history-10');
    }
    
    return docs;
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
