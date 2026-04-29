import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Settings, Menu, X, Moon, Sun, ChevronLeft,
  LayoutDashboard, Bot, BookOpen, FileQuestion, Map,
  Users, Target, Trophy
} from 'lucide-react';
import { useAuth }     from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { useTheme }    from '../context/ThemeContext';
import BrainNexLogo    from './BrainNexLogo';
import { audioSystem } from '../utils/audio';

const NAV = [
  { to:'/app/dashboard',      icon: LayoutDashboard, label:'Dashboard'      },
  { to:'/app/tutor',          icon: Bot,             label:'AI Tutor',       badge:'LIVE' },
  { to:'/app/study-sessions', icon: BookOpen,        label:'Study Sessions' },
  { to:'/app/quiz',           icon: FileQuestion,    label:'Quiz'           },
  { to:'/app/learning-path',  icon: Map,             label:'Learning Path'  },
  { to:'/app/study-rooms',    icon: Users,           label:'Study Rooms'    },
  { to:'/app/goals',          icon: Target,          label:'Study Goals'    },
  { to:'/app/achievements',   icon: Trophy,          label:'Achievements'   },
];

function XPBar({ xp, level }) {
  const xpInLevel = xp % 500;
  const pct       = Math.round((xpInLevel / 500) * 100);
  return (
    <div className="mt-3">
      <div className="flex justify-between mb-1.5 text-xs font-medium" style={{ color:'var(--txt3)' }}>
        <span>{xpInLevel} XP</span>
        <span>Lv.{level + 1}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background:'var(--border2)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background:'linear-gradient(90deg, #7C3AED, #0EA5E9)' }}
          initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1, delay:0.4 }} />
      </div>
    </div>
  );
}

function SidebarInner({ onClose }) {
  const { logout, user } = useAuth();
  const { profile }      = useUserData();
  const { theme, toggleTheme, kidMode } = useTheme();
  const navigate         = useNavigate();

  const handleLogout = async () => { audioSystem.playClick(); await logout(); navigate('/'); };

  const photoSrc = profile?.photoURL || localStorage.getItem(`brainnex-photo-${user?.uid}`);
  const initials = (user?.displayName || 'S')[0].toUpperCase();
  const level    = profile?.level || 1;
  const xp       = profile?.xp    || 0;

  return (
    <div className="flex flex-col h-full" style={{ background:'var(--bg2)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor:'var(--border)' }}>
        <Link
          to="/app/dashboard"
          onClick={() => { audioSystem.playClick(); onClose?.(); }}
          className="hover:opacity-80 transition-opacity"
        >
          <BrainNexLogo size="md" />
        </Link>
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button onClick={() => { audioSystem.playClick(); toggleTheme(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-opacity-80"
            style={{ background:'var(--card)', color:'var(--txt2)' }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {/* Mobile close */}
          {onClose && (
            <button onClick={onClose}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-opacity-80"
              style={{ background:'var(--card)', color:'var(--txt2)' }}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── User card ── */}
      <div className="px-4 py-4 border-b" style={{ borderColor:'var(--border)' }}>
        <div className="flex items-center gap-3">
          {photoSrc ? (
            <img src={photoSrc} alt="avatar"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2"
              style={{ borderColor:'var(--border2)' }}
              onError={e => { e.target.style.display='none'; }} />
          ) : (
            <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white shadow-sm"
              style={{ background:'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color:'var(--txt)' }}>
              {user?.displayName || 'Student'}
            </p>
            <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background:'rgba(124,58,237,0.15)', color:'var(--primary-light)' }}>
              {profile?.grade ? profile.grade : `Level ${level}`}
            </span>
          </div>
        </div>
        <XPBar xp={xp} level={level} />
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
        {NAV.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} onClick={() => { audioSystem.playClick(); onClose?.(); }}>
            {({ isActive }) => (
              <div className={`sidebar-item ${isActive ? 'active' : ''} ${kidMode ? 'py-3' : 'py-2.5'}`}>
                <span className="flex-shrink-0 flex items-center justify-center w-8">
                  <Icon size={kidMode ? 20 : 18} />
                </span>
                <span className={`truncate ${kidMode ? 'font-bold' : 'font-medium'}`}>{label}</span>
                {badge && (
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 shadow-sm"
                    style={{ background:'linear-gradient(135deg, #7C3AED, #0EA5E9)', color:'#fff' }}>
                    {badge}
                  </span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-3 py-4 space-y-1 border-t" style={{ borderColor:'var(--border)' }}>
        <NavLink to="/app/settings" onClick={() => { audioSystem.playClick(); onClose?.(); }}>
          {({ isActive }) => (
            <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
              <span className="flex-shrink-0 flex items-center justify-center w-8"><Settings size={18} /></span><span>Settings</span>
            </div>
          )}
        </NavLink>
        <button onClick={handleLogout}
          className="sidebar-item w-full text-left">
          <span className="flex-shrink-0 flex items-center justify-center w-8"><LogOut size={18} /></span><span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <>
      <AnimatePresence>
        {!desktopOpen && (
          <motion.button
            key="desk-ham"
            initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.8 }}
            onClick={() => { audioSystem.playClick(); setDesktopOpen(true); }}
            className="hidden lg:flex fixed top-4 left-4 z-50 w-11 h-11 rounded-xl items-center justify-center shadow-lg border transition-transform hover:scale-105"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--txt)' }}>
            <Menu size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {!mobileOpen && (
        <button onClick={() => { audioSystem.playClick(); setMobileOpen(true); }}
          className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg border"
          style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--txt)' }}>
          <Menu size={20} />
        </button>
      )}

      <AnimatePresence>
        {desktopOpen && (
          <motion.aside
            key="desktop-sidebar"
            initial={{ x:-220 }} animate={{ x:0 }} exit={{ x:-220 }}
            transition={{ type:'spring', damping:28, stiffness:260 }}
            className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-[220px] z-50 border-r"
            style={{ borderColor:'var(--border)' }}>
            <button onClick={() => { audioSystem.playClick(); setDesktopOpen(false); }}
              className="absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center border shadow-sm z-10 transition-transform hover:scale-110"
              style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--txt2)' }}>
              <ChevronLeft size={14} />
            </button>
            <SidebarInner onClose={null} />
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="overlay"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="lg:hidden fixed inset-0 z-40"
              style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)' }}
              onClick={() => setMobileOpen(false)} />
            <motion.div key="drawer"
              initial={{ x:'-100%' }} animate={{ x:0 }} exit={{ x:'-100%' }}
              transition={{ type:'spring', damping:28, stiffness:280 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-[260px] z-50 flex flex-col shadow-2xl border-r"
              style={{ borderColor:'var(--border)' }}>
              <SidebarInner onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
