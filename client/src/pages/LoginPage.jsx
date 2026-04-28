import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import BrainNexLogo from '../components/BrainNexLogo';

export default function LoginPage() {
  const { login, loginWithGoogle, user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]                   = useState({ email:'', password:'' });
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [showPw, setShowPw]               = useState(false);
  const [showForgot, setShowForgot]       = useState(false);
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotSent, setForgotSent]       = useState(false);
  const [forgotLoad, setForgotLoad]       = useState(false);

  /* Already logged in */
  if (user) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-space-dark">
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="glass-card p-8 max-w-sm w-full text-center shadow-2xl border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none" />
        <div className="relative z-10">
          {user.photoURL
            ? <img src={user.photoURL} className="w-20 h-20 rounded-2xl mx-auto mb-5 object-cover border-2 border-primary/30 shadow-sm" alt="avatar" />
            : <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl font-jakarta font-black text-white shadow-sm"
                style={{ background:'linear-gradient(135deg,var(--primary),var(--cyan))' }}>
                {(user.displayName||'S')[0].toUpperCase()}
              </div>}
          <p className="text-xs font-bold text-txt3 uppercase tracking-widest mb-1">Signed in as</p>
          <p className="font-jakarta font-black text-2xl mb-1 text-txt">{user.displayName||'Student'}</p>
          <p className="text-sm font-medium text-txt2 mb-8">{user.email}</p>
          <div className="flex gap-4">
            <button onClick={() => logout()} className="btn-outline flex-1 py-3 text-sm bg-space-800">Sign Out</button>
            <button onClick={() => navigate('/app/dashboard')} className="btn-primary flex-1 py-3 text-sm shadow-glow-primary">Go to App →</button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email, form.password); toast.success('Welcome back!'); navigate('/app/dashboard'); }
    catch { setError('Invalid email or password.'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try { await loginWithGoogle(); toast.success('Welcome back!'); navigate('/app/dashboard'); }
    catch (err) { 
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/unauthorized-domain') {
        setError('Google Auth is not configured in Firebase. Please use Email/Password sign in below.');
      } else {
        setError(`Google sign-in failed: ${err.message}`); 
      }
    }
    finally { setLoading(false); }
  };

  const handleForgot = async e => {
    e.preventDefault();
    if (!forgotEmail.trim()) { toast.error('Enter your email'); return; }
    setForgotLoad(true);
    try { await sendPasswordResetEmail(auth, forgotEmail.trim()); setForgotSent(true); }
    catch (err) { toast.error(err.code==='auth/user-not-found'?'No account with this email.':'Failed. Try again.'); }
    finally { setForgotLoad(false); }
  };

  return (
    <div className="min-h-screen flex bg-space-dark">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden bg-space-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[100px] -top-40 -left-40 bg-cyan/10 pointer-events-none" />
        <Link to="/" className="relative z-10"><BrainNexLogo size="lg" /></Link>
        <div className="relative z-10">
          <h2 className="font-jakarta font-black text-5xl leading-[1.1] mb-6 text-txt">Your AI tutor<br />is waiting</h2>
          <p className="text-base font-medium text-txt2 leading-relaxed mb-10 max-w-sm">Pick up right where you left off and continue your personalized learning journey.</p>
          <div className="space-y-4">
            {['Real-time AI tutoring in any subject','Adaptive quizzes that match your level','Beautiful progress analytics'].map(t => (
              <div key={t} className="flex items-center gap-4 text-sm font-bold text-txt2">
                <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center flex-shrink-0 shadow-sm">✓</span>{t}
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-[10px] font-bold text-txt3 uppercase tracking-widest">Trusted by 50,000+ students globally</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.05),transparent_70%)] pointer-events-none" />
        <AnimatePresence mode="wait">
          {showForgot ? (
            <motion.div key="forgot"
              initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
              className="w-full max-w-md relative z-10">
              <button onClick={() => { setShowForgot(false); setForgotSent(false); }}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-txt3 hover:text-txt mb-10 transition-colors bg-space-800 px-4 py-2 rounded-lg border border-white/5 w-fit">
                <ArrowLeft size={14} /> Back to Login
              </button>
              {forgotSent ? (
                <div className="text-center glass-card p-10">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-500/30">
                    <CheckCircle size={32} />
                  </div>
                  <h2 className="font-jakarta font-black text-3xl mb-3 text-txt">Check your email!</h2>
                  <p className="text-sm font-medium text-txt2 mb-2">Reset link sent to</p>
                  <p className="text-base font-bold text-cyan mb-8">{forgotEmail}</p>
                  <button onClick={() => setForgotSent(false)} className="text-xs font-bold text-txt3 uppercase tracking-widest hover:text-txt transition-colors">Try another email</button>
                </div>
              ) : (
                <div className="glass-card p-8 md:p-10">
                  <h1 className="font-jakarta font-black text-3xl mb-3 text-txt">Reset Password</h1>
                  <p className="text-sm font-medium text-txt2 mb-8">Enter your email to receive a reset link</p>
                  <form onSubmit={handleForgot} className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest mb-2 block">Email Address</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
                        <input type="email" required placeholder="you@example.com"
                          value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)}
                          className="input-field pl-12 text-sm py-3.5" />
                      </div>
                    </div>
                    <button type="submit" disabled={forgotLoad} className="btn-cyan w-full py-4 text-base font-bold shadow-glow-cyan disabled:opacity-50">
                      {forgotLoad ? 'Sending Link...' : 'Send Reset Link'}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="login"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-30 }}
              className="w-full max-w-md relative z-10 glass-card p-8 md:p-10 shadow-2xl">
              <div className="lg:hidden mb-10 flex justify-center"><BrainNexLogo size="md" /></div>
              
              <div className="text-center mb-10">
                <h1 className="font-jakarta font-black text-4xl mb-3 text-txt">Welcome back</h1>
                <p className="text-sm font-medium text-txt2">Sign in to continue your learning journey</p>
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
                <span className="text-[10px] font-bold text-txt3 uppercase tracking-widest">Or sign in with email</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                <div>
                  <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
                    <input type="email" required placeholder="you@example.com"
                      value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                      className="input-field pl-12 text-sm py-3.5 bg-space-900 border-white/5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest block">Password</label>
                    <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(form.email); }}
                      className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-primary-light transition-colors">Forgot?</button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
                    <input type={showPw?'text':'password'} required placeholder="••••••••"
                      value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                      className="input-field pl-12 pr-12 text-sm py-3.5 bg-space-900 border-white/5" />
                    <button type="button" onClick={()=>setShowPw(s=>!s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-txt3 hover:text-txt transition-colors">
                      {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base font-bold shadow-glow-primary mt-2 disabled:opacity-50">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-sm font-medium text-txt3 mt-8">
                Don't have an account? <Link to="/register" className="font-bold text-primary hover:text-primary-light transition-colors ml-1">Create one free</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
