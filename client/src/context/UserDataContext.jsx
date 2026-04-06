// import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
// import { useAuth } from './AuthContext';
// import { fetchProfile, updateStreak, fetchSubjectProgress } from '../utils/api';

// const UserDataContext = createContext(null);
// export const useUserData = () => useContext(UserDataContext);

// export function UserDataProvider({ children }) {
//   const { user } = useAuth();
//   const [profile, setProfile]               = useState(null);
//   const [subjectProgress, setSubjectProgress] = useState([]);
//   const [loadingProfile, setLoadingProfile] = useState(false);

//   const loadProfile = useCallback(async () => {
//     if (!user) return;
//     setLoadingProfile(true);
//     try {
//       const [profileRes, progressRes] = await Promise.all([
//         fetchProfile(),
//         fetchSubjectProgress(),
//       ]);
//       setProfile(profileRes.data);
//       setSubjectProgress(progressRes.data);

//       // Update streak on load
//       const streakRes = await updateStreak();
//       if (streakRes.data.newBadges?.length > 0) {
//         setProfile(p => ({ ...p, badges: [...(p?.badges || []), ...streakRes.data.newBadges] }));
//       }
//       setProfile(p => ({ ...p, streak: streakRes.data.streak, longestStreak: streakRes.data.longestStreak }));
//     } catch (err) {
//       console.error('Profile load error:', err);
//     } finally {
//       setLoadingProfile(false);
//     }
//   }, [user]);

//   useEffect(() => {
//     if (user) loadProfile();
//     else { setProfile(null); setSubjectProgress([]); }
//   }, [user, loadProfile]);

//   const refreshProfile = () => loadProfile();

//   const updateProfileLocal = (updates) => {
//     setProfile(p => ({ ...p, ...updates }));
//   };

//   return (
//     <UserDataContext.Provider value={{ profile, subjectProgress, loadingProfile, refreshProfile, updateProfileLocal }}>
//       {children}
//     </UserDataContext.Provider>
//   );
// }

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';
import { fetchSubjectProgress } from '../utils/api';

const UserDataContext = createContext(null);
export const useUserData = () => useContext(UserDataContext);

export function UserDataProvider({ children }) {
  const { user } = useAuth();
  const [profile,          setProfile]          = useState(null);
  const [subjectProgress,  setSubjectProgress]  = useState([]);
  const [loadingProfile,   setLoadingProfile]   = useState(false);

  /* ── Listen to Firestore user doc in real time ── */
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setSubjectProgress([]);
      return;
    }

    setLoadingProfile(true);
    const userRef = doc(db, 'users', user.uid);

    /* Ensure the user doc exists */
    const ensureDoc = async () => {
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid:              user.uid,
            displayName:      user.displayName || 'Student',
            email:            user.email,
            photoURL:         user.photoURL || null,
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
            createdAt:        serverTimestamp(),
          });
        } else {
          /* Update streak on login */
          updateStreak(snap.data(), userRef);
        }
      } catch (err) {
        console.error('Firestore ensure doc error:', err);
      }
    };

    ensureDoc();

    /* Real-time listener */
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() });
      }
      setLoadingProfile(false);
    }, (err) => {
      console.error('Firestore listener error:', err);
      setLoadingProfile(false);
    });

    return unsub;
  }, [user]);

  /* Load subject progress (needs backend) */
  const loadSubjectProgress = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchSubjectProgress();
      setSubjectProgress(res.data);
    } catch {
      /* Backend not running — silent fail */
    }
  }, [user]);

  useEffect(() => {
    if (user) loadSubjectProgress();
  }, [user, loadSubjectProgress]);

  /* ── Streak update (runs client-side against Firestore) ── */
  const updateStreak = async (userData, userRef) => {
    try {
      const today     = new Date().toDateString();
      const lastActive = userData?.lastActiveDate;
      const yesterday  = new Date(Date.now() - 86400000).toDateString();

      if (lastActive === today) return; // already updated today

      let streak = userData?.streak || 0;
      if (lastActive === yesterday)    streak += 1;
      else if (lastActive !== today)   streak = 1;

      const longestStreak = Math.max(streak, userData?.longestStreak || 0);
      const updates = { streak, longestStreak, lastActiveDate: today };

      /* Award streak badges */
      const existingBadges = userData?.badges || [];
      const newBadges = [];
      [3, 7, 14, 30, 60, 100].forEach(m => {
        if (streak >= m && !existingBadges.find(b => b.id === `streak-${m}`)) {
          newBadges.push({ id: `streak-${m}`, name: `${m}-Day Streak`, icon: '🔥', earnedAt: new Date().toISOString() });
        }
      });
      if (newBadges.length > 0) updates.badges = [...existingBadges, ...newBadges];

      await updateDoc(userRef, updates);
    } catch (err) {
      console.error('Streak update error:', err);
    }
  };

  /* ── Manual refresh (calls backend for subject progress) ── */
  const refreshProfile = useCallback(() => {
    loadSubjectProgress();
    /* Profile itself is already real-time via onSnapshot */
  }, [loadSubjectProgress]);

  /* ── Optimistic local update (for XP after quiz) ── */
  const updateProfileLocal = useCallback((updates) => {
    setProfile(p => p ? { ...p, ...updates } : p);
    /* Also write to Firestore so it persists */
    if (user?.uid) {
      updateDoc(doc(db, 'users', user.uid), updates).catch(() => {});
    }
  }, [user]);

  return (
    <UserDataContext.Provider value={{
      profile,
      subjectProgress,
      loadingProfile,
      refreshProfile,
      updateProfileLocal,
    }}>
      {children}
    </UserDataContext.Provider>
  );
}
