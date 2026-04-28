import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrainNexLogo from '../components/BrainNexLogo';

export default function AboutPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg text-white overflow-x-hidden font-inter selection:bg-primary selection:text-white">
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

      <main className="pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="page-title text-4xl sm:text-5xl lg:text-6xl mb-6">About Us</h1>
            <p className="text-xl text-primary font-bold">Empowering every student in India with AI-powered personalised learning</p>
          </div>

          <div className="space-y-12">
            <section className="glass-card bg-brand-bg2 p-8 rounded-3xl border border-white/10 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-4">Our Story</h2>
              <p className="text-txt-sec leading-relaxed">
                It started with a simple thought. AI is booming everywhere — in businesses, in research, in entertainment. But what about students? What about the kid who can't afford a tutor? The one who gets stuck on a concept at midnight with no one to ask?
              </p>
              <p className="text-txt-sec leading-relaxed mt-4">
                That's when it hit me — why not build something that actually helps students learn better using AI?
              </p>
              <p className="text-txt-sec leading-relaxed mt-4">
                I started building BrainNex as a solo project, not knowing exactly where it would go. But as it started taking shape — the AI tutor answering questions, the quizzes adapting to your level, the streaks keeping you motivated — I realised this was something genuinely useful. Something students actually needed.
              </p>
              <p className="text-txt-sec leading-relaxed mt-4">
                The name BrainNex came naturally. Brain — because it's all about learning and knowledge. Nex — because it's the next generation of studying.
              </p>
              <p className="text-txt-sec leading-relaxed mt-4">
                BrainNex is not a company. It's not a startup with a big team and investors. It's one student who believed that every student deserves a personal AI tutor — regardless of where they come from, what school they go to, or how much money they have.
              </p>
              <p className="text-txt-sec leading-relaxed mt-4">
                This is just the beginning.
              </p>
            </section>

            <section className="glass-card bg-brand-bg2 p-8 rounded-3xl border border-white/10 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-4">Tech Stack</h2>
              <p className="text-txt-sec leading-relaxed mb-4">
                I believe in using the best tools to build a seamless and fast experience for students. The platform is built on a modern, robust technology stack:
              </p>
              <ul className="list-disc list-inside text-txt-sec space-y-3 ml-4">
                <li><strong className="text-white">Frontend:</strong> React.js, Vite, Tailwind CSS, Framer Motion</li>
                <li><strong className="text-white">Backend:</strong> Node.js, Express.js</li>
                <li><strong className="text-white">Database:</strong> Firebase Firestore</li>
                <li><strong className="text-white">Auth:</strong> Firebase Authentication</li>
                <li><strong className="text-white">AI Engine:</strong> Anthropic Claude (Haiku) — Powering the AI Tutor, Quiz Generator and Study Sessions</li>
                <li><strong className="text-white">Hosting:</strong> Vercel (Frontend), Render (Backend API)</li>
                <li><strong className="text-white">Domain:</strong> brainnex.app</li>
              </ul>
            </section>

            <div className="text-center mt-16 pt-8 border-t border-white/10">
              <p className="text-2xl font-bold text-white italic">"Built with passion for students."</p>
            </div>
          </div>
        </div>
      </main>

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
              <li><a href="/#pricing-section" className="hover:text-primary transition-colors">Pricing</a></li>
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
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
