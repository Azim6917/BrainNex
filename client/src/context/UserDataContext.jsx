import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchProfile, updateStreak, fetchSubjectProgress } from '../utils/api';

const UserDataContext = createContext(null);
export const useUserData = () => useContext(UserDataContext);

export function UserDataProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile]               = useState(null);
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const [profileRes, progressRes] = await Promise.all([
        fetchProfile(),
        fetchSubjectProgress(),
      ]);
      setProfile(profileRes.data);
      setSubjectProgress(progressRes.data);

      // Update streak on load
      const streakRes = await updateStreak();
      if (streakRes.data.newBadges?.length > 0) {
        setProfile(p => ({ ...p, badges: [...(p?.badges || []), ...streakRes.data.newBadges] }));
      }
      setProfile(p => ({ ...p, streak: streakRes.data.streak, longestStreak: streakRes.data.longestStreak }));
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadProfile();
    else { setProfile(null); setSubjectProgress([]); }
  }, [user, loadProfile]);

  const refreshProfile = () => loadProfile();

  const updateProfileLocal = (updates) => {
    setProfile(p => ({ ...p, ...updates }));
  };

  return (
    <UserDataContext.Provider value={{ profile, subjectProgress, loadingProfile, refreshProfile, updateProfileLocal }}>
      {children}
    </UserDataContext.Provider>
  );
}
