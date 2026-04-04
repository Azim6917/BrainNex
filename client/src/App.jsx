import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { UserDataProvider } from './context/UserDataContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Pages
import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import DashboardPage    from './pages/DashboardPage';
import ChatTutorPage    from './pages/ChatTutorPage';
import QuizPage         from './pages/QuizPage';
import LearningPathPage from './pages/LearningPathPage';
import StudyRoomsPage   from './pages/StudyRoomsPage';
import AchievementsPage from './pages/AchievementsPage';

// App layout with sidebar
function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar />
      <main className="ml-60 flex-1 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
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
                background: '#0d1220',
                color: '#f0f4ff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected App */}
            <Route path="/app" element={<ProtectedRoute><AppLayout><Navigate to="/app/dashboard" replace /></AppLayout></ProtectedRoute>} />

            <Route path="/app/dashboard" element={
              <ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/app/tutor" element={
              <ProtectedRoute><AppLayout><ChatTutorPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/app/quiz" element={
              <ProtectedRoute><AppLayout><QuizPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/app/learning-path" element={
              <ProtectedRoute><AppLayout><LearningPathPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/app/study-rooms" element={
              <ProtectedRoute><AppLayout><StudyRoomsPage /></AppLayout></ProtectedRoute>
            } />
            <Route path="/app/achievements" element={
              <ProtectedRoute><AppLayout><AchievementsPage /></AppLayout></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </UserDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
