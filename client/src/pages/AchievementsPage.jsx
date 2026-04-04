import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Zap, Flame } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';

const ALL_BADGES = [
  { id: 'first-quiz',    name: 'First Quiz!',      icon: '📝', desc: 'Complete your first quiz',          category: 'Milestone' },
  { id: 'perfect-score', name: 'Perfect Score!',   icon: '💯', desc: 'Score 100% on any quiz',            category: 'Achievement' },
  { id: '10-quizzes',    name: 'Quiz Veteran',      icon: '🏆', desc: 'Complete 10 quizzes',               category: 'Milestone' },
  { id: '1k-xp',         name: '1000 XP Club',      icon: '⚡', desc: 'Earn 1,000 XP total',              category: 'XP' },
  { id: '5k-xp',         name: 'XP Champion',       icon: '🌟', desc: 'Earn 5,000 XP total',              category: 'XP' },
  { id: 'streak-3',      name: '3-Day Streak',      icon: '🔥', desc: 'Study 3 days in a row',            category: 'Streak' },
  { id: 'streak-7',      name: 'Week Warrior',      icon: '🔥', desc: 'Study 7 days in a row',            category: 'Streak' },
  { id: 'streak-14',     name: 'Fortnight Fire',    icon: '🔥', desc: 'Study 14 days in a row',           category: 'Streak' },
  { id: 'streak-30',     name: 'Month Master',      icon: '🔥', desc: 'Study 30 days in a row',           category: 'Streak' },
  { id: 'streak-60',     name: 'Dedication God',    icon: '👑', desc: 'Study 60 days in a row',           category: 'Streak' },
  { id: 'streak-100',    name: 'Centurion',         icon: '💎', desc: 'Study 100 days in a row',          category: 'Streak' },
  { id: 'multi-subject', name: 'Polymath',          icon: '🧠', desc: 'Study 5 different subjects',       category: 'Achievement' },
  { id: 'night-owl',     name: 'Night Owl',         icon: '🦉', desc: 'Study after midnight',             category: 'Special' },
  { id: 'speed-demon',   name: 'Speed Demon',       icon: '⚡', desc: 'Finish a quiz in under 2 minutes', category: 'Special' },
  { id: 'study-room',    name: 'Team Player',       icon: '👥', desc: 'Join your first study room',       category: 'Social' },
];

const CATEGORY_COLORS = {
  Milestone:   { bg: 'bg-cyan/10',          border: 'border-cyan/30',          text: 'text-cyan' },
  Achievement: { bg: 'bg-neon-amber/10',    border: 'border-neon-amber/30',    text: 'text-neon-amber' },
  Streak:      { bg: 'bg-orange-500/10',    border: 'border-orange-500/30',    text: 'text-orange-400' },
  XP:          { bg: 'bg-violet-500/10',    border: 'border-violet-500/30',    text: 'text-violet-400' },
  Special:     { bg: 'bg-neon-green/10',    border: 'border-neon-green/30',    text: 'text-neon-green' },
  Social:      { bg: 'bg-pink-500/10',      border: 'border-pink-500/30',      text: 'text-pink-400' },
};

const LEVELS = [
  { level: 1, name: 'Beginner',     minXP: 0,    maxXP: 500,  color: '#34d399' },
  { level: 2, name: 'Explorer',     minXP: 500,  maxXP: 1000, color: '#00e5ff' },
  { level: 3, name: 'Learner',      minXP: 1000, maxXP: 2000, color: '#a78bfa' },
  { level: 4, name: 'Scholar',      minXP: 2000, maxXP: 3500, color: '#ffb830' },
  { level: 5, name: 'Academic',     minXP: 3500, maxXP: 5000, color: '#f87171' },
  { level: 6, name: 'Prodigy',      minXP: 5000, maxXP: 8000, color: '#fbbf24' },
  { level: 7, name: 'Genius',       minXP: 8000, maxXP: 12000,color: '#ec4899' },
  { level: 8, name: 'Master',       minXP: 12000,maxXP: 20000,color: '#8b5cf6' },
  { level: 9, name: 'Grandmaster',  minXP: 20000,maxXP: 50000,color: '#06b6d4' },
  { level: 10,name: 'Legend',       minXP: 50000,maxXP: null, color: '#f59e0b' },
];

export default function AchievementsPage() {
  const { profile } = useUserData();
  const earnedIds  = new Set((profile?.badges || []).map(b => b.id));
  const earnedBadges = (profile?.badges || []);

  const totalXP    = profile?.xp || 0;
  const level      = profile?.level || 1;
  const levelInfo  = LEVELS.find(l => l.level === Math.min(level, 10)) || LEVELS[0];
  const xpInLevel  = totalXP - (levelInfo.minXP);
  const xpNeeded   = levelInfo.maxXP ? levelInfo.maxXP - levelInfo.minXP : 50000;
  const xpPct      = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-syne font-black text-3xl mb-1">Achievements</h1>
        <p className="text-white/40 text-sm">Your badges, level progress, and gamification stats</p>
      </div>

      {/* Level card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass border border-brand-border rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black font-syne border-2 relative"
              style={{ borderColor: levelInfo.color, background: `${levelInfo.color}15`, color: levelInfo.color }}>
              {level}
              <div className="absolute -top-2 -right-2 text-xs bg-brand-bg2 border border-brand-border px-1.5 py-0.5 rounded-full font-semibold" style={{ color: levelInfo.color }}>
                Lv.{level}
              </div>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-0.5">Current Level</p>
              <p className="font-syne font-black text-2xl" style={{ color: levelInfo.color }}>{levelInfo.name}</p>
              <p className="text-xs text-white/40 mt-0.5">{totalXP.toLocaleString()} total XP</p>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>{xpInLevel} / {xpNeeded} XP to Level {Math.min(level + 1, 10)}</span>
              <span>{xpPct}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${levelInfo.color}, ${levelInfo.color}88)` }}
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1.2, delay: 0.3 }} />
            </div>
            <div className="flex justify-between text-[10px] text-white/20 mt-1">
              {LEVELS.slice(0, 6).map(l => (
                <span key={l.level} className={l.level === level ? 'text-white/60 font-bold' : ''}>{l.name}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '🏆', label: 'Badges Earned',   val: earnedBadges.length,       total: ALL_BADGES.length },
          { icon: '🔥', label: 'Current Streak',  val: `${profile?.streak || 0}d`, total: null },
          { icon: '⚡', label: 'Total XP',         val: totalXP.toLocaleString(), total: null },
          { icon: '📝', label: 'Total Quizzes',   val: profile?.totalQuizzes || 0, total: null },
        ].map(({ icon, label, val, total }) => (
          <motion.div key={label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass border border-brand-border rounded-2xl p-4 text-center">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="font-syne font-black text-xl text-cyan">{val}{total ? `/${total}` : ''}</div>
            <div className="text-xs text-white/30 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Badges grid */}
      <div>
        <h2 className="font-syne font-bold text-lg mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-neon-amber" /> All Badges
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {ALL_BADGES.map((badge, i) => {
            const earned  = earnedIds.has(badge.id);
            const earnedBadge = (profile?.badges || []).find(b => b.id === badge.id);
            const colors  = CATEGORY_COLORS[badge.category] || CATEGORY_COLORS.Achievement;
            return (
              <motion.div key={badge.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                className={`relative rounded-2xl p-4 border text-center transition-all ${earned ? `${colors.bg} ${colors.border}` : 'bg-white/[0.02] border-brand-border'} ${!earned ? 'opacity-50' : ''}`}>
                {!earned && <Lock size={12} className="absolute top-2.5 right-2.5 text-white/20" />}
                <div className={`text-3xl mb-2 ${!earned ? 'grayscale' : ''}`}>{badge.icon}</div>
                <p className={`font-syne font-bold text-xs mb-1 ${earned ? colors.text : 'text-white/30'}`}>{badge.name}</p>
                <p className="text-[10px] text-white/30 leading-snug">{badge.desc}</p>
                {earned && earnedBadge?.earnedAt && (
                  <p className="text-[9px] text-white/20 mt-2">
                    {new Date(earnedBadge.earnedAt).toLocaleDateString()}
                  </p>
                )}
                <div className={`mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${earned ? colors.bg : 'bg-white/[0.04]'} ${earned ? colors.text : 'text-white/20'}`}>
                  {badge.category}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Upcoming levels */}
      <div className="mt-10">
        <h2 className="font-syne font-bold text-lg mb-4 flex items-center gap-2">
          <Zap size={18} className="text-cyan" /> Level Roadmap
        </h2>
        <div className="space-y-3">
          {LEVELS.map((l) => {
            const isCurrentLevel = l.level === level;
            const isPast         = l.level < level;
            return (
              <motion.div key={l.level} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: l.level * 0.05 }}
                className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${isCurrentLevel ? 'border-opacity-50 bg-opacity-10' : isPast ? 'opacity-60' : 'opacity-30'}`}
                style={{ borderColor: isCurrentLevel ? l.color : 'rgba(255,255,255,0.08)', background: isCurrentLevel ? `${l.color}10` : 'transparent' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-syne font-black text-sm border"
                  style={{ borderColor: l.color, color: l.color, background: `${l.color}15` }}>
                  {l.level}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: isCurrentLevel ? l.color : undefined }}>{l.name}</p>
                  <p className="text-xs text-white/30">{l.minXP.toLocaleString()}{l.maxXP ? ` – ${l.maxXP.toLocaleString()}` : '+'} XP</p>
                </div>
                {isPast && <span className="text-xs text-neon-green font-semibold">✓ Reached</span>}
                {isCurrentLevel && <span className="text-xs font-semibold animate-pulse" style={{ color: l.color }}>← You are here</span>}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
