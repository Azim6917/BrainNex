import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';
import { getSubjectStatsFromFirestore, updateStreakInFirestore } from '../utils/firestoreUtils';

const UserDataContext = createContext(null);
export const useUserData = () => useContext(UserDataContext);

export function UserDataProvider({ children }) {
  const { user }  = useAuth();
  const [profile,         setProfile]         = useState(null);
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [loadingProfile,  setLoadingProfile]  = useState(true);

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
          await setDoc(userRef, {
            uid: user.uid, displayName: user.displayName || 'Student',
            email: user.email, photoURL: user.photoURL || null,
            xp: 0, level: 1, streak: 0, longestStreak: 0,
            lastActiveDate: null, totalQuizzes: 0, totalCorrect: 0,
            totalQuestions: 0, subjects: [], badges: [],
            currentDifficulty: 'intermediate', createdAt: serverTimestamp(),
          });
        } else {
          await updateStreakInFirestore(user.uid);
        }
      } catch (err) { console.error('UserDataContext init:', err.message); }
    };
    init();

    const unsub = onSnapshot(userRef,
      snap => { if (snap.exists()) setProfile({ id: snap.id, ...snap.data() }); setLoadingProfile(false); },
      err  => { console.error('Snapshot error:', err.code); setLoadingProfile(false); }
    );
    return unsub;
  }, [user]);

  const loadSubjectProgress = useCallback(async () => {
    if (!user) return;
    const stats = await getSubjectStatsFromFirestore(user.uid);
    setSubjectProgress(stats);
  }, [user]);

  useEffect(() => { if (user) loadSubjectProgress(); }, [user, loadSubjectProgress]);

  const updateProfileLocal = useCallback((updates) => {
    setProfile(p => p ? { ...p, ...updates } : p);
    if (user?.uid) updateDoc(doc(db, 'users', user.uid), updates).catch(() => {});
  }, [user]);

  const refreshProfile = useCallback(async () => { await loadSubjectProgress(); }, [loadSubjectProgress]);

  return (
    <UserDataContext.Provider value={{ profile, subjectProgress, loadingProfile, refreshProfile, updateProfileLocal }}>
      {children}
    </UserDataContext.Provider>
  );
}
