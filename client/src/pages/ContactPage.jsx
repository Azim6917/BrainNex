import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import BrainNexLogo from '../components/BrainNexLogo';

export default function ContactPage() {
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [status, setStatus] = useState({ submitting: false, success: false, error: null });

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, success: false, error: null });
    
    try {
      await addDoc(collection(db, 'contactSubmissions'), {
        ...formData,
        timestamp: serverTimestamp(),
      });
      setStatus({ submitting: false, success: true, error: null });
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    } catch (error) {
      console.error('Error submitting form: ', error);
      setStatus({ submitting: false, success: false, error: 'There was an error submitting your message. Please try again.' });
    }
  };

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
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="page-title text-4xl sm:text-5xl mb-4">Contact Us</h1>
            <p className="text-lg text-txt-sec">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          </div>

          <div className="glass-card bg-brand-bg2 p-8 md:p-10 rounded-3xl border border-white/10 shadow-lg">
            {status.success ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-txt-sec">Thanks for reaching out! We will get back to you within 24 hours.</p>
                <button onClick={() => setStatus({ ...status, success: false })} className="mt-8 btn-ghost">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-txt2 mb-2">Name</label>
                    <input 
                      required 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full input-field py-3 px-4 bg-white/5 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-white transition-colors" 
                      placeholder="Your Name" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-txt2 mb-2">Email</label>
                    <input 
                      required 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full input-field py-3 px-4 bg-white/5 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-white transition-colors" 
                      placeholder="you@example.com" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-txt2 mb-2">Subject</label>
                  <select 
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full input-field py-3 px-4 bg-white/5 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-white transition-colors appearance-none"
                  >
                    <option value="General Inquiry" className="bg-brand-bg2 text-white">General Inquiry</option>
                    <option value="Bug Report" className="bg-brand-bg2 text-white">Bug Report</option>
                    <option value="Feature Request" className="bg-brand-bg2 text-white">Feature Request</option>
                    <option value="Partnership" className="bg-brand-bg2 text-white">Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-txt2 mb-2">Message</label>
                  <textarea 
                    required 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5} 
                    className="w-full input-field py-3 px-4 bg-white/5 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-white transition-colors resize-y" 
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                {status.error && (
                  <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    {status.error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={status.submitting} 
                  className={`w-full btn-primary py-4 rounded-xl font-bold text-lg shadow-glow-primary ${status.submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {status.submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-brand-bg2 pt-16 pb-8 px-6 lg:px-8 text-sm mt-auto">
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
