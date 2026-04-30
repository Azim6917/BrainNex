import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import BrainNexLogo from '../components/BrainNexLogo';

export default function RegisterPage() {
  const { register, loginWithGoogle, user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]           = useState({ name:'', email:'', password:'', confirm:'' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);



  const checks = [
    { label:'At least 8 characters',  ok: form.password.length >= 8 },
    { label:'Contains a number',       ok: /\d/.test(form.password) },
    { label:'Passwords match',         ok: form.password === form.confirm && form.confirm.length > 0 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    try {
      await register(form.email, form.password, form.name);
      toast.success('Account created! Welcome to BrainNex 🧠');
      // Navigate to dashboard — onboarding shown there if needed
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.code==='auth/email-already-in-use' ? 'This email is already registered.' : 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Welcome to BrainNex! 🧠');
      navigate('/app/dashboard');
    } catch (err) { 
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/unauthorized-domain') {
        setError('Google Auth is not configured in Firebase. Please use Email/Password registration below.');
      } else {
        setError(`Google sign-in failed: ${err.message}`); 
      }
    }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-space-dark">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden bg-space-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,229,255,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[100px] -top-40 -left-40 bg-primary/10 pointer-events-none" />
        <Link to="/" className="relative z-10"><BrainNexLogo size="lg" /></Link>
        <div className="relative z-10">
          <h2 className="font-jakarta font-black text-5xl leading-[1.1] mb-6 text-txt">Start your AI<br />learning journey</h2>
          <p className="text-base font-medium text-txt2 leading-relaxed mb-10 max-w-sm">Create your free account and get instant access to all premium learning features.</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon:'🤖', label:'AI Tutor',      sub:'Available 24/7' },
              { icon:'📝', label:'Smart Quizzes', sub:'Any topic, instant' },
              { icon:'📖', label:'Study Sessions',sub:'Learn then quiz' },
              { icon:'🏆', label:'Gamification',  sub:'XP, streaks, badges' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="glass-card p-5 border border-white/5 shadow-sm hover:-translate-y-1 transition-transform">
                <div className="text-3xl mb-3 drop-shadow-sm">{icon}</div>
                <div className="text-sm font-bold text-txt mb-1">{label}</div>
                <div className="text-[10px] font-bold text-txt3 uppercase tracking-wider">{sub}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-[10px] font-bold text-txt3 uppercase tracking-widest">Free forever · No credit card required</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-y-auto custom-scrollbar">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.05),transparent_70%)] pointer-events-none" />
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="w-full max-w-md p-8 md:p-10 relative z-10 glass-card shadow-2xl">
          <div className="lg:hidden mb-10 flex justify-center"><BrainNexLogo size="md" /></div>
          
          <div className="text-center mb-10">
            <h1 className="font-jakarta font-black text-4xl mb-3 text-txt">Create account</h1>
            <p className="text-sm font-medium text-txt2">Join students learning better with AI</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 mb-6 text-sm font-bold text-red-500 shadow-sm">
              <AlertCircle size={18} className="flex-shrink-0" />{error}
            </div>
          )}

          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 px-5 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 mb-6">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-bold text-txt3 uppercase tracking-widest">Or register with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            <div>
              <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest mb-2 block">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
                <input type="text" required placeholder="Aryan Kumar"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))}
                  className="input-field w-full pl-12 text-sm py-3.5 bg-space-900 border-white/5" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest mb-2 block">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
                <input type="email" required placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email:e.target.value }))}
                  className="input-field w-full pl-12 text-sm py-3.5 bg-space-900 border-white/5" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest mb-2 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
                <input type={showPw ? 'text' : 'password'} required placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password:e.target.value }))}
                  className="input-field w-full pl-12 pr-12 text-sm py-3.5 bg-space-900 border-white/5" />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-txt3 hover:text-txt transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-3 space-y-2 px-1">
                  {checks.map(({ label, ok }) => (
                    <div key={label} className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${ok ? 'text-green-500' : 'text-txt3'}`}>
                      <CheckCircle size={12} className={ok ? "text-green-500" : "opacity-40"} />{label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest mb-2 block">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
                <input type={showCf ? 'text' : 'password'} required placeholder="••••••••"
                  value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm:e.target.value }))}
                  className="input-field w-full pl-12 pr-12 text-sm py-3.5 bg-space-900 border-white/5" />
                <button type="button" onClick={() => setShowCf(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-txt3 hover:text-txt transition-colors">
                  {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-4 text-base font-bold shadow-glow-primary mt-4 disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-txt3 mt-8">
            Already have an account? <Link to="/login" className="font-bold text-primary hover:text-primary-light transition-colors ml-1">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
