import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { MessageSquare, FileQuestion, BarChart3, Map, Users, Trophy, ArrowRight, Star, CheckCircle, Zap, Target, BookOpen, Flame, Sparkles } from 'lucide-react';
import BrainNexLogo from '../components/BrainNexLogo';

// Dummy universities for marquee
const universities = ['Stanford', 'MIT', 'Harvard', 'Oxford', 'Cambridge', 'Yale', 'Columbia','UCLA', 'Amity University', 'Amity Institute of Technology'];

const features = [
  { icon:MessageSquare, color:'linear-gradient(135deg, #7C3AED, #4F46E5)', title:'AI Chat Tutor', desc:'Real-time adaptive explanations.' },
  { icon:Zap,           color:'linear-gradient(135deg, #0EA5E9, #06B6D4)', title:'Study Flow',   desc:'Structured cards & checkpoints.' },
  { icon:FileQuestion,  color:'linear-gradient(135deg, #EC4899, #E11D48)', title:'Smart Quizzes',desc:'Instantly generated on any topic.' },
  { icon:BarChart3,     color:'linear-gradient(135deg, #F59E0B, #D97706)', title:'Analytics',    desc:'Track mastery and progress visually.' },
  { icon:Map,           color:'linear-gradient(135deg, #10B981, #059669)', title:'Adaptive Path',desc:'AI-generated learning roadmaps.' },
];

const HOW_STEPS = [
  {
    num:'1', icon:<Target size={32} className="text-primary" />, title:'Set Your Goal',
    desc:'Tell BrainNex what you want to learn. Our AI tailors a curriculum just for you based on your grade and objectives.',
  },
  {
    num:'2', icon:<BookOpen size={32} className="text-primary" />, title:'Learn interactively',
    desc:'Study with AI-generated bite-sized cards. When you\'re stuck, simply chat with your personal AI tutor for deeper explanations.',
  },
  {
    num:'3', icon:<FileQuestion size={32} className="text-primary" />, title:'Test & Master',
    desc:'Take personalized quizzes that adapt to your weaknesses. Earn XP, maintain your streak, and level up your knowledge.',
  },
];

const TESTIMONIALS = [
  { name: 'Sarah J.', role: 'High School Senior', text: 'BrainNex helped me boost my math scores by a full letter grade. The AI explanations make perfect sense!', rating: 5 },
  { name: 'Michael T.', role: 'College Freshman', text: 'The smart quizzes and adaptive learning paths feel like having a personal tutor available 24/7.', rating: 5 },
  { name: 'Emily R.', role: 'Middle School Student', text: 'I love earning XP and leveling up. Studying feels like a game now instead of a chore!', rating: 5 }
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page min-h-screen bg-brand-bg text-white overflow-x-hidden selection:bg-primary selection:text-white">

      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3 bg-brand-bg/80 backdrop-blur-xl border-b border-white/10 shadow-sm' : 'py-5 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <BrainNexLogo size="md" />
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-txt2">
            <a href="/#features" className="hover:text-white transition-colors">Features</a>
            <a href="/#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="/#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-txt hover:text-primary-light transition-colors px-4 py-2">Log in</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-5 shadow-glow-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-8 hero-bg">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }} className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-txt2 tracking-wide uppercase">BrainNex 2.0 is live</span>
            </div>
            <h1 className="page-title text-5xl sm:text-6xl lg:text-7xl mb-6">
              Learn faster.<br/>
              Score higher.<br/>
              <span className="gradient-text">Study smarter.</span>
            </h1>
            <p className="text-lg text-txt2 max-w-xl mb-10 leading-relaxed">
              Your personal AI tutor that generates interactive lessons, adaptive quizzes, and visual study paths to help you master any subject.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link to="/register" className="btn-primary text-base">Start Learning Free</Link>
              <a href="/#how-it-works" className="btn-ghost text-base">See how it works</a>
            </div>
            <div className="flex items-center gap-4 text-sm text-txt2">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-space-dark bg-gradient-to-br from-primary to-cyan flex items-center justify-center text-xs font-bold text-white shadow-sm z-[${4-i}]`}>
                    {String.fromCharCode(64+i)}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex text-amber-accent mb-0.5"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/></div>
                <span><strong className="text-white">4.9/5</strong> from 10k+ students</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Mockup */}
          <motion.div initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.8, delay:0.2 }} className="relative z-10 hidden lg:block">
            <div className="relative rounded-2xl border border-white/10 bg-brand-bg2 shadow-[0_0_80px_rgba(124,58,237,0.15)] overflow-hidden transform perspective-1000 rotate-y-[-5deg] rotate-x-[2deg]">
              {/* App Window Header */}
              <div className="h-10 bg-black/40 border-b border-white/5 flex items-center px-4 gap-2 backdrop-blur-md">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <div className="flex-1" />
                <div className="h-5 w-32 bg-white/5 rounded text-center text-[10px] font-bold text-txt-muted flex items-center justify-center tracking-widest uppercase">BrainNex.app</div>
                <div className="flex-1" />
              </div>
              
              {/* App Window Body (CSS Mockup) */}
              <div className="h-[400px] bg-brand-bg flex p-4 gap-4 relative overflow-hidden">
                {/* Sidebar mock */}
                <div className="w-16 flex flex-col gap-3 items-center pt-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cyan mb-4" />
                  {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-xl bg-white/5" />)}
                </div>
                {/* Content mock */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="h-20 rounded-xl bg-gradient-to-r from-primary/20 to-cyan/10 border border-primary/20 p-4 flex flex-col justify-center shadow-inner">
                    <div className="text-white font-bold text-sm flex items-center gap-2">Welcome back, Student! <Sparkles size={16} className="text-amber-400" /></div>
                    <div className="text-txt-sec text-[10px] mt-1 font-medium">You have 2 upcoming study goals this week.</div>
                  </div>
                  <div className="flex gap-4 flex-1">
                    <div className="flex-1 bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col gap-2 shadow-sm">
                      <div className="text-white text-xs font-bold mb-1">Recent Study Sessions</div>
                      {[ 
                        { title: 'Algebra Fundamentals', type: 'Math', pct: '85%' }, 
                        { title: 'Cellular Biology', type: 'Science', pct: '92%' }, 
                        { title: 'World War II', type: 'History', pct: '64%' } 
                      ].map((item, i) => (
                        <div key={i} className="w-full bg-black/20 border border-white/5 rounded-lg p-2.5 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded flex-shrink-0 bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-[10px] font-bold shadow-sm">{item.type.charAt(0)}</div>
                            <span className="text-[10px] text-white font-bold truncate max-w-[80px]">{item.title}</span>
                          </div>
                          <span className="text-[10px] text-cyan font-black">{item.pct}</span>
                        </div>
                      ))}
                    </div>
                    <div className="w-[35%] bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col items-center text-center justify-center gap-3 shadow-sm">
                      <div className="w-16 h-16 rounded-full border-4 border-primary border-t-cyan flex items-center justify-center text-white font-black text-sm shadow-glow-primary">Lv. 5</div>
                      <div>
                        <div className="text-xs font-bold text-white">Scholar</div>
                        <div className="text-[9px] text-txt-sec font-bold mt-1 uppercase tracking-widest">1,250 XP</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Subtle overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
              </div>
              
              {/* Floating elements to make it dynamic */}
              <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-6 top-24 glass-card bg-brand-card p-3 flex items-center gap-3 shadow-lg border border-white/10">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500"><CheckCircle size={16}/></div>
                <div><p className="text-xs font-bold text-white">Quiz Passed!</p><p className="text-[10px] text-txt-sec">+50 XP Earned</p></div>
              </motion.div>
              <motion.div animate={{ y: [10, -10, 10] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-6 bottom-16 glass-card bg-brand-card p-3 flex items-center gap-3 shadow-lg border border-white/10">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-sm"><Flame size={16} /></div>
                <div><p className="text-xs font-bold text-white">12 Day Streak</p></div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="py-8 border-y border-white/5 bg-white/[0.02] overflow-hidden">
        <p className="text-center text-xs font-semibold text-txt3 uppercase tracking-widest mb-6">Trusted by students from</p>
        <div className="flex gap-16 animate-marquee w-max opacity-40 hover:opacity-80 transition-opacity">
          {[...universities, ...universities, ...universities].map((uni, i) => (
            <span key={i} className="text-xl font-sans font-bold text-white whitespace-nowrap">{uni}</span>
          ))}
        </div>
      </div>

      {/* FEATURES (Dark Theme) */}
      <section id="features" className="py-24 px-6 lg:px-8 bg-brand-bg relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-sans font-extrabold text-4xl lg:text-5xl tracking-tight mb-4 text-white">Unleash your potential</h2>
            <p className="text-lg text-txt-sec font-medium">Everything you need to master any topic, beautifully integrated into one platform.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] glass-card bg-brand-card p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-white/5">
                <div className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg" style={{ background: f.color }}>
                  <f.icon size={24} />
                </div>
                <h3 className="font-sans font-extrabold text-2xl mb-3 text-white">{f.title}</h3>
                <p className="text-txt-sec font-medium text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-32 px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="page-title mb-4">How BrainNex works</h2>
            <p className="text-lg text-txt2 max-w-2xl mx-auto">A seamless loop designed to optimize retention and understanding.</p>
          </div>
          
          <div className="relative">
            {/* Dashed line connecting steps (desktop) */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-white/10" />
            
            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {HOW_STEPS.map((step, i) => (
                <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.2 }}
                  className="flex flex-col items-center text-center group">
                  <div className="w-24 h-24 rounded-full bg-brand-bg2 border-4 border-brand-bg flex items-center justify-center text-4xl mb-6 shadow-glow-card group-hover:scale-110 transition-transform duration-300 relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-cyan opacity-20" />
                    <span className="relative z-10">{step.icon}</span>
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold shadow-sm">{step.num}</div>
                  </div>
                  <h3 className="font-sans font-bold text-2xl mb-3">{step.title}</h3>
                  <p className="text-txt2 text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 px-6 lg:px-8 bg-brand-bg relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-sans font-extrabold text-4xl lg:text-5xl tracking-tight mb-4 text-white">Loved by Students</h2>
            <p className="text-lg text-txt-sec font-medium">Join thousands who have already transformed their learning experience.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                className="glass-card bg-brand-card p-8 rounded-2xl shadow-lg border border-white/5 flex flex-col justify-between hover:shadow-xl transition-all hover:-translate-y-2">
                <div>
                  <div className="flex text-amber-500 mb-6 gap-1">
                    {[...Array(t.rating)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-white text-lg italic leading-relaxed mb-6">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-cyan flex items-center justify-center text-white font-bold shadow-sm text-xl border-2 border-brand-bg">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{t.name}</h4>
                    <p className="text-[10px] font-bold text-txt-sec uppercase tracking-widest mt-1">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto relative group cursor-pointer">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-cyan to-primary rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <div className="relative glass-card bg-brand-bg2 p-12 sm:p-16 text-center overflow-hidden rounded-[30px] border border-white/10">
            <h2 className="font-sans font-extrabold text-4xl sm:text-5xl mb-4 text-white">Ready to ace your exams?</h2>
            <p className="text-lg text-txt2 mb-10 max-w-xl mx-auto">Join BrainNex today and experience the future of personalized learning.</p>
            <Link to="/register" className="btn-primary text-lg px-12 py-5 shadow-glow-primary inline-flex">
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing-section" className="py-24 px-6 lg:px-8 bg-brand-bg relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="glass-card bg-brand-bg2 p-8 md:p-12 rounded-3xl border border-white/10 shadow-lg text-center">
            <h2 className="font-sans font-extrabold text-3xl md:text-4xl tracking-tight mb-4 text-white">Pricing plans coming soon</h2>
            <p className="text-lg text-txt-sec font-medium mb-8 max-w-2xl mx-auto">I'm working on transparent and student-friendly pricing. Stay tuned!</p>
            <div className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="email" placeholder="Enter your email to get notified" className="input-field py-3 px-4 text-sm flex-1 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary transition-colors" />
                <button className="btn-primary py-3 px-6 text-sm rounded-xl font-bold whitespace-nowrap shadow-glow-primary">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-brand-bg2 pt-16 pb-8 px-6 lg:px-8 text-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <BrainNexLogo size="sm" />
            <p className="text-txt3 mt-4 leading-relaxed">Your personal AI tutor. Study smarter, retain more, and crush your goals.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Product</h4>
            <ul className="space-y-3 text-txt2">
              <li><a href="/#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><button onClick={() => { document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-primary transition-colors text-left w-full">Pricing</button></li>
              <li><a href="/#testimonials" className="hover:text-primary transition-colors">Testimonials</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Company</h4>
            <ul className="space-y-3 text-txt2">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Stay Updated</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Email address" className="input-field py-2 px-3 text-sm bg-white/5 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-white w-full" />
              <button className="btn-primary py-2 px-4 text-sm rounded-xl font-bold">Subscribe</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-txt3 text-xs pt-8 border-t border-white/5">
          <p>© 2026 BrainNex Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>

          </div>
        </div>
      </footer>
    </div>
  );
}
