import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  MessageSquare, FileQuestion, BarChart3, Map,
  Users, Trophy, Zap, ArrowRight, Brain, Star
} from 'lucide-react';

/* ── Animated counter ── */
function Counter({ target, suffix = '', duration = 2000 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(Math.floor(start));
      if (start >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [inView, target, duration]);
  return <span ref={ref}>{val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val}{suffix}</span>;
}

/* ── Feature card ── */
const features = [
  { icon: MessageSquare, color: '#00e5ff', tag: 'Core',        title: 'AI Chat Tutor',            desc: 'Ask anything anytime. Nex explains concepts clearly, gives examples, and adapts to your level.' },
  { icon: FileQuestion,  color: '#ffb830', tag: 'AI Powered',  title: 'Smart Quiz Generator',     desc: 'Generate custom quizzes on any topic instantly with instant feedback and AI explanations.' },
  { icon: BarChart3,     color: '#a78bfa', tag: 'Analytics',   title: 'Progress Dashboard',       desc: 'Track XP, streaks, quiz scores and subject mastery with beautiful visual analytics.' },
  { icon: Map,           color: '#34d399', tag: 'Personalized',title: 'Adaptive Learning Paths',  desc: 'AI-generated visual mind-maps of every topic — mastered, in-progress, and what to tackle next.' },
  { icon: Users,         color: '#ffb830', tag: 'Collaborative',title: 'Live Study Rooms',        desc: 'Real-time study sessions with peers. Share whiteboards, ask questions, and learn together.' },
  { icon: Trophy,        color: '#00e5ff', tag: 'Gamification', title: 'XP, Badges & Streaks',    desc: 'Stay motivated with daily streaks, XP points, achievement badges, and leaderboards.' },
];

/* ── Steps ── */
const steps = [
  { num: '01', title: 'Create Profile',       desc: 'Sign up, pick your subjects and learning goals.' },
  { num: '02', title: 'Chat with Nex AI',     desc: 'Ask questions, request explanations, or say "quiz me".' },
  { num: '03', title: 'Take AI Quizzes',      desc: 'Get quizzes tailored to your level with instant feedback.' },
  { num: '04', title: 'Track & Level Up',     desc: 'Watch your dashboard grow as your skills improve daily.' },
];

/* ── Testimonials ── */
const testimonials = [
  { name: 'Priya R.',  role: 'Class 12 · Mumbai',        text: 'BrainNex is incredible. The AI tutor explains physics better than my textbook, and the quiz system helped me jump from 65% to 91% in 5 weeks.', stars: 5, init: 'PR', grad: 'from-cyan-400 to-violet-500' },
  { name: 'Aarav S.', role: 'B.Tech · Delhi',            text: 'The adaptive difficulty is a game-changer. It knows exactly when to push you harder and when to let you consolidate. My GPA improved significantly.', stars: 5, init: 'AS', grad: 'from-amber-400 to-green-400' },
  { name: 'Meera K.', role: 'Class 10 · Pune',           text: "I've maintained a 31-day streak! The gamification keeps me coming back every day. It honestly feels like a game more than studying.", stars: 5, init: 'MK', grad: 'from-violet-400 to-amber-400' },
];

/* ── Subjects ── */
const subjects = [
  { emoji: '🧮', name: 'Mathematics' },
  { emoji: '⚗️', name: 'Chemistry' },
  { emoji: '🔬', name: 'Biology' },
  { emoji: '⚡', name: 'Physics' },
  { emoji: '💻', name: 'Computer Science' },
  { emoji: '📚', name: 'Literature' },
  { emoji: '🌍', name: 'Geography' },
  { emoji: '📜', name: 'History' },
  { emoji: '💰', name: 'Economics' },
  { emoji: '🧠', name: 'Psychology' },
  { emoji: '🔤', name: 'Languages' },
  { emoji: '🎨', name: 'Art & Design' },
];

/* ── Floating badge ── */
function FloatBadge({ className, children }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute hidden lg:flex items-center gap-2 glass border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold shadow-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  /* Particle canvas */
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5, a: Math.random() * 0.5 + 0.1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p, i) => {
        p.x = (p.x + p.vx + canvas.width) % canvas.width;
        p.y = (p.y + p.vy + canvas.height) % canvas.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${p.a})`;
        ctx.fill();
        pts.slice(i + 1).forEach(p2 => {
          const d = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (d < 110) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0,229,255,${0.07 * (1 - d / 110)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  /* Scroll reveal */
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(e => e.forEach(x => x.isIntersecting && x.target.classList.add('visible')), { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg text-white overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 lg:px-16 bg-brand-bg/80 backdrop-blur-xl border-b border-brand-border">
        <Link to="/" className="flex items-center gap-2.5 font-syne font-bold text-xl">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <img src="/public/images/BrainNex_logo.png" alt="" />
          </div>
          BrainNex
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Subjects'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} className="nav-link">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"    className="btn-outline text-sm py-2 px-5">Login</Link>
          <Link to="/register" className="btn-cyan text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-6 overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        {/* Orbs */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan/10 blur-[100px] -top-20 -left-20 animate-float pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[100px] -bottom-10 -right-10 animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

        {/* Floating cards */}
        <FloatBadge className="top-32 left-8 lg:left-16">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-blink" />
          <span className="text-neon-green">AI Tutor Active</span>
        </FloatBadge>
        <FloatBadge className="top-48 right-8 lg:right-20" style={{ animationDelay: '1s' }}>
          <span>🔥</span>
          <span className="text-neon-amber">14-day streak!</span>
        </FloatBadge>
        <FloatBadge className="bottom-40 left-8 lg:left-20" style={{ animationDelay: '0.5s' }}>
          <span>📊</span>
          <span className="text-white/80">Quiz Score <span className="text-neon-green font-bold">92%</span></span>
        </FloatBadge>
        <FloatBadge className="bottom-52 right-8 lg:right-16" style={{ animationDelay: '1.5s' }}>
          <Zap size={12} className="text-neon-amber" />
          <span className="text-white/80">+120 XP earned</span>
        </FloatBadge>

        {/* Hero content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-cyan/10 border border-cyan/30 rounded-full px-4 py-1.5 text-xs font-semibold text-cyan uppercase tracking-widest mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-blink" />
            Powered by Advanced AI
          </motion.div>

          <h1 className="font-syne font-black text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-6">
            Learn Smarter<br />
            with <span className="gradient-text">AI Guidance</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-xl mx-auto leading-relaxed mb-10">
            BrainNex is your personal AI tutor — answering questions, generating quizzes, tracking progress, and adapting to your unique learning style in real time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-cyan flex items-center gap-2 text-base px-8 py-4"
              >
                Start Learning Free <ArrowRight size={18} />
              </motion.button>
            </Link>
            <a href="#features">
              <button className="btn-outline text-base px-8 py-4">Explore Features</button>
            </a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 mt-16 grid grid-cols-3 gap-px bg-brand-border rounded-2xl overflow-hidden max-w-lg w-full"
        >
          {[
            { val: 50000, suf: '', label: 'Students' },
            { val: 2400, suf: 'K+', label: 'Quizzes Generated' },
            { val: 73, suf: '%', label: 'Avg. Score Boost' },
          ].map(({ val, suf, label }) => (
            <div key={label} className="bg-brand-bg2 py-5 text-center">
              <div className="font-syne font-black text-3xl text-cyan">
                <Counter target={val} suffix={suf} />
              </div>
              <div className="text-xs text-white/30 mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="overflow-hidden py-4 border-y border-brand-border bg-brand-bg2">
        <div className="flex gap-12 animate-marquee w-max">
          {[...Array(2)].flatMap(() =>
            ['⚡ Real-time AI Tutoring', '🎯 Adaptive Difficulty', '📝 AI Quiz Generation', '📊 Progress Analytics', '🏆 XP & Badges', '🔒 Firebase Auth', '🌍 40+ Subjects', '👥 Study Rooms', '🗺️ Learning Paths', '🎙️ Voice Q&A'].map(t => (
              <span key={t + Math.random()} className="text-xs font-medium text-white/30 whitespace-nowrap">{t}</span>
            ))
          )}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-6 lg:px-16">
        <div className="reveal max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-4">Core Features</p>
          <h2 className="font-syne font-black text-4xl lg:text-6xl leading-tight tracking-tight max-w-lg">
            Everything a student <span className="text-white/30">needs to excel</span>
          </h2>
        </div>
        <div className="mt-16 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-border border border-brand-border rounded-2xl overflow-hidden">
          {features.map(({ icon: Icon, color, tag, title, desc }, i) => (
            <motion.div
              key={title}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
              className="reveal bg-brand-bg2 p-9 flex flex-col gap-4 group relative overflow-hidden"
              style={{ transitionDelay: `${i * 0.05}s` }}
            >
              <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${color}20` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div>
                <h3 className="font-syne font-bold text-xl mb-2">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full self-start"
                style={{ background: `${color}20`, color }}>
                {tag}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-28 px-6 lg:px-16 bg-brand-bg2">
        <div className="max-w-7xl mx-auto">
          <div className="reveal text-center mb-20">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-4">How It Works</p>
            <h2 className="font-syne font-black text-4xl lg:text-6xl tracking-tight">
              Up and learning <span className="text-white/30">in 4 steps</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="absolute top-10 left-[12.5%] right-[12.5%] h-px bg-brand-border hidden lg:block" />
            {steps.map(({ num, title, desc }, i) => (
              <motion.div
                key={num}
                whileHover={{ y: -4 }}
                className="reveal flex flex-col items-center text-center"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <motion.div
                  whileHover={{ boxShadow: '0 0 30px rgba(0,229,255,0.3)' }}
                  className="w-20 h-20 rounded-full bg-brand-bg border-2 border-brand-border2 flex items-center justify-center font-syne font-black text-2xl text-cyan mb-6 relative z-10 transition-all"
                >
                  {num}
                </motion.div>
                <h3 className="font-syne font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUBJECTS ── */}
      <section id="subjects" className="py-28 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="reveal mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-4">Subjects</p>
            <h2 className="font-syne font-black text-4xl lg:text-6xl tracking-tight">
              Learn anything, <span className="text-white/30">master everything</span>
            </h2>
          </div>
          <div className="reveal grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {subjects.map(({ emoji, name }) => (
              <motion.div
                key={name}
                whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.2)' }}
                className="glass border border-brand-border rounded-2xl p-5 flex flex-col items-center text-center cursor-pointer transition-all"
              >
                <span className="text-3xl mb-3">{emoji}</span>
                <span className="text-xs font-semibold text-white/70">{name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-28 px-6 lg:px-16 bg-brand-bg2">
        <div className="max-w-7xl mx-auto">
          <div className="reveal text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-4">Testimonials</p>
            <h2 className="font-syne font-black text-4xl lg:text-6xl tracking-tight">
              Students love <span className="text-white/30">BrainNex</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, stars, init, grad }, i) => (
              <motion.div
                key={name}
                whileHover={{ borderColor: 'rgba(255,255,255,0.15)' }}
                className="reveal glass border border-brand-border rounded-2xl p-8 transition-all"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => <Star key={i} size={13} className="text-neon-amber fill-neon-amber" />)}
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-6">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-sm font-bold text-brand-bg`}>{init}</div>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-white/30">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 lg:px-16 text-center relative overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan/6 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="reveal relative z-10 max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-6">Free to Start</p>
          <h2 className="font-syne font-black text-5xl lg:text-7xl tracking-tight leading-none mb-6">
            Ready to learn<br />with <span className="gradient-text">AI by your side?</span>
          </h2>
          <p className="text-white/50 text-lg mb-10">Join thousands of students using BrainNex to study smarter and score higher.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="btn-cyan flex items-center gap-2 text-base px-10 py-4">
                Start for Free <ArrowRight size={18} />
              </motion.button>
            </Link>
            <Link to="/login">
              <button className="btn-outline text-base px-10 py-4">Sign In</button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-brand-border py-10 px-6 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-syne font-bold text-lg">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center">
            {/* <span className="text-brand-bg font-bold text-xs"></span> */}
            <img src="/public/images/BrainNex_logo.png" alt="" />
          </div>
          BrainNex
        </div>
        <div className="flex gap-6 text-xs text-white/30">
          {['Features', 'Privacy', 'Terms', 'Contact'].map(l => (
            <a key={l} href="#" className="hover:text-white/60 transition-colors">{l}</a>
          ))}
        </div>
        <p className="text-xs text-white/20">© 2025 BrainNex · React · Tailwind · Node.js · Firebase</p>
      </footer>
    </div>
  );
}
