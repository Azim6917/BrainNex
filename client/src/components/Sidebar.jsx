import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, FileQuestion,
  Map, Users, Trophy, LogOut, Zap, Flame, Settings, Menu, X, Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import BrainNexLogo from './BrainNexLogo';

const nav = [
  { to: '/app/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/tutor',         icon: MessageSquare,   label: 'AI Tutor', badge: 'LIVE' },
  { to: '/app/quiz',          icon: FileQuestion,    label: 'Quiz' },
  { to: '/app/learning-path', icon: Map,             label: 'Learning Path' },
  { to: '/app/study-rooms',   icon: Users,           label: 'Study Rooms' },
  { to: '/app/goals',         icon: Target,          label: 'Study Goals' },
  { to: '/app/achievements',  icon: Trophy,          label: 'Achievements' },
];

function SidebarContent({ onClose }) {
  const { logout, user } = useAuth();
  const { profile }      = useUserData();
  const navigate         = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const level     = profile?.level || 1;
  const xpInLevel = (profile?.xp || 0) % 500;
  const xpPct     = Math.round((xpInLevel / 500) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Logo + close button */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-brand-border flex-shrink-0">
        <BrainNexLogo size="md" />
        {onClose && (
          <button onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* User card */}
      <div className="px-4 py-3 border-b border-brand-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="avatar"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-brand-border2" />
          ) : (
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-brand-bg"
              style={{ background: 'linear-gradient(135deg, #00e5ff, #a78bfa)' }}>
              {(user?.displayName || 'S')[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.displayName || 'Student'}</p>
            <p className="text-[10px] text-white/40">Level {level}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-neon-amber font-semibold flex-shrink-0">
            <Flame size={12} />{profile?.streak || 0}
          </div>
        </div>
        {/* XP bar */}
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-white/30 mb-1">
            <span>{xpInLevel} XP</span><span>500 XP to next level</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #00e5ff, #a78bfa)' }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1, delay: 0.3 }} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto min-h-0">
        {nav.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} onClick={onClose}>
            {({ isActive }) => (
              <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
                <Icon size={17} />
                <span>{label}</span>
                {badge && (
                  <span className="ml-auto text-[9px] font-bold bg-cyan text-brand-bg px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-brand-border flex-shrink-0 space-y-1">
        <div className="flex items-center justify-between text-xs text-white/30 px-3 py-1">
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-neon-amber" />
            <span>{(profile?.xp || 0).toLocaleString()} XP</span>
          </div>
          <span className="text-white/20">Lv. {level}</span>
        </div>
        <NavLink to="/app/settings" onClick={onClose}>
          {({ isActive }) => (
            <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
              <Settings size={17} /><span>Settings</span>
            </div>
          )}
        </NavLink>
        <button onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
          <LogOut size={16} />Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <>
      {/* ── HAMBURGER (mobile only) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-brand-bg2 border border-brand-border flex items-center justify-center text-white/60 hover:text-white shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* ── DESKTOP SIDEBAR (fixed) ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 bg-brand-bg2 border-r border-brand-border z-50">
        <SidebarContent onClose={null} />
      </aside>

      {/* ── MOBILE OVERLAY ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-brand-bg2 border-r border-brand-border z-50 flex flex-col shadow-2xl"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
