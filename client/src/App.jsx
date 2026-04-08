import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './utils/firebase';
import { AuthProvider } from './context/AuthContext';
import { UserDataProvider } from './context/UserDataContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import OnboardingFlow from './components/OnboardingFlow';

import LandingPage        from './pages/LandingPage';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import DashboardPage      from './pages/DashboardPage';
import ChatTutorPage      from './pages/ChatTutorPage';
import QuizPage           from './pages/QuizPage';
import LearningPathPage   from './pages/LearningPathPage';
import StudyRoomsPage     from './pages/StudyRoomsPage';
import AchievementsPage   from './pages/AchievementsPage';
import SettingsPage       from './pages/SettingsPage';
import StudyGoalsPage     from './pages/StudyGoalsPage';
import StudySessionPage   from './pages/StudySessionPage';

/* Onboarding wrapper — checks Firestore if user has completed onboarding */
function OnboardingGate({ children }) {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checked,         setChecked]         = useState(false);

  useEffect(() => {
    if (!user) { setChecked(true); return; }
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && !snap.data().onboardingDone) {
        setNeedsOnboarding(true);
      }
      setChecked(true);
    }).catch(() => setChecked(true));
  }, [user]);

  if (!checked) return null;
  if (needsOnboarding) return <OnboardingFlow onComplete={() => setNeedsOnboarding(false)} />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-y-auto w-full lg:ml-60">
        {children}
      </main>
    </div>
  );
}

function AppPage({ children }) {
  return (
    <ProtectedRoute>
      <OnboardingGate>
        <AppLayout>{children}</AppLayout>
      </OnboardingGate>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserDataProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background:   '#0d1220',
                color:        '#f0f4ff',
                border:       '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize:     '13px',
                maxWidth:     '360px',
              },
              success: { iconTheme: { primary:'#00e5ff', secondary:'#060912' } },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* App */}
            <Route path="/app"                  element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/app/dashboard"        element={<AppPage><DashboardPage /></AppPage>} />
            <Route path="/app/tutor"            element={<AppPage><ChatTutorPage /></AppPage>} />
            <Route path="/app/quiz"             element={<AppPage><QuizPage /></AppPage>} />
            <Route path="/app/study-sessions"   element={<AppPage><StudySessionPage /></AppPage>} />
            <Route path="/app/learning-path"    element={<AppPage><LearningPathPage /></AppPage>} />
            <Route path="/app/study-rooms"      element={<AppPage><StudyRoomsPage /></AppPage>} />
            <Route path="/app/goals"            element={<AppPage><StudyGoalsPage /></AppPage>} />
            <Route path="/app/achievements"     element={<AppPage><AchievementsPage /></AppPage>} />
            <Route path="/app/settings"         element={<AppPage><SettingsPage /></AppPage>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </UserDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
