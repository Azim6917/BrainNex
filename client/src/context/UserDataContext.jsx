import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';
import { playBadge, playLevelUp } from '../utils/soundEffects';

const UserDataContext = createContext(null);
export const useUserData = () => useContext(UserDataContext);

/** Compute level from XP */
function xpToLevel(xp) { return Math.floor((xp || 0) / 500) + 1; }

/** Compute subject stats directly from quizResults subcollection */
async function computeSubjectStats(uid) {
  try {
    const snap = await getDocs(collection(db, 'quizResults', uid, 'results'));
    const map  = {};
    snap.docs.forEach(d => {
      const { subject, score, topic } = d.data();
      if (!subject) return;
      if (!map[subject]) map[subject] = { scores:[], topics:new Set() };
      map[subject].scores.push(score);
      map[subject].topics.add(topic);
    });
    return Object.entries(map).map(([subject, { scores, topics }]) => ({
      subject,
      totalQuizzes:    scores.length,
      averageScore:    Math.round(scores.reduce((a,b)=>a+b,0) / scores.length),
      topicsAttempted: topics.size,
    }));
  } catch (err) {
    console.error('computeSubjectStats:', err.message);
    return [];
  }
}

/** Update streak — runs once per day on login */
async function runDailyStreak(uid) {
  try {
    const ref      = doc(db, 'users', uid);
    const snap     = await getDoc(ref);
    const data     = snap.data() || {};
    const today    = new Date().toDateString();
    if (data.lastActiveDate === today) return data; // already done today

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let streak      = data.streak || 0;
    if (data.lastActiveDate === yesterday) streak += 1;
    else streak = 1;
    const longestStreak = Math.max(streak, data.longestStreak || 0);

    const existingBadges = data.badges || [];
    const existingIds    = new Set(existingBadges.map(b => b.id));
    const newBadges      = [];
    [3,7,14,30,60,100].forEach(m => {
      if (streak >= m && !existingIds.has(`streak-${m}`)) {
        newBadges.push({ id:`streak-${m}`, name:`${m}-Day Streak`, icon:'🔥', category:'Streak', desc:`Study ${m} days in a row`, earnedAt: new Date().toISOString() });
      }
    });

    const updates = { streak, longestStreak, lastActiveDate: today };
    if (newBadges.length > 0) updates.badges = [...existingBadges, ...newBadges];
    await updateDoc(ref, updates);
    return { ...data, ...updates };
  } catch (err) {
    console.error('runDailyStreak:', err.message);
  }
}

export function UserDataProvider({ children }) {
  const { user }  = useAuth();
  const [profile,         setProfile]         = useState(null);
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [loadingProfile,  setLoadingProfile]  = useState(true);
  const prevXpRef    = React.useRef(0);
  const prevLevelRef = React.useRef(1);

  /* ── Init + real-time listener ── */
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setSubjectProgress([]);
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    const userRef = doc(db, 'users', user.uid);

    const init = async () => {
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          // New user — create doc
          await setDoc(userRef, {
            uid:              user.uid,
            displayName:      user.displayName || 'Student',
            email:            user.email,
            photoURL:         user.photoURL || localStorage.getItem(`brainnex-photo-${user.uid}`) || null,
            xp:               0,
            level:            1,
            streak:           0,
            longestStreak:    0,
            lastActiveDate:   null,
            totalQuizzes:     0,
            totalCorrect:     0,
            totalQuestions:   0,
            subjects:         [],
            badges:           [],
            currentDifficulty:'intermediate',
            onboardingDone:   false,
            createdAt:        serverTimestamp(),
          });
        } else {
          // Existing user — update streak
          await runDailyStreak(user.uid);
          // Sync local photo if saved
          const localPhoto = localStorage.getItem(`brainnex-photo-${user.uid}`);
          if (localPhoto && !snap.data().photoURL) {
            await updateDoc(userRef, { photoURL: localPhoto });
          }
        }
      } catch (err) { console.error('UserData init:', err.message); }
    };

    init();

    // Real-time snapshot
    const unsub = onSnapshot(userRef,
      snap => {
        if (snap.exists()) {
          const data = snap.data();
          // Check level up
          const newLevel = xpToLevel(data.xp);
          if (prevLevelRef.current > 1 && newLevel > prevLevelRef.current) {
            playLevelUp();
          }
          prevLevelRef.current = newLevel;
          prevXpRef.current    = data.xp || 0;
          setProfile({ id: snap.id, ...data });
        }
        setLoadingProfile(false);
      },
      err => { console.error('Firestore snapshot:', err.code); setLoadingProfile(false); }
    );

    return unsub;
  }, [user]);

  /* ── Load subject stats ── */
  const loadSubjectProgress = useCallback(async () => {
    if (!user) return;
    const stats = await computeSubjectStats(user.uid);
    setSubjectProgress(stats);
  }, [user]);

  useEffect(() => {
    if (user) loadSubjectProgress();
  }, [user, loadSubjectProgress]);

  /* ── Refresh (re-read stats from Firestore) ── */
  const refreshProfile = useCallback(async () => {
    await loadSubjectProgress();
    // Profile itself updates via onSnapshot
  }, [loadSubjectProgress]);

  /* ── Optimistic update + Firestore write ── */
  const updateProfileLocal = useCallback((updates) => {
    setProfile(p => p ? { ...p, ...updates } : p);
    if (user?.uid) {
      updateDoc(doc(db, 'users', user.uid), updates).catch(err => console.error('updateProfileLocal:', err.message));
    }
  }, [user]);

  return (
    <UserDataContext.Provider value={{ profile, subjectProgress, loadingProfile, refreshProfile, updateProfileLocal }}>
      {children}
    </UserDataContext.Provider>
  );
}
