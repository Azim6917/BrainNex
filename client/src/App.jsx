import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './utils/firebase';
import { AuthProvider }      from './context/AuthContext';
import { UserDataProvider }  from './context/UserDataContext';
import { ThemeProvider }     from './context/ThemeContext';
import { useAuth }           from './context/AuthContext';
import { useTheme }          from './context/ThemeContext';
import ProtectedRoute        from './components/ProtectedRoute';
import Sidebar               from './components/Sidebar';
import OnboardingFlow        from './components/OnboardingFlow';

const MascotOverlay = () => {
  const { kidMode } = useTheme();
  if (!kidMode) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none animate-mascot-float">
      <div className="text-6xl filter drop-shadow-lg">🐙</div>
    </div>
  );
};

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
import AboutPage          from './pages/AboutPage';
import ContactPage        from './pages/ContactPage';

/* Apply theme classes to <html> on mount */
function ThemeApplier() {
  const { theme } = useTheme();
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') { root.classList.add('light'); root.classList.remove('dark'); }
    else                   { root.classList.remove('light'); root.classList.add('dark'); }
  }, [theme]);
  return null;
}

function OnboardingGate({ children }) {
  const { user }  = useAuth();
  const { setKidMode } = useTheme();
  const [needs,   setNeeds]   = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) { setChecked(true); return; }
    getDoc(doc(db,'users',user.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (!d.onboardingDone) setNeeds(true);
        // Re-apply kid mode from Firestore on login
        if (d.isKidMode) setKidMode(true);
      } else {
        setNeeds(true); // new user
      }
      setChecked(true);
    }).catch(() => setChecked(true));
  }, [user, setKidMode]);

  if (!checked) return null;
  if (needs) return <OnboardingFlow onComplete={() => setNeeds(false)} />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen relative" style={{ background:'var(--bg)' }}>
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-y-auto w-full lg:ml-[220px] pt-16 lg:pt-0" id="main-content">
        {children}
      </main>
      <MascotOverlay />
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
      <ThemeProvider>
        <ThemeApplier />
        <AuthProvider>
          <UserDataProvider>
            <Toaster position="top-right" toastOptions={{
              style: {
                background:'var(--bg2)',
                color:'var(--txt)',
                border:'1px solid var(--border2)',
                borderRadius:'12px',
                fontSize:'13px',
                maxWidth:'360px',
              },
              success: { iconTheme:{ primary:'var(--cyan)', secondary:'var(--bg)' } },
            }} />
            <Routes>
              {/* Public */}
              <Route path="/"         element={<LandingPage />} />
              <Route path="/about"    element={<AboutPage />} />
              <Route path="/contact"  element={<ContactPage />} />
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
      </ThemeProvider>
    </BrowserRouter>
  );
}
