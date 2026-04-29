import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Lock, Zap, Star, FileText, BookOpen, GraduationCap, Crown,
  Target, Brain, Timer, TrendingUp, Sparkles, Flame, Shield, Users,
  Award, BookMarked, CheckCircle, FileQuestion
} from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { triggerConfetti } from '../utils/confetti';
import { audioSystem } from '../utils/audio';

export const ALL_BADGES = [
  // Milestone
  { id:'first-quiz',      name:'First Quiz!',        Icon: FileText,      color: '#8B72FF', category:'Milestone',    desc:'Complete your first quiz' },
  { id:'10-quizzes',      name:'Quiz Veteran',       Icon: BookOpen,      color: '#8B72FF', category:'Milestone',    desc:'Complete 10 quizzes' },
  { id:'25-quizzes',      name:'Quiz Master',        Icon: GraduationCap, color: '#8B72FF', category:'Milestone',    desc:'Complete 25 quizzes' },
  { id:'50-quizzes',      name:'Quiz Legend',        Icon: Crown,         color: '#8B72FF', category:'Milestone',    desc:'Complete 50 quizzes' },
  // Achievement
  { id:'perfect-score',   name:'Perfect Score!',     Icon: Star,          color: '#F59E0B', category:'Achievement',  desc:'Score 100% on any quiz' },
  { id:'high-scorer',     name:'High Scorer',        Icon: Target,        color: '#F97316', category:'Achievement',  desc:'80%+ avg accuracy (5+ quizzes)' },
  { id:'multi-subject',   name:'Polymath',           Icon: Brain,         color: '#EC4899', category:'Achievement',  desc:'Study 5 different subjects' },
  { id:'speed-run',       name:'Speed Runner',       Icon: Timer,         color: '#06B6D4', category:'Achievement',  desc:'Complete a quiz in under 90 seconds' },
  { id:'comeback-kid',    name:'Comeback Kid',       Icon: TrendingUp,    color: '#10B981', category:'Achievement',  desc:'Score 80%+ after scoring below 50%' },
  // XP
  { id:'1k-xp',           name:'1000 XP Club',       Icon: Zap,           color: '#EAB308', category:'XP',           desc:'Earn 1,000 XP total' },
  { id:'5k-xp',           name:'XP Champion',        Icon: Sparkles,      color: '#EAB308', category:'XP',           desc:'Earn 5,000 XP total' },
  { id:'10k-xp',          name:'XP Legend',          Icon: Trophy,        color: '#F59E0B', category:'XP',           desc:'Earn 10,000 XP total' },
  // Streak
  { id:'streak-3',        name:'3-Day Streak',       Icon: Flame,         color: '#F97316', category:'Streak',       desc:'Study 3 days in a row' },
  { id:'streak-7',        name:'Week Warrior',       Icon: Flame,         color: '#F97316', category:'Streak',       desc:'Study 7 days in a row', size: 'large' },
  { id:'streak-14',       name:'Fortnight Fire',     Icon: Flame,         color: '#EF4444', category:'Streak',       desc:'Study 14 days in a row' },
  { id:'streak-30',       name:'Month Master',       Icon: Crown,         color: '#F59E0B', category:'Streak',       desc:'Study 30 days in a row' },
  { id:'streak-60',       name:'Dedication',         Icon: Shield,        color: '#8B72FF', category:'Streak',       desc:'Study 60 days in a row' },
  // Social
  { id:'study-room',      name:'Team Player',        Icon: Users,         color: '#0EA5E9', category:'Social',       desc:'Join your first study room' },
  { id:'group-quiz',      name:'Group Champion',     Icon: Award,         color: '#0EA5E9', category:'Social',       desc:'Complete a group quiz in study room' },
  // Session
  { id:'first-session',   name:'First Lesson',       Icon: BookMarked,    color: '#06B6D4', category:'Learning',     desc:'Complete your first study session' },
  { id:'5-sessions',      name:'Dedicated Learner',  Icon: BookOpen,      color: '#06B6D4', category:'Learning',     desc:'Complete 5 study sessions' },
  { id:'session-perfect', name:'Session Star',       Icon: Star,          color: '#F59E0B', category:'Learning',     desc:'Score 100% on a session end quiz', filled: true },
  // Goals
  { id:'first-goal',      name:'Goal Setter',        Icon: Target,        color: '#10B981', category:'Goals',        desc:'Create your first study goal' },
  { id:'goal-complete',   name:'Goal Crusher',       Icon: CheckCircle,   color: '#10B981', category:'Goals',        desc:'Complete a study goal' },
];

const CAT_COLORS = {
  Milestone:   { bg:'bg-cyan/10',         border:'border-cyan/30',         text:'text-cyan'         },
  Achievement: { bg:'bg-amber-500/10',    border:'border-amber-500/30',    text:'text-amber-500'    },
  Streak:      { bg:'bg-orange-500/10',   border:'border-orange-500/30',   text:'text-orange-500'   },
  XP:          { bg:'bg-violet-500/10',   border:'border-violet-500/30',   text:'text-violet-500'   },
  Social:      { bg:'bg-pink-500/10',     border:'border-pink-500/30',     text:'text-pink-500'     },
  Learning:    { bg:'bg-green-500/10',    border:'border-green-500/30',    text:'text-green-500'    },
  Goals:       { bg:'bg-primary/10',      border:'border-primary/30',      text:'text-primary'      },
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
      audioSystem.playClick();
      setSelected(badge);
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto w-full">
      <div className="mb-8 pt-12 lg:pt-0">
        <h1 className="font-jakarta font-black text-3xl md:text-4xl text-txt mb-2">Achievements</h1>
        <p className="text-sm font-medium text-txt3">Your badges, level progress, and stats</p>
      </div>

      {/* Level card */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        className="glass-card p-6 md:p-8 mb-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20 rounded-bl-full pointer-events-none" style={{ background:`linear-gradient(to bottom left, ${levelInfo.color}, transparent)` }} />
        
        <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <motion.div
              whileHover={{ rotate:5, scale:1.05 }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center font-jakarta font-black text-4xl border-2 relative flex-shrink-0 shadow-sm"
              style={{ borderColor:levelInfo.color, background:`${levelInfo.color}15`, color:levelInfo.color }}>
              {level}
              <div className="absolute -top-3 -right-3 text-[10px] bg-space-900 border px-2 py-1 rounded-lg font-bold shadow-sm uppercase tracking-wider" style={{ color:levelInfo.color, borderColor:levelInfo.color }}>
                Lv.{level}
              </div>
            </motion.div>
            <div>
              <p className="text-xs font-bold text-txt3 uppercase tracking-widest mb-1">Current Level</p>
              <p className="font-jakarta font-black text-2xl mb-1" style={{ color:levelInfo.color }}>{levelInfo.name}</p>
              <p className="text-sm font-medium text-txt2">{totalXP.toLocaleString()} total XP</p>
            </div>
          </div>
          <div className="flex-1 md:ml-8 mt-4 md:mt-0">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-txt3 mb-2">
              <span>{xpInLevel} / {xpNeeded} XP</span>
              <span>{xpPct}% to Lv.{Math.min(level+1,10)}</span>
            </div>
            <div className="h-3 bg-space-800 rounded-full overflow-hidden shadow-inner">
              <motion.div className="h-full rounded-full"
                style={{ background:`linear-gradient(90deg,${levelInfo.color}88,${levelInfo.color})`, boxShadow:`0 0 10px ${levelInfo.color}60` }}
                initial={{ width:0 }} animate={{ width:`${xpPct}%` }} transition={{ duration:1.2, delay:0.3 }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { Icon:Trophy,   color:'#F59E0B', label:'Badges',       val:`${earnedMap.size}/${ALL_BADGES.length}` },
          { Icon:Flame,    color:'#F97316', label:'Streak',        val:`${profile?.streak||0} days` },
          { Icon:Zap,      color:'#EAB308', label:'Total XP',      val:totalXP.toLocaleString() },
          { Icon:FileText, color:'#8B72FF', label:'Total Quizzes', val:profile?.totalQuizzes||0 },
        ].map(({ Icon: StatIcon, color, label, val }) => (
          <motion.div key={label} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
            className="glass-card p-6 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="mb-3">
              <StatIcon size={32} style={{ color }} className="drop-shadow-sm" />
            </div>
            <div className="font-jakarta font-black text-2xl text-primary mb-1 drop-shadow-sm">{val}</div>
            <div className="text-[10px] font-bold text-txt3 uppercase tracking-wider">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recently earned — with entrance animation */}
      {earnedMap.size > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"/>
            <h2 className="font-jakarta font-black text-xl text-txt flex items-center gap-2">
              <Star size={20} className="text-amber-500" />Recently Earned
            </h2>
          </div>
          <div className="flex flex-wrap gap-4">
            {[...(profile?.badges||[])].reverse().slice(0,6).map((b, i) => {
              const badge = ALL_BADGES.find(ab => ab.id === b.id) || ALL_BADGES[0];
              badge.earnedAt = b.earnedAt;
              return (
                <motion.div key={badge.id}
                  initial={{ scale:0, rotate:-10 }} animate={{ scale:1, rotate:0 }}
                  transition={{ delay:i*0.08, type:'spring', stiffness:300 }}
                  whileHover={{ scale:1.05, rotate:2, boxShadow:'0 10px 25px -5px rgba(0,0,0,0.2)' }}
                  onClick={() => handleBadgeClick(badge)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer shadow-sm"
                  style={{ background: badge.color + '15', border: `1px solid ${badge.color}4D` }}>
                  <badge.Icon size={28} style={{ color: badge.color }} fill={badge.filled ? badge.color : 'none'} className="drop-shadow-sm" />
                  <div>
                    <p className="text-sm font-bold" style={{ color: badge.color }}>{badge.name}</p>
                    <p className="text-[10px] font-bold text-txt3 uppercase tracking-widest mt-0.5">{badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : ''}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* All badges */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-6 bg-cyan rounded-full shadow-[0_0_8px_rgba(0,229,255,0.6)]"/>
          <h2 className="font-jakarta font-black text-xl text-txt flex items-center gap-2">
            <Zap size={20} className="text-cyan" />All Badges
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {ALL_BADGES.map((badge, i) => {
            const earned = earnedMap.has(badge.id);
            const info   = earnedMap.get(badge.id);
            const colors = CAT_COLORS[badge.category] || CAT_COLORS.Achievement;
            return (
              <motion.div key={badge.id}
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.02 }}
                whileHover={earned ? { y:-4, scale:1.02, boxShadow:'0 10px 25px -5px rgba(0,0,0,0.2)' } : {}}
                onClick={() => handleBadgeClick(badge)}
                className="rounded-2xl p-5 border text-center transition-all relative flex flex-col items-center shadow-sm"
                style={{ 
                  background: earned ? badge.color + '1A' : 'var(--space-800)', 
                  borderColor: earned ? badge.color + '4D' : 'var(--border)',
                  cursor: earned ? 'pointer' : 'default',
                  opacity: earned ? 1 : 0.8
                }}>
                {!earned && <div className="absolute inset-0 bg-space-900/40 rounded-2xl z-0 pointer-events-none" />}
                {!earned && <div className="absolute top-3 right-3 p-1.5 bg-space-900 rounded-lg text-txt3 shadow-sm border border-white/5 z-10"><Lock size={12} /></div>}
                
                {earned && (
                  <motion.div
                    initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:i*0.02+0.2, type:'spring' }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm border-2 border-space-900 z-10">
                    <CheckCircle size={14} className="text-white" />
                  </motion.div>
                )}
                
                <div className="mb-4 mt-2 relative z-10">
                  <badge.Icon 
                    size={badge.size === 'large' ? 48 : 40} 
                    style={{ color: earned ? badge.color : '#888' }} 
                    fill={badge.filled && earned ? badge.color : 'none'}
                    className={`drop-shadow-sm ${!earned ? 'opacity-30' : ''}`} 
                  />
                </div>
                
                <p className="font-jakarta font-bold text-sm mb-1.5 relative z-10" style={{ color: earned ? badge.color : 'var(--txt3)' }}>{badge.name}</p>
                <p className="text-[10px] font-medium text-txt2 leading-relaxed relative z-10">{badge.desc}</p>
                
                {earned && info?.earnedAt && (
                  <p className="text-[9px] font-bold text-txt3 mt-2 uppercase tracking-widest relative z-10">{new Date(info.earnedAt).toLocaleDateString()}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Level roadmap */}
      <div className="mt-10 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(124,58,237,0.6)]"/>
          <h2 className="font-jakarta font-black text-xl text-txt flex items-center gap-2">
            <Trophy size={20} className="text-primary" />Level Roadmap
          </h2>
        </div>
        <div className="space-y-3">
          {LEVELS.map(l => {
            const isCurrent = l.level === level;
            const isPast    = l.level < level;
            return (
              <motion.div key={l.level}
                initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:l.level*0.04 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isCurrent ? 'shadow-md scale-[1.01]' : isPast ? 'opacity-70' : 'opacity-40'}`}
                style={{ borderColor:isCurrent ? l.color : 'var(--border)', background:isCurrent ? `${l.color}10` : 'var(--space-800)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-jakarta font-black text-lg border-2 flex-shrink-0 shadow-sm"
                  style={{ borderColor:l.color, color:l.color, background:`${l.color}20` }}>{l.level}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold" style={{ color:isCurrent ? l.color : 'var(--txt)' }}>{l.name}</p>
                  <p className="text-xs font-bold text-txt3 uppercase tracking-widest mt-1">{l.minXP.toLocaleString()}{l.maxXP ? ` – ${l.maxXP.toLocaleString()}` : '+'} XP</p>
                </div>
                {isPast    && <span className="text-xs text-green-500 font-bold uppercase tracking-widest flex-shrink-0 px-3 py-1 bg-green-500/10 rounded-lg border border-green-500/20 shadow-sm">✓ Reached</span>}
                {isCurrent && <motion.span animate={{ opacity:[1,0.5,1] }} transition={{ repeat:Infinity, duration:2 }}
                  className="text-xs font-black uppercase tracking-widest flex-shrink-0 px-3 py-1 rounded-lg border shadow-sm" style={{ color:l.color, backgroundColor:`${l.color}15`, borderColor:l.color }}>← You</motion.span>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Badge detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-space-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => { audioSystem.playClick(); setSelected(null); }}>
            <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:20 }}
              transition={{ type:'spring', stiffness:300 }}
              onClick={e => e.stopPropagation()}
              className="glass-card border-primary/20 rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none" />
              <motion.div animate={{ rotate:[0,10,-10,0], scale:[1,1.1,1] }} transition={{ delay:0.1, duration:0.5 }} className="flex justify-center mb-6 relative z-10">
                <selected.Icon size={72} style={{ color: selected.color }} fill={selected.filled ? selected.color : 'none'} className="drop-shadow-lg" />
              </motion.div>
              <h3 className="font-jakarta font-black text-2xl mb-2 text-txt relative z-10">{selected.name}</h3>
              <p className="text-txt2 font-medium text-base mb-6 relative z-10">{selected.desc}</p>
              {earnedMap.get(selected.id)?.earnedAt && (
                <div className="bg-space-800 rounded-xl p-3 mb-6 border border-white/5 relative z-10">
                  <p className="text-[10px] font-bold text-txt3 uppercase tracking-widest mb-1">Earned On</p>
                  <p className="text-sm font-bold text-txt2">{new Date(earnedMap.get(selected.id).earnedAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}</p>
                </div>
              )}
              <button onClick={() => { audioSystem.playClick(); setSelected(null); }} className="btn-primary w-full py-3.5 text-sm font-bold shadow-glow-primary relative z-10">Awesome!</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
