import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, FileQuestion,
  Map, Users, Trophy, LogOut, Zap, Flame
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';

const nav = [
  { to: '/app/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/tutor',         icon: MessageSquare,   label: 'AI Tutor' },
  { to: '/app/quiz',          icon: FileQuestion,    label: 'Quiz' },
  { to: '/app/learning-path', icon: Map,             label: 'Learning Path' },
  { to: '/app/study-rooms',   icon: Users,           label: 'Study Rooms' },
  { to: '/app/achievements',  icon: Trophy,          label: 'Achievements' },
];

export default function Sidebar({ collapsed }) {
  const { logout, user } = useAuth();
  const { profile } = useUserData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const level = profile?.level || 1;
  const xpInLevel = (profile?.xp || 0) % 500;
  const xpPct = (xpInLevel / 500) * 100;

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-screen w-60 flex flex-col bg-brand-bg2 border-r border-brand-border z-50"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-brand-border">
        <div className="w-8 h-8 rounded-lg bg-cyan flex items-center justify-center">
          <span className="text-brand-bg font-bold text-sm font-syne">B</span>
        </div>
        <span className="font-syne font-bold text-lg text-white">BrainNex</span>
      </div>

      {/* User mini card */}
      <div className="px-4 py-3 border-b border-brand-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan flex items-center justify-center text-xs font-bold text-brand-bg flex-shrink-0">
            {(user?.displayName || 'S')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.displayName || 'Student'}</p>
            <p className="text-[10px] text-white/40">Level {level}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-neon-amber font-semibold">
            <Flame size={12} />
            {profile?.streak || 0}
          </div>
        </div>
        {/* XP bar */}
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-white/30 mb-1">
            <span>{xpInLevel} XP</span>
            <span>500 XP</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan to-violet-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
                <Icon size={17} />
                <span>{label}</span>
                {label === 'AI Tutor' && (
                  <span className="ml-auto text-[9px] font-bold bg-cyan text-brand-bg px-1.5 py-0.5 rounded-full">LIVE</span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Total XP */}
      <div className="px-4 py-3 border-t border-brand-border">
        <div className="flex items-center justify-between text-xs text-white/40 mb-3">
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-neon-amber" />
            <span>{(profile?.xp || 0).toLocaleString()} Total XP</span>
          </div>
          <span className="text-white/20">Lv. {level}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-150"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </motion.aside>
  );
}
