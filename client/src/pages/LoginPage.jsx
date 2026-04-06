// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { Mail, Lock, AlertCircle } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
// import toast from 'react-hot-toast';

// export default function LoginPage() {
//   const { login, loginWithGoogle } = useAuth();
//   const navigate = useNavigate();
//   const [form, setForm] = useState({ email: '', password: '' });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(''); setLoading(true);
//     try {
//       await login(form.email, form.password);
//       toast.success('Welcome back!');
//       navigate('/app/dashboard');
//     } catch (err) {
//       setError('Invalid email or password. Please try again.');
//     } finally { setLoading(false); }
//   };

//   const handleGoogle = async () => {
//     setLoading(true);
//     try {
//       await loginWithGoogle();
//       toast.success('Welcome back!');
//       navigate('/app/dashboard');
//     } catch (err) {
//       setError('Google sign-in failed. Please try again.');
//     } finally { setLoading(false); }
//   };

//   return (
//     <div className="min-h-screen bg-brand-bg flex">
//       {/* Left panel */}
//       <div className="hidden lg:flex flex-col justify-between w-[45%] bg-brand-bg2 border-r border-brand-border p-12 relative overflow-hidden">
//         <div className="absolute inset-0 grid-bg pointer-events-none opacity-50" />
//         <div className="absolute w-80 h-80 rounded-full bg-cyan/10 blur-[80px] -top-20 -left-20" />
//         <div className="absolute w-64 h-64 rounded-full bg-violet-500/10 blur-[80px] bottom-20 right-10" />
//         <Link to="/" className="relative flex items-center gap-2.5 font-syne font-bold text-xl">
//           <div className="w-9 h-9 bg-cyan rounded-xl flex items-center justify-center">
//             <span className="text-brand-bg font-bold">B</span>
//           </div>
//           BrainNex
//         </Link>
//         <div className="relative">
//           <h2 className="font-syne font-black text-4xl leading-tight mb-4">
//             Your AI tutor<br />is waiting for you
//           </h2>
//           <p className="text-white/40 text-sm leading-relaxed">Pick up right where you left off. Your progress, streaks, and personalized learning path are all here.</p>
//           <div className="mt-8 space-y-3">
//             {['Real-time AI tutoring in any subject', 'Adaptive quizzes that match your level', 'Track your progress with visual analytics'].map(t => (
//               <div key={t} className="flex items-center gap-3 text-sm text-white/60">
//                 <span className="w-5 h-5 rounded-full bg-cyan/20 text-cyan flex items-center justify-center text-xs">✓</span>
//                 {t}
//               </div>
//             ))}
//           </div>
//         </div>
//         <p className="relative text-xs text-white/20">Trusted by 50,000+ students across India</p>
//       </div>

//       {/* Right panel */}
//       <div className="flex-1 flex items-center justify-center p-6">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
//           className="w-full max-w-md">
//           <div className="mb-8">
//             <h1 className="font-syne font-black text-3xl mb-2">Welcome back</h1>
//             <p className="text-white/40 text-sm">Sign in to continue your learning journey</p>
//           </div>

//           {error && (
//             <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-red-400">
//               <AlertCircle size={15} /> {error}
//             </div>
//           )}

//           {/* Google */}
//           <button onClick={handleGoogle} disabled={loading}
//             className="w-full flex items-center justify-center gap-3 glass border border-brand-border2 rounded-xl px-4 py-3 text-sm font-medium hover:bg-white/[0.07] transition-all mb-6 disabled:opacity-50">
//             <svg width="18" height="18" viewBox="0 0 24 24">
//               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
//               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
//               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
//               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
//             </svg>
//             Continue with Google
//           </button>

//           <div className="flex items-center gap-3 mb-6">
//             <div className="flex-1 h-px bg-brand-border" />
//             <span className="text-xs text-white/20">or</span>
//             <div className="flex-1 h-px bg-brand-border" />
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="text-xs font-medium text-white/50 mb-1.5 block">Email</label>
//               <div className="relative">
//                 <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
//                 <input type="email" required placeholder="you@example.com"
//                   value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
//                   className="input-dark w-full pl-10" />
//               </div>
//             </div>
//             <div>
//               <label className="text-xs font-medium text-white/50 mb-1.5 block">Password</label>
//               <div className="relative">
//                 <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
//                 <input type="password" required placeholder="••••••••"
//                   value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
//                   className="input-dark w-full pl-10" />
//               </div>
//             </div>
//             <button type="submit" disabled={loading}
//               className="btn-cyan w-full py-3.5 text-sm font-semibold disabled:opacity-50">
//               {loading ? 'Signing in...' : 'Sign In'}
//             </button>
//           </form>

//           <p className="text-center text-sm text-white/30 mt-6">
//             Don't have an account?{' '}
//             <Link to="/register" className="text-cyan hover:underline">Create one free</Link>
//           </p>
//         </motion.div>
//       </div>
//     </div>
//   );
// }


import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import BrainNexLogo from '../components/BrainNexLogo';

export default function LoginPage() {
  const { login, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]                     = useState({ email: '', password: '' });
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [showForgot, setShowForgot]         = useState(false);
  const [forgotEmail, setForgotEmail]       = useState('');
  const [forgotSent, setForgotSent]         = useState(false);
  const [forgotLoading, setForgotLoading]   = useState(false);

  /* ── If already logged in skip login ── */
  if (user) return <Navigate to="/app/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/app/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Welcome back!');
      navigate('/app/dashboard');
    } catch { setError('Google sign-in failed.'); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { toast.error('Enter your email address'); return; }
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotSent(true);
    } catch (err) {
      toast.error(err.code === 'auth/user-not-found' ? 'No account found with this email.' : 'Failed to send reset email.');
    } finally { setForgotLoading(false); }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-brand-bg2 border-r border-brand-border p-12 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none opacity-50" />
        <div className="absolute w-80 h-80 rounded-full bg-cyan/10 blur-[80px] -top-20 -left-20" />
        <div className="absolute w-64 h-64 rounded-full bg-violet-500/10 blur-[80px] bottom-20 right-10" />
        <Link to="/" className="relative"><BrainNexLogo size="lg" /></Link>
        <div className="relative">
          <h2 className="font-syne font-black text-4xl leading-tight mb-4">Your AI tutor<br />is waiting for you</h2>
          <p className="text-white/40 text-sm leading-relaxed">Pick up right where you left off.</p>
          <div className="mt-8 space-y-3">
            {['Real-time AI tutoring in any subject','Adaptive quizzes that match your level','Track your progress with visual analytics'].map(t => (
              <div key={t} className="flex items-center gap-3 text-sm text-white/60">
                <span className="w-5 h-5 rounded-full bg-cyan/20 text-cyan flex items-center justify-center text-xs">✓</span>{t}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/20">Trusted by 50,000+ students</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">

          {/* ── FORGOT PASSWORD ── */}
          {showForgot ? (
            <motion.div key="forgot"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="w-full max-w-md">
              <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}
                className="flex items-center gap-2 text-sm text-white/40 hover:text-white mb-8 transition-colors">
                <ArrowLeft size={16} /> Back to login
              </button>

              {forgotSent ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-neon-green/20 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle size={28} className="text-neon-green" />
                  </div>
                  <h2 className="font-syne font-black text-2xl mb-2">Check your email!</h2>
                  <p className="text-white/40 text-sm mb-1">We sent a reset link to</p>
                  <p className="text-cyan font-semibold text-sm mb-6">{forgotEmail}</p>
                  <p className="text-xs text-white/30">Didn't get it? Check spam or{' '}
                    <button onClick={() => setForgotSent(false)} className="text-cyan hover:underline">try again</button>
                  </p>
                </div>
              ) : (
                <>
                  <h1 className="font-syne font-black text-3xl mb-2">Reset password</h1>
                  <p className="text-white/40 text-sm mb-8">Enter your email to receive a reset link</p>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-white/50 mb-1.5 block">Email address</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                        <input type="email" required placeholder="you@example.com"
                          value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                          className="input-dark w-full pl-10" />
                      </div>
                    </div>
                    <button type="submit" disabled={forgotLoading}
                      className="btn-cyan w-full py-3.5 text-sm font-semibold disabled:opacity-50">
                      {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                </>
              )}
            </motion.div>

          ) : (
            /* ── NORMAL LOGIN ── */
            <motion.div key="login"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }}
              className="w-full max-w-md">
              <div className="mb-8">
                <h1 className="font-syne font-black text-3xl mb-2">Welcome back</h1>
                <p className="text-white/40 text-sm">Sign in to continue your learning journey</p>
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
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-brand-border" />
                <span className="text-xs text-white/20">or email</span>
                <div className="flex-1 h-px bg-brand-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-white/50">Password</label>
                    <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(form.email); }}
                      className="text-xs text-cyan hover:underline">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="password" required placeholder="••••••••"
                      value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="input-dark w-full pl-10" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="btn-cyan w-full py-3.5 text-sm font-semibold disabled:opacity-50">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-sm text-white/30 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-cyan hover:underline">Create one free</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
