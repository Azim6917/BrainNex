import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, Zap, Star } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { triggerConfetti } from '../utils/confetti';
import { playBadge } from '../utils/soundEffects';

export const ALL_BADGES = [
  // Milestone
  { id:'first-quiz',      name:'First Quiz!',        icon:'📝', category:'Milestone',    desc:'Complete your first quiz' },
  { id:'10-quizzes',      name:'Quiz Veteran',        icon:'🏆', category:'Milestone',    desc:'Complete 10 quizzes' },
  { id:'25-quizzes',      name:'Quiz Master',         icon:'🎓', category:'Milestone',    desc:'Complete 25 quizzes' },
  { id:'50-quizzes',      name:'Quiz Legend',         icon:'👑', category:'Milestone',    desc:'Complete 50 quizzes' },
  // Achievement
  { id:'perfect-score',   name:'Perfect Score!',      icon:'💯', category:'Achievement',  desc:'Score 100% on any quiz' },
  { id:'high-scorer',     name:'High Scorer',         icon:'🎯', category:'Achievement',  desc:'80%+ avg accuracy (5+ quizzes)' },
  { id:'multi-subject',   name:'Polymath',            icon:'🧠', category:'Achievement',  desc:'Study 5 different subjects' },
  { id:'speed-run',       name:'Speed Runner',        icon:'⚡', category:'Achievement',  desc:'Complete a quiz in under 90 seconds' },
  { id:'comeback-kid',    name:'Comeback Kid',        icon:'💪', category:'Achievement',  desc:'Score 80%+ after scoring below 50%' },
  // XP
  { id:'1k-xp',           name:'1000 XP Club',        icon:'⚡', category:'XP',           desc:'Earn 1,000 XP total' },
  { id:'5k-xp',           name:'XP Champion',         icon:'🌟', category:'XP',           desc:'Earn 5,000 XP total' },
  { id:'10k-xp',          name:'XP Legend',           icon:'💎', category:'XP',           desc:'Earn 10,000 XP total' },
  // Streak
  { id:'streak-3',        name:'3-Day Streak',        icon:'🔥', category:'Streak',       desc:'Study 3 days in a row' },
  { id:'streak-7',        name:'Week Warrior',        icon:'🔥', category:'Streak',       desc:'Study 7 days in a row' },
  { id:'streak-14',       name:'Fortnight Fire',      icon:'🔥', category:'Streak',       desc:'Study 14 days in a row' },
  { id:'streak-30',       name:'Month Master',        icon:'👑', category:'Streak',       desc:'Study 30 days in a row' },
  { id:'streak-60',       name:'Dedication',          icon:'🏅', category:'Streak',       desc:'Study 60 days in a row' },
  // Social
  { id:'study-room',      name:'Team Player',         icon:'👥', category:'Social',       desc:'Join your first study room' },
  { id:'group-quiz',      name:'Group Champion',      icon:'🎮', category:'Social',       desc:'Complete a group quiz in study room' },
  // Session
  { id:'first-session',   name:'First Lesson',        icon:'📖', category:'Learning',     desc:'Complete your first study session' },
  { id:'5-sessions',      name:'Dedicated Learner',   icon:'📚', category:'Learning',     desc:'Complete 5 study sessions' },
  { id:'session-perfect', name:'Session Star',        icon:'⭐', category:'Learning',     desc:'Score 100% on a session end quiz' },
  // Goals
  { id:'first-goal',      name:'Goal Setter',         icon:'🎯', category:'Goals',        desc:'Create your first study goal' },
  { id:'goal-complete',   name:'Goal Crusher',        icon:'✅', category:'Goals',        desc:'Complete a study goal' },
];

const CAT_COLORS = {
  Milestone:   { bg:'bg-cyan/10',         border:'border-cyan/30',         text:'text-cyan'         },
  Achievement: { bg:'bg-neon-amber/10',   border:'border-neon-amber/30',   text:'text-neon-amber'   },
  Streak:      { bg:'bg-orange-500/10',   border:'border-orange-500/30',   text:'text-orange-400'   },
  XP:          { bg:'bg-violet-500/10',   border:'border-violet-500/30',   text:'text-violet-400'   },
  Social:      { bg:'bg-pink-500/10',     border:'border-pink-500/30',     text:'text-pink-400'     },
  Learning:    { bg:'bg-neon-green/10',   border:'border-neon-green/30',   text:'text-neon-green'   },
  Goals:       { bg:'bg-cyan/10',         border:'border-cyan/30',         text:'text-cyan'         },
};

const LEVELS = [
  { level:1,  name:'Beginner',    minXP:0,     maxXP:500,   color:'#34d399' },
  { level:2,  name:'Explorer',    minXP:500,   maxXP:1000,  color:'#00e5ff' },
  { level:3,  name:'Learner',     minXP:1000,  maxXP:2000,  color:'#a78bfa' },
  { level:4,  name:'Scholar',     minXP:2000,  maxXP:3500,  color:'#ffb830' },
  { level:5,  name:'Academic',    minXP:3500,  maxXP:5000,  color:'#f87171' },
  { level:6,  name:'Prodigy',     minXP:5000,  maxXP:8000,  color:'#fbbf24' },
  { level:7,  name:'Genius',      minXP:8000,  maxXP:12000, color:'#ec4899' },
  { level:8,  name:'Master',      minXP:12000, maxXP:20000, color:'#8b5cf6' },
  { level:9,  name:'Grandmaster', minXP:20000, maxXP:50000, color:'#06b6d4' },
  { level:10, name:'Legend',      minXP:50000, maxXP:null,  color:'#f59e0b' },
];

export default function AchievementsPage() {
  const { profile }              = useUserData();
  const [selected, setSelected]  = useState(null);
  const earnedMap  = new Map((profile?.badges||[]).map(b => [b.id, b]));
  const totalXP    = profile?.xp || 0;
  const level      = profile?.level || 1;
  const levelInfo  = LEVELS.find(l => l.level === Math.min(level, 10)) || LEVELS[0];
  const xpInLevel  = Math.max(0, totalXP - levelInfo.minXP);
  const xpNeeded   = levelInfo.maxXP ? levelInfo.maxXP - levelInfo.minXP : 50000;
  const xpPct      = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  const handleBadgeClick = (badge) => {
    if (earnedMap.has(badge.id)) {
      playBadge();
      setSelected(badge);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
      <div className="mb-6 pt-12 lg:pt-0">
        <h1 className="font-syne font-black text-2xl md:text-3xl mb-1">Achievements</h1>
        <p className="text-white/40 text-sm">Your badges, level progress, and stats</p>
      </div>

      {/* Level card */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        className="glass border border-brand-border rounded-2xl p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotate:5, scale:1.05 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-syne font-black text-2xl border-2 relative flex-shrink-0"
              style={{ borderColor:levelInfo.color, background:`${levelInfo.color}15`, color:levelInfo.color }}>
              {level}
              <div className="absolute -top-2 -right-2 text-[9px] bg-brand-bg2 border border-brand-border px-1.5 py-0.5 rounded-full font-bold" style={{ color:levelInfo.color }}>
                Lv.{level}
              </div>
            </motion.div>
            <div>
              <p className="text-xs text-white/40">Current Level</p>
              <p className="font-syne font-black text-xl" style={{ color:levelInfo.color }}>{levelInfo.name}</p>
              <p className="text-xs text-white/40">{totalXP.toLocaleString()} total XP</p>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>{xpInLevel} / {xpNeeded} XP</span>
              <span>{xpPct}% to Lv.{Math.min(level+1,10)}</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full"
                style={{ background:`linear-gradient(90deg,${levelInfo.color}88,${levelInfo.color})` }}
                initial={{ width:0 }} animate={{ width:`${xpPct}%` }} transition={{ duration:1.2, delay:0.3 }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon:'🏆', label:'Badges',       val:`${earnedMap.size}/${ALL_BADGES.length}` },
          { icon:'🔥', label:'Streak',        val:`${profile?.streak||0} days` },
          { icon:'⚡', label:'Total XP',      val:totalXP.toLocaleString() },
          { icon:'📝', label:'Total Quizzes', val:profile?.totalQuizzes||0 },
        ].map(({ icon, label, val }) => (
          <motion.div key={label} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
            className="glass border border-brand-border rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="font-syne font-black text-lg text-cyan">{val}</div>
            <div className="text-[10px] text-white/30">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recently earned — with entrance animation */}
      {earnedMap.size > 0 && (
        <div className="mb-6">
          <h2 className="font-syne font-bold text-base mb-3 flex items-center gap-2">
            <Star size={15} className="text-neon-amber" />Recently Earned
          </h2>
          <div className="flex flex-wrap gap-3">
            {[...(profile?.badges||[])].reverse().slice(0,6).map((badge, i) => {
              const colors = CAT_COLORS[badge.category] || CAT_COLORS.Achievement;
              return (
                <motion.div key={badge.id}
                  initial={{ scale:0, rotate:-10 }} animate={{ scale:1, rotate:0 }}
                  transition={{ delay:i*0.08, type:'spring', stiffness:300 }}
                  whileHover={{ scale:1.08, rotate:2 }}
                  onClick={() => handleBadgeClick(badge)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border cursor-pointer ${colors.bg} ${colors.border}`}>
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className={`text-xs font-bold ${colors.text}`}>{badge.name}</p>
                    <p className="text-[10px] text-white/30">{badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : ''}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* All badges */}
      <div>
        <h2 className="font-syne font-bold text-base mb-3 flex items-center gap-2">
          <Zap size={15} className="text-cyan" />All Badges
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {ALL_BADGES.map((badge, i) => {
            const earned = earnedMap.has(badge.id);
            const info   = earnedMap.get(badge.id);
            const colors = CAT_COLORS[badge.category] || CAT_COLORS.Achievement;
            return (
              <motion.div key={badge.id}
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
                whileHover={earned ? { y:-3, scale:1.03 } : {}}
                onClick={() => handleBadgeClick(badge)}
                className={`rounded-2xl p-4 border text-center transition-all relative ${earned ? `${colors.bg} ${colors.border} cursor-pointer` : 'bg-white/[0.02] border-brand-border opacity-40 cursor-default'}`}>
                {!earned && <Lock size={10} className="absolute top-2.5 right-2.5 text-white/20" />}
                {earned && (
                  <motion.div
                    initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:i*0.03+0.2, type:'spring' }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-green flex items-center justify-center">
                    <span className="text-[8px] text-brand-bg font-bold">✓</span>
                  </motion.div>
                )}
                <div className={`text-3xl mb-2 ${!earned ? 'grayscale' : ''}`}>{badge.icon}</div>
                <p className={`font-syne font-bold text-xs mb-1 ${earned ? colors.text : 'text-white/30'}`}>{badge.name}</p>
                <p className="text-[10px] text-white/30 leading-snug">{badge.desc}</p>
                {earned && info?.earnedAt && (
                  <p className="text-[9px] text-white/20 mt-1">{new Date(info.earnedAt).toLocaleDateString()}</p>
                )}
                <div className={`mt-2 text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block ${earned ? colors.bg : 'bg-white/[0.04]'} ${earned ? colors.text : 'text-white/20'}`}>
                  {badge.category}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Level roadmap */}
      <div className="mt-8">
        <h2 className="font-syne font-bold text-base mb-3 flex items-center gap-2">
          <Trophy size={15} className="text-cyan" />Level Roadmap
        </h2>
        <div className="space-y-2">
          {LEVELS.map(l => {
            const isCurrent = l.level === level;
            const isPast    = l.level < level;
            return (
              <motion.div key={l.level}
                initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:l.level*0.04 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCurrent ? '' : isPast ? 'opacity-60' : 'opacity-25'}`}
                style={{ borderColor:isCurrent ? l.color : 'rgba(255,255,255,0.08)', background:isCurrent ? `${l.color}08` : 'transparent' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-syne font-black text-sm border flex-shrink-0"
                  style={{ borderColor:l.color, color:l.color, background:`${l.color}15` }}>{l.level}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color:isCurrent ? l.color : undefined }}>{l.name}</p>
                  <p className="text-xs text-white/30">{l.minXP.toLocaleString()}{l.maxXP ? ` – ${l.maxXP.toLocaleString()}` : '+'} XP</p>
                </div>
                {isPast    && <span className="text-xs text-neon-green font-semibold flex-shrink-0">✓ Reached</span>}
                {isCurrent && <motion.span animate={{ opacity:[1,0.4,1] }} transition={{ repeat:Infinity, duration:2 }}
                  className="text-xs font-bold flex-shrink-0" style={{ color:l.color }}>← You</motion.span>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Badge detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale:0.8, rotate:-5 }} animate={{ scale:1, rotate:0 }} exit={{ scale:0.8 }}
              transition={{ type:'spring', stiffness:300 }}
              onClick={e => e.stopPropagation()}
              className="glass border border-brand-border2 rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl">
              <motion.div animate={{ rotate:[0,10,-10,0] }} transition={{ delay:0.2, duration:0.4 }} className="text-6xl mb-4">
                {selected.icon}
              </motion.div>
              <h3 className="font-syne font-black text-xl mb-1">{selected.name}</h3>
              <p className="text-white/50 text-sm mb-4">{selected.desc}</p>
              {earnedMap.get(selected.id)?.earnedAt && (
                <p className="text-xs text-white/30">Earned on {new Date(earnedMap.get(selected.id).earnedAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}</p>
              )}
              <button onClick={() => setSelected(null)} className="mt-5 btn-cyan py-2 px-8 text-sm">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
