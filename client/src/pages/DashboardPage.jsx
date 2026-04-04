import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Flame, Target, BookOpen, AlertTriangle, TrendingUp, ArrowRight, MessageSquare, FileQuestion } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { fetchQuizHistory, detectWeakTopics, getAdaptiveDifficulty } from '../utils/api';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, color, value, label, sub, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass border border-brand-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {sub && <span className="text-xs font-medium text-neon-green">{sub}</span>}
      </div>
      <div className="font-syne font-black text-3xl" style={{ color }}>{value}</div>
      <div className="text-xs text-white/40 mt-1">{label}</div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile, subjectProgress } = useUserData();
  const [quizHistory, setQuizHistory]   = useState([]);
  const [weakTopics, setWeakTopics]     = useState(null);
  const [adaptiveTip, setAdaptiveTip]   = useState(null);
  const [loadingWeak, setLoadingWeak]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const h = await fetchQuizHistory(30);
        setQuizHistory(h.data);

        if (h.data.length > 0) {
          setLoadingWeak(true);
          const [weakRes, adaptRes] = await Promise.all([
            detectWeakTopics(h.data),
            getAdaptiveDifficulty(
              h.data.slice(0, 10).map(q => q.score),
              profile?.currentDifficulty || 'intermediate'
            ),
          ]);
          setWeakTopics(weakRes.data);
          setAdaptiveTip(adaptRes.data);
          setLoadingWeak(false);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
    };
    if (profile) load();
  }, [profile]);

  const avgScore = quizHistory.length
    ? Math.round(quizHistory.reduce((a, b) => a + b.score, 0) / quizHistory.length)
    : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.displayName || 'Student').split(' ')[0];

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-syne font-black text-3xl">{greeting}, {firstName}! 👋</h1>
        <p className="text-white/40 text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Streak banner */}
      {(profile?.streak || 0) >= 3 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-neon-amber/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="text-3xl">🔥</div>
          <div>
            <p className="font-syne font-bold text-neon-amber">{profile.streak}-Day Streak!</p>
            <p className="text-xs text-white/40">Keep it up — you're on a roll! Come back tomorrow to keep your streak alive.</p>
          </div>
          {profile.longestStreak > profile.streak && (
            <div className="ml-auto text-xs text-white/30">Best: {profile.longestStreak} days</div>
          )}
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Zap}      color="#00e5ff" value={(profile?.xp || 0).toLocaleString()} label="Total XP"         sub={`Lv. ${profile?.level || 1}`}  delay={0} />
        <StatCard icon={Flame}    color="#ffb830" value={profile?.streak || 0}                label="Day Streak"      sub="🔥 Active"                          delay={0.1} />
        <StatCard icon={Target}   color="#34d399" value={`${avgScore}%`}                     label="Avg Quiz Score"  sub={quizHistory.length > 0 ? `+${Math.max(0, avgScore - 65)}% vs start` : 'Take quizzes!'} delay={0.2} />
        <StatCard icon={BookOpen} color="#a78bfa" value={profile?.totalQuizzes || 0}         label="Quizzes Taken"   delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-syne font-bold text-lg">Subject Progress</h2>
            <Link to="/app/quiz" className="text-xs text-cyan hover:underline">Take a quiz →</Link>
          </div>
          {subjectProgress.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-white/40 text-sm">No subject data yet. Start quizzing to track progress!</p>
              <Link to="/app/quiz"><button className="btn-cyan mt-4 text-sm py-2 px-6">Start a Quiz</button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {subjectProgress.map(({ subject, averageScore, totalQuizzes, topicsAttempted }) => (
                <div key={subject}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium">{subject}</span>
                    <span className="text-white/40">{averageScore}% · {totalQuizzes} quizzes</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${averageScore}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full rounded-full"
                      style={{ background: averageScore >= 80 ? '#34d399' : averageScore >= 60 ? '#00e5ff' : '#ffb830' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass border border-brand-border rounded-2xl p-6">
          <h2 className="font-syne font-bold text-lg mb-5">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/app/tutor">
              <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 p-3 rounded-xl bg-cyan/10 border border-cyan/20 cursor-pointer mb-3">
                <MessageSquare size={18} className="text-cyan" />
                <div><p className="text-sm font-semibold text-cyan">Ask AI Tutor</p><p className="text-xs text-white/40">Get instant help</p></div>
                <ArrowRight size={14} className="ml-auto text-cyan" />
              </motion.div>
            </Link>
            <Link to="/app/quiz">
              <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 p-3 rounded-xl bg-neon-amber/10 border border-neon-amber/20 cursor-pointer mb-3">
                <FileQuestion size={18} className="text-neon-amber" />
                <div><p className="text-sm font-semibold text-neon-amber">Generate Quiz</p><p className="text-xs text-white/40">Test your knowledge</p></div>
                <ArrowRight size={14} className="ml-auto text-neon-amber" />
              </motion.div>
            </Link>
            <Link to="/app/learning-path">
              <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 p-3 rounded-xl glass border border-brand-border cursor-pointer">
                <TrendingUp size={18} className="text-neon-violet" />
                <div><p className="text-sm font-semibold">My Learning Path</p><p className="text-xs text-white/40">See your roadmap</p></div>
                <ArrowRight size={14} className="ml-auto text-white/30" />
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Weak Topic Detector */}
      {(weakTopics || loadingWeak) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-6 glass border border-brand-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-neon-amber" />
            <h2 className="font-syne font-bold text-lg">AI Weak Topic Detector</h2>
          </div>
          {loadingWeak ? (
            <div className="flex items-center gap-3 text-sm text-white/40">
              <div className="w-4 h-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
              Analyzing your quiz history...
            </div>
          ) : weakTopics ? (
            <>
              <p className="text-sm text-white/60 mb-4 italic">{weakTopics.insights}</p>
              {weakTopics.weakTopics?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {weakTopics.weakTopics.map((t) => (
                    <div key={t.topic} className={`p-3 rounded-xl border ${t.priority === 'high' ? 'border-red-500/30 bg-red-500/10' : t.priority === 'medium' ? 'border-neon-amber/30 bg-neon-amber/10' : 'border-brand-border2 bg-white/[0.03]'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold">{t.topic}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${t.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-neon-amber/20 text-neon-amber'}`}>
                          {t.averageScore}%
                        </span>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">{t.recommendation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neon-green">🎉 No weak topics detected — you're performing great across the board!</p>
              )}
              {weakTopics.suggestedFocus && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white/40">Suggested focus:</span>
                  <span className="text-cyan font-semibold">{weakTopics.suggestedFocus}</span>
                  <Link to="/app/quiz"><button className="ml-auto btn-cyan text-xs py-1.5 px-4">Study Now</button></Link>
                </div>
              )}
            </>
          ) : null}
          {adaptiveTip && (
            <div className="mt-4 pt-4 border-t border-brand-border flex items-center gap-3">
              <Zap size={15} className="text-cyan flex-shrink-0" />
              <p className="text-xs text-white/50"><span className="text-cyan font-semibold">Difficulty Tip: </span>{adaptiveTip.reason}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Recent Quiz History */}
      {quizHistory.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-6 glass border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-syne font-bold text-lg">Recent Quizzes</h2>
          </div>
          <div className="space-y-2">
            {quizHistory.slice(0, 6).map((q) => (
              <div key={q.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${q.score >= 80 ? 'bg-neon-green/20 text-neon-green' : q.score >= 60 ? 'bg-cyan/20 text-cyan' : 'bg-neon-amber/20 text-neon-amber'}`}>
                  {q.score}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{q.topic}</p>
                  <p className="text-xs text-white/30">{q.subject} · {q.difficulty}</p>
                </div>
                <div className="text-xs text-white/20">
                  {q.timestamp ? new Date(q.timestamp).toLocaleDateString() : 'Recent'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
