/**
 * firestoreUtils.js
 * All Firestore writes happen here — no backend server needed for stats.
 * XP, streaks, badges, quiz history all saved directly to Firestore.
 */
import {
  doc, collection, addDoc, updateDoc, getDoc, getDocs, deleteDoc,
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
export async function saveQuizResultToFirestore(uid, { subject, topic, score, totalQuestions, correctAnswers, difficulty, questions }) {
  if (!uid) return null;

  const xpEarned = correctAnswers * 10 + (score === 100 ? 50 : score >= 80 ? 25 : 10);
  const userRef  = doc(db, 'users', uid);

  try {
    // 1. Save quiz result to subcollection (with full question detail when available)
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

    // NEW BADGES LOGIC
    const hour = new Date().getHours();
    if (hour >= 22) addBadge('night-owl');
    if (hour < 7)   addBadge('early-bird');
    
    // Check if it's a learning path quiz and perfect score
    // we assume we pass isLearningPath from the calling page
    if (arguments[1].isLearningPath && score === 100) addBadge('perfect-path');

    // subject-master: Score above 90% average in any one subject across 5 quizzes
    // To do this simply, we'll check if the current subject has reached 5 quizzes
    // and if the average is > 90%. We can fetch current subject stats or just do a query.
    // For performance, we'll quickly query the last 5 for this subject.
    const subjQ = query(collection(db, 'quizResults', uid, 'results'), where('subject', '==', subject), orderBy('timestamp', 'desc'), limit(5));
    const subjSnap = await getDocs(subjQ);
    if (subjSnap.size >= 4) { // 4 previous + 1 current = 5
      let totalS = score;
      subjSnap.docs.forEach(d => totalS += d.data().score);
      if (totalS / (subjSnap.size + 1) > 90) addBadge('subject-master');
    }

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
      // Find badge info
      // Actually we don't need all the static info, just the id and earnedAt is fine, 
      // but to match existing schema we'll just store id and earnedAt. The UI merges it.
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
    
    // Check if they have 10 and award quiz-history-10
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
      const badgeId = m === 7 ? '7-day-streak' : `streak-${m}`;
      if (streak >= m && !existingIds.has(badgeId)) {
        newBadges.push({ id: badgeId, name: m === 7 ? 'Week Warrior' : `${m}-Day Streak`, icon: '🔥', earnedAt: new Date().toISOString() });
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
