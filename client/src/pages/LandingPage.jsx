import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { MessageSquare, FileQuestion, BarChart3, Map, Users, Trophy, Zap, ArrowRight, Star, BookMarked, CheckCircle } from 'lucide-react';

function Counter({ target, suffix='', duration=2000 }) {
  const [val, setVal] = useState(0);
  const ref    = useRef(null);
  const inView = useInView(ref, { once:true });
  useEffect(() => {
    if (!inView) return;
    let v=0; const step = target/(duration/16);
    const t = setInterval(() => { v=Math.min(v+step,target); setVal(Math.floor(v)); if(v>=target) clearInterval(t); }, 16);
    return () => clearInterval(t);
  }, [inView, target, duration]);
  return <span ref={ref}>{val>=1000 ? (val/1000).toFixed(0)+'K' : val}{suffix}</span>;
}

const features = [
  { icon:MessageSquare, color:'#00e5ff', tag:'Core',         title:'AI Chat Tutor',         desc:'Ask anything, anytime. Nex explains concepts clearly and adapts to your level in real time.' },
  { icon:BookMarked,    color:'#a78bfa', tag:'Study Flow',   title:'Structured Study Sessions', desc:'AI teaches you topic-by-topic with lesson cards, comprehension checks, then an end quiz.' },
  { icon:FileQuestion,  color:'#ffb830', tag:'AI Powered',   title:'Smart Quiz Generator',  desc:'Generate custom quizzes on any topic instantly with instant feedback and AI explanations.' },
  { icon:BarChart3,     color:'#34d399', tag:'Analytics',    title:'Progress Dashboard',    desc:'Track XP, streaks, quiz scores and subject mastery with beautiful visual analytics.' },
  { icon:Map,           color:'#00e5ff', tag:'Personalized', title:'Adaptive Learning Paths',desc:'AI-generated visual roadmaps — mastered, in-progress, and what to tackle next.' },
  { icon:Users,         color:'#ffb830', tag:'Collaborative',title:'Live Study Rooms',      desc:'Real-time study sessions with peers. Group quizzes, shared resources, and live chat.' },
  { icon:Trophy,        color:'#a78bfa', tag:'Gamification', title:'XP, Badges & Streaks',  desc:'Stay motivated with daily streaks, XP points, achievement badges, and leaderboards.' },
];

const HOW_STEPS = [
  {
    num:'01', icon:'🎯', title:'Sign up & onboard',
    desc:'Create your free account. Our 3-step wizard asks your grade, subjects, and study goal to personalize everything from day one.',
    detail: ['Pick your subjects', 'Set your study goal', 'Choose your level'],
  },
  {
    num:'02', icon:'📖', title:'Start a Study Session',
    desc:'Pick any topic and our AI generates a full structured lesson — 5 teaching cards with formulas, examples, and key points to master.',
    detail: ['AI-generated lesson cards', 'Mid-session checkpoints', 'Formulas & real examples'],
  },
  {
    num:'03', icon:'📝', title:'Take the end quiz',
    desc:'After your lesson, get automatically generated quiz questions specifically about what you just learned. Get instant AI explanations.',
    detail: ['Topic-specific questions', 'Instant AI feedback', 'Auto flashcards for misses'],
  },
  {
    num:'04', icon:'📊', title:'Track & level up',
    desc:'Watch your dashboard fill up with stats, badges, and streaks. The AI detects weak topics and reminds you when to revisit them.',
    detail: ['XP & badge rewards', 'Streak calendar', 'Weak topic reminders'],
  },
];

const testimonials = [
  { name:'Priya R.',  role:'Class 12 · Mumbai',       text:'The Study Sessions are incredible. AI explains, then quizzes me — I went from 65% to 91% in Physics in 5 weeks.', stars:5, grad:'from-cyan-400 to-violet-500' },
  { name:'Aarav S.',  role:'B.Tech · Delhi',           text:'The adaptive difficulty and weekly AI report are game-changers. My GPA improved significantly this semester.', stars:5, grad:'from-amber-400 to-green-400' },
  { name:'Meera K.',  role:'Class 10 · Pune',          text:"31-day streak! The gamification keeps me coming back every single day. It genuinely feels fun, not like studying.", stars:5, grad:'from-violet-400 to-amber-400' },
];

const subjects = [
  {emoji:'🧮',name:'Mathematics'},{emoji:'⚗️',name:'Chemistry'},{emoji:'⚡',name:'Physics'},
  {emoji:'🔬',name:'Biology'},{emoji:'💻',name:'Computer Science'},{emoji:'📚',name:'Literature'},
  {emoji:'🌍',name:'Geography'},{emoji:'📜',name:'History'},{emoji:'💰',name:'Economics'},
  {emoji:'🧠',name:'Psychology'},{emoji:'🔤',name:'Languages'},{emoji:'🎨',name:'Art & Design'},
];

export default function LandingPage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const resize = () => { canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({length:60}, () => ({ x:Math.random()*canvas.width, y:Math.random()*canvas.height, vx:(Math.random()-.5)*.4, vy:(Math.random()-.5)*.4, r:Math.random()*1.5+.5, a:Math.random()*.5+.1 }));
    let raf;
    const draw = () => {
      c.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach((p,i) => {
        p.x=(p.x+p.vx+canvas.width)%canvas.width; p.y=(p.y+p.vy+canvas.height)%canvas.height;
        c.beginPath(); c.arc(p.x,p.y,p.r,0,Math.PI*2); c.fillStyle=`rgba(0,229,255,${p.a})`; c.fill();
        pts.slice(i+1).forEach(p2 => { const d=Math.hypot(p.x-p2.x,p.y-p2.y); if(d<110){ c.beginPath(); c.moveTo(p.x,p.y); c.lineTo(p2.x,p2.y); c.strokeStyle=`rgba(0,229,255,${.07*(1-d/110)})`; c.lineWidth=.5; c.stroke(); } });
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(e => e.forEach(x => x.isIntersecting && x.target.classList.add('visible')), { threshold:.1 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg text-white overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 lg:px-16 bg-brand-bg/85 backdrop-blur-xl border-b border-brand-border">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/images/BrainNex_logo.png" alt="BrainNex" className="w-7 h-7 object-contain" />
          <span className="font-syne font-black text-xl" style={{ background:'linear-gradient(90deg,#00e5ff,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>BrainNex</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {[['#features','Features'],['#how-it-works','How It Works'],['#subjects','Subjects']].map(([href,label]) => (
            <a key={href} href={href} className="nav-link text-sm">{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"    className="btn-outline text-sm py-2 px-5">Login</Link>
          <Link to="/register" className="btn-cyan    text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-6 overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan/10 blur-[100px] -top-20 -left-20 animate-float pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[100px] -bottom-10 -right-10 pointer-events-none" style={{ animationDelay:'2s' }} />

        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8 }}
          className="relative z-10 text-center max-w-4xl">
          <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.1 }}
            className="inline-flex items-center gap-2 bg-cyan/10 border border-cyan/30 rounded-full px-4 py-1.5 text-xs font-semibold text-cyan uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-blink" />Powered by Claude AI
          </motion.div>

          <h1 className="font-syne font-black text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-6">
            Learn Smarter<br />with <span className="gradient-text">AI Guidance</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-xl mx-auto leading-relaxed mb-10">
            BrainNex is your personal AI tutor — structured lessons, adaptive quizzes, progress tracking, and a learning system that adapts to you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                className="btn-cyan flex items-center gap-2 text-base px-8 py-4">
                Start Learning Free <ArrowRight size={18} />
              </motion.button>
            </Link>
            <a href="#how-it-works">
              <button className="btn-outline text-base px-8 py-4">See How It Works</button>
            </a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
          className="relative z-10 mt-14 grid grid-cols-3 gap-px bg-brand-border rounded-2xl overflow-hidden max-w-lg w-full">
          {[{val:50000,suf:'',label:'Students'},{val:2400,suf:'K+',label:'Quizzes Generated'},{val:73,suf:'%',label:'Avg. Score Boost'}].map(({val,suf,label}) => (
            <div key={label} className="bg-brand-bg2 py-5 text-center">
              <div className="font-syne font-black text-3xl text-cyan"><Counter target={val} suffix={suf} /></div>
              <div className="text-xs text-white/30 mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden py-4 border-y border-brand-border bg-brand-bg2">
        <div className="flex gap-12 animate-marquee w-max">
          {[...Array(2)].flatMap(() => ['⚡ Real-time AI Tutoring','📖 Structured Study Sessions','📝 AI Quiz Generation','📊 Progress Analytics','🏆 XP & Badges','🔒 Firebase Auth','🌍 40+ Subjects','👥 Group Study Rooms','🗺️ Learning Paths','🎙️ Voice Q&A'].map(t => (
            <span key={t+Math.random()} className="text-xs font-medium text-white/30 whitespace-nowrap">{t}</span>
          )))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 lg:px-16">
        <div className="reveal max-w-7xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-4">Core Features</p>
          <h2 className="font-syne font-black text-4xl lg:text-6xl leading-tight tracking-tight max-w-lg">
            Everything a student <span className="text-white/30">needs to excel</span>
          </h2>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-3 gap-px bg-brand-border border border-brand-border rounded-2xl overflow-hidden">
          {features.map(({ icon:Icon, color, tag, title, desc }, i) => (
            <motion.div key={title} whileHover={{ backgroundColor:'rgba(255,255,255,0.04)' }}
              className={`reveal bg-brand-bg2 p-8 flex flex-col gap-4 group relative overflow-hidden ${i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}`}
              style={{ transitionDelay:`${i*0.05}s` }}>
              <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background:`linear-gradient(90deg,transparent,${color},transparent)` }} />
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background:`${color}20` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div>
                <h3 className={`font-syne font-bold mb-2 ${i===0 ? 'text-2xl' : 'text-xl'}`}>{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full self-start" style={{ background:`${color}20`, color }}>{tag}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 lg:px-16 bg-brand-bg2">
        <div className="max-w-7xl mx-auto">
          <div className="reveal text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-4">How It Works</p>
            <h2 className="font-syne font-black text-4xl lg:text-6xl tracking-tight">
              From signup to <span className="text-white/30">mastery in 4 steps</span>
            </h2>
            <p className="text-white/40 text-base mt-4 max-w-xl mx-auto">
              BrainNex is designed around a proven learning loop: teach → check → quiz → review. Here's exactly how it works.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {HOW_STEPS.map(({ num, icon, title, desc, detail }, i) => (
              <motion.div key={num}
                whileHover={{ y:-4 }}
                className="reveal glass border border-brand-border rounded-3xl p-7 relative overflow-hidden group"
                style={{ transitionDelay:`${i*0.1}s` }}>
                {/* Big number background */}
                <div className="absolute -top-4 -right-2 font-syne font-black text-[120px] text-white/[0.03] leading-none select-none">
                  {num}
                </div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-3xl flex-shrink-0">
                      {icon}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-cyan uppercase tracking-widest">Step {num}</span>
                      <h3 className="font-syne font-black text-xl leading-tight">{title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-white/55 leading-relaxed mb-4">{desc}</p>
                  <div className="space-y-2">
                    {detail.map(d => (
                      <div key={d} className="flex items-center gap-2 text-xs text-white/50">
                        <CheckCircle size={12} className="text-cyan flex-shrink-0" />{d}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Flow diagram */}
          <div className="reveal mt-12 glass border border-brand-border rounded-2xl p-6">
            <p className="text-xs text-white/30 text-center uppercase tracking-widest mb-5">The BrainNex Learning Loop</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {['📖 AI Lesson Cards','→','✅ Checkpoints','→','📝 End Quiz','→','🏆 XP + Badges','→','📊 Analytics','→','⏰ Revisit Weak Topics','→','📖 Next Lesson'].map((item, i) => (
                item === '→' ? (
                  <ArrowRight key={i} size={14} className="text-white/20" />
                ) : (
                  <div key={i} className="text-xs font-semibold px-3 py-1.5 bg-white/[0.05] border border-brand-border rounded-full text-white/70">
                    {item}
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section id="subjects" className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="reveal mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-4">Subjects</p>
            <h2 className="font-syne font-black text-4xl lg:text-6xl tracking-tight">
              Learn anything, <span className="text-white/30">master everything</span>
            </h2>
          </div>
          <div className="reveal grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {subjects.map(({ emoji, name }) => (
              <motion.div key={name} whileHover={{ y:-4 }}
                className="glass border border-brand-border rounded-2xl p-5 flex flex-col items-center text-center cursor-pointer transition-all hover:border-brand-border2">
                <span className="text-3xl mb-2">{emoji}</span>
                <span className="text-xs font-semibold text-white/70">{name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6 lg:px-16 bg-brand-bg2">
        <div className="max-w-7xl mx-auto">
          <div className="reveal text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-4">Testimonials</p>
            <h2 className="font-syne font-black text-4xl lg:text-6xl tracking-tight">Students love <span className="text-white/30">BrainNex</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, stars, grad }, i) => (
              <motion.div key={name} whileHover={{ borderColor:'rgba(255,255,255,0.15)' }}
                className="reveal glass border border-brand-border rounded-2xl p-8 transition-all" style={{ transitionDelay:`${i*0.1}s` }}>
                <div className="flex gap-0.5 mb-4">{Array.from({length:stars}).map((_,j) => <Star key={j} size={13} className="text-neon-amber fill-neon-amber" />)}</div>
                <p className="text-sm text-white/60 leading-relaxed mb-6">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-sm font-bold text-brand-bg`}>
                    {name.split(' ').map(w=>w[0]).join('')}
                  </div>
                  <div><p className="text-sm font-semibold">{name}</p><p className="text-xs text-white/30">{role}</p></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 lg:px-16 text-center relative overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan/5 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="reveal relative z-10 max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-6">Free to Start</p>
          <h2 className="font-syne font-black text-5xl lg:text-7xl tracking-tight leading-none mb-6">
            Ready to learn<br />with <span className="gradient-text">AI by your side?</span>
          </h2>
          <p className="text-white/50 text-lg mb-10">Join thousands of students using BrainNex to study smarter and score higher.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
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

      {/* FOOTER */}
      <footer className="border-t border-brand-border py-10 px-6 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/images/BrainNex_logo.png" alt="BrainNex" className="w-7 h-7 object-contain" />
          <span className="font-syne font-black text-lg" style={{ background:'linear-gradient(90deg,#00e5ff,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>BrainNex</span>
        </Link>
        <div className="flex gap-6 text-xs text-white/30">
          {['Features','Privacy','Terms','Contact'].map(l => <a key={l} href="#" className="hover:text-white/60 transition-colors">{l}</a>)}
        </div>
        <p className="text-xs text-white/20">© 2025 BrainNex · React · Tailwind · Node.js · Firebase</p>
      </footer>
    </div>
  );
}
