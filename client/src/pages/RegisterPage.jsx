import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checks = [
    { label: 'At least 8 characters',    ok: form.password.length >= 8 },
    { label: 'Contains a number',         ok: /\d/.test(form.password) },
    { label: 'Passwords match',           ok: form.password === form.confirm && form.confirm.length > 0 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    try {
      await register(form.email, form.password, form.name);
      toast.success('Account created! Welcome to BrainNex 🧠');
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'This email is already registered.' : 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Welcome to BrainNex! 🧠');
      navigate('/app/dashboard');
    } catch { setError('Google sign-in failed.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-brand-bg2 border-r border-brand-border p-12 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none opacity-50" />
        <div className="absolute w-80 h-80 rounded-full bg-neon-amber/8 blur-[80px] -top-20 -left-20" />
        <Link to="/" className="relative flex items-center gap-2.5 font-syne font-bold text-xl">
          <div className="w-9 h-9 bg-cyan rounded-xl flex items-center justify-center">
            <span className="text-brand-bg font-bold">B</span>
          </div>
          BrainNex
        </Link>
        <div className="relative">
          <h2 className="font-syne font-black text-4xl leading-tight mb-4">
            Start your AI<br />learning journey today
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8">Create your free account and get instant access to all features — no credit card required.</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '🤖', label: 'AI Tutor', sub: 'Available 24/7' },
              { icon: '📝', label: 'Smart Quizzes', sub: 'Any topic, any time' },
              { icon: '📊', label: 'Analytics', sub: 'Track your growth' },
              { icon: '🏆', label: 'Gamification', sub: 'XP, streaks, badges' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="glass border border-brand-border rounded-xl p-4">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-sm font-semibold">{label}</div>
                <div className="text-xs text-white/30">{sub}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/20">Free forever · No credit card needed</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-8">
          <div className="mb-8">
            <h1 className="font-syne font-black text-3xl mb-2">Create your account</h1>
            <p className="text-white/40 text-sm">Join 50,000+ students learning with AI</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 text-sm text-red-400">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 glass border border-brand-border2 rounded-xl px-4 py-3 text-sm font-medium hover:bg-white/[0.07] transition-all mb-5 disabled:opacity-50">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-brand-border" />
            <span className="text-xs text-white/20">or</span>
            <div className="flex-1 h-px bg-brand-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="text" required placeholder="Aryan Kumar"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-dark w-full pl-10" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="email" required placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-dark w-full pl-10" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="password" required placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-dark w-full pl-10" />
              </div>
              {form.password && (
                <div className="mt-2 space-y-1">
                  {checks.map(({ label, ok }) => (
                    <div key={label} className={`flex items-center gap-2 text-xs ${ok ? 'text-neon-green' : 'text-white/30'}`}>
                      <CheckCircle size={11} /> {label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="password" required placeholder="••••••••"
                  value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  className="input-dark w-full pl-10" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-cyan w-full py-3.5 text-sm font-semibold disabled:opacity-50 mt-2">
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-sm text-white/30 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
