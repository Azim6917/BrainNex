import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, FileQuestion, Map,
  Users, Trophy, LogOut, Zap, Flame, Settings, Menu, X,
  Target, BookMarked, Moon, Sun, ChevronLeft, Smile
} from 'lucide-react';
import { useAuth }     from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { useTheme }    from '../context/ThemeContext';
import BrainNexLogo    from './BrainNexLogo';
import { playClick }   from '../utils/soundEffects';

const NAV = [
  { to:'/app/dashboard',      icon:LayoutDashboard, label:'Dashboard'      },
  { to:'/app/tutor',          icon:MessageSquare,   label:'AI Tutor',       badge:'LIVE' },
  { to:'/app/study-sessions', icon:BookMarked,      label:'Study Sessions' },
  { to:'/app/quiz',           icon:FileQuestion,    label:'Quiz'           },
  { to:'/app/learning-path',  icon:Map,             label:'Learning Path'  },
  { to:'/app/study-rooms',    icon:Users,           label:'Study Rooms'    },
  { to:'/app/goals',          icon:Target,          label:'Study Goals'    },
  { to:'/app/achievements',   icon:Trophy,          label:'Achievements'   },
];

function XPBar({ xp, level }) {
  const xpInLevel = xp % 500;
  const pct       = Math.round((xpInLevel / 500) * 100);
  return (
    <div className="mt-2">
      <div className="flex justify-between mb-1" style={{ fontSize: 10, color:'var(--txt3)' }}>
        <span>{xpInLevel} XP</span>
        <span>Lv.{level + 1} → {level * 500}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'var(--border2)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background:'linear-gradient(90deg,var(--cyan),var(--violet))' }}
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

  const handleLogout = async () => { playClick(); await logout(); navigate('/'); };

  const photoSrc = profile?.photoURL || localStorage.getItem(`brainnex-photo-${user?.uid}`);
  const initials = (user?.displayName || 'S')[0].toUpperCase();
  const level    = profile?.level || 1;
  const xp       = profile?.xp    || 0;

  return (
    <div className="flex flex-col h-full" style={{ background:'var(--bg2)' }}>

      {/* ── Logo row ── */}
      <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor:'var(--border)' }}>
        <BrainNexLogo size="md" />
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button onClick={() => { playClick(); toggleTheme(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background:'var(--card)', color:'var(--txt2)' }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {/* Mobile close */}
          {onClose && (
            <button onClick={onClose}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background:'var(--card)', color:'var(--txt2)' }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── User card ── */}
      <div className="px-4 py-3 border-b" style={{ borderColor:'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          {photoSrc ? (
            <img src={photoSrc} alt="avatar"
              className="w-9 h-9 rounded-full object-cover flex-shrink-0 border"
              style={{ borderColor:'var(--border2)' }}
              onError={e => { e.target.style.display='none'; }} />
          ) : (
            <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
              style={{ background:'linear-gradient(135deg,var(--cyan),var(--violet))' }}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color:'var(--txt)' }}>
              {user?.displayName || 'Student'}
              {kidMode && <span className="ml-1 text-[10px]">🌟</span>}
            </p>
            <p className="text-xs" style={{ color:'var(--txt3)' }}>
              {profile?.grade ? `${profile.grade}` : `Level ${level}`}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold flex-shrink-0" style={{ color:'var(--amber)' }}>
            <Flame size={12} />{profile?.streak || 0}
          </div>
        </div>
        <XPBar xp={xp} level={level} />
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto min-h-0">
        {NAV.map(({ to, icon:Icon, label, badge }) => (
          <NavLink key={to} to={to} onClick={() => { playClick(); onClose?.(); }}>
            {({ isActive }) => (
              <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
                <Icon size={17} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
                {badge && (
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background:'var(--cyan)', color:'#fff' }}>
                    {badge}
                  </span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-3 py-3 space-y-1 border-t" style={{ borderColor:'var(--border)' }}>
        <div className="flex items-center justify-between px-3 py-1 text-xs" style={{ color:'var(--txt3)' }}>
          <div className="flex items-center gap-1.5">
            <Zap size={11} style={{ color:'var(--amber)' }} />
            <span>{xp.toLocaleString()} XP</span>
          </div>
          <span>Lv.{level}</span>
        </div>
        <NavLink to="/app/settings" onClick={() => { playClick(); onClose?.(); }}>
          {({ isActive }) => (
            <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
              <Settings size={17} /><span>Settings</span>
            </div>
          )}
        </NavLink>
        <button onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm transition-all"
          style={{ color:'var(--txt3)' }}
          onMouseEnter={e => e.currentTarget.style.color='var(--txt)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--txt3)'}>
          <LogOut size={16} /> Sign Out
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
      {/* Hamburger — always visible (desktop: top-left when collapsed; mobile: always) */}
      <AnimatePresence>
        {!desktopOpen && (
          <motion.button
            key="desk-ham"
            initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.8 }}
            onClick={() => { playClick(); setDesktopOpen(true); }}
            className="hidden lg:flex fixed top-3 left-3 z-50 w-10 h-10 rounded-xl items-center justify-center shadow-lg border"
            style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--txt2)' }}>
            <Menu size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile hamburger */}
      {!mobileOpen && (
        <button onClick={() => { playClick(); setMobileOpen(true); }}
          className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border"
          style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--txt2)' }}>
          <Menu size={18} />
        </button>
      )}

      {/* ── Desktop sidebar ── */}
      <AnimatePresence>
        {desktopOpen && (
          <motion.aside
            key="desktop-sidebar"
            initial={{ x:-240 }} animate={{ x:0 }} exit={{ x:-240 }}
            transition={{ type:'spring', damping:28, stiffness:260 }}
            className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 z-50 border-r"
            style={{ borderColor:'var(--border)' }}>
            {/* Collapse button */}
            <button onClick={() => { playClick(); setDesktopOpen(false); }}
              className="absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center border shadow-sm z-10"
              style={{ background:'var(--bg2)', borderColor:'var(--border)', color:'var(--txt3)' }}>
              <ChevronLeft size={13} />
            </button>
            <SidebarInner onClose={null} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="overlay"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="lg:hidden fixed inset-0 z-40"
              style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}
              onClick={() => setMobileOpen(false)} />
            <motion.div key="drawer"
              initial={{ x:'-100%' }} animate={{ x:0 }} exit={{ x:'-100%' }}
              transition={{ type:'spring', damping:28, stiffness:280 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-72 z-50 flex flex-col shadow-2xl border-r"
              style={{ borderColor:'var(--border)' }}>
              <SidebarInner onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
