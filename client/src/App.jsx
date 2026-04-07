import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { UserDataProvider } from './context/UserDataContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import DashboardPage    from './pages/DashboardPage';
import ChatTutorPage    from './pages/ChatTutorPage';
import QuizPage         from './pages/QuizPage';
import LearningPathPage from './pages/LearningPathPage';
import StudyRoomsPage   from './pages/StudyRoomsPage';
import AchievementsPage from './pages/AchievementsPage';
import SettingsPage     from './pages/SettingsPage';
import StudyGoalsPage   from './pages/StudyGoalsPage';

/**
 * App layout — sidebar is fixed on desktop, hamburger on mobile.
 * Main content area shifts right on desktop (ml-60), full width on mobile.
 */
function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar />
      {/* On mobile: no left margin (sidebar is overlay). On desktop: ml-60 */}
      <main className="flex-1 min-h-screen overflow-y-auto w-full lg:ml-60">
        {children}
      </main>
    </div>
  );
}

function AppPage({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
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
            <Route path="/app"                element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/app/dashboard"      element={<AppPage><DashboardPage /></AppPage>} />
            <Route path="/app/tutor"          element={<AppPage><ChatTutorPage /></AppPage>} />
            <Route path="/app/quiz"           element={<AppPage><QuizPage /></AppPage>} />
            <Route path="/app/learning-path"  element={<AppPage><LearningPathPage /></AppPage>} />
            <Route path="/app/study-rooms"    element={<AppPage><StudyRoomsPage /></AppPage>} />
            <Route path="/app/goals"          element={<AppPage><StudyGoalsPage /></AppPage>} />
            <Route path="/app/achievements"   element={<AppPage><AchievementsPage /></AppPage>} />
            <Route path="/app/settings"       element={<AppPage><SettingsPage /></AppPage>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </UserDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
