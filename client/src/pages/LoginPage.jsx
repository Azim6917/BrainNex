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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background:'var(--bg)' }}>
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="rounded-2xl p-8 max-w-sm w-full text-center border"
        style={{ background:'var(--card)', borderColor:'var(--border)' }}>
        {user.photoURL
          ? <img src={user.photoURL} className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" alt="avatar" />
          : <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-black text-white"
              style={{ background:'linear-gradient(135deg,var(--cyan),var(--violet))' }}>
              {(user.displayName||'S')[0].toUpperCase()}
            </div>}
        <p className="text-sm mb-1" style={{ color:'var(--txt2)' }}>Signed in as</p>
        <p className="font-syne font-bold text-lg mb-1" style={{ color:'var(--txt)' }}>{user.displayName||'Student'}</p>
        <p className="text-xs mb-6" style={{ color:'var(--txt3)' }}>{user.email}</p>
        <div className="flex gap-3">
          <button onClick={() => logout()} className="btn-outline flex-1 text-sm py-2.5">Sign Out</button>
          <button onClick={() => navigate('/app/dashboard')} className="btn-cyan flex-1 text-sm py-2.5">Go to App →</button>
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
    catch { setError('Google sign-in failed.'); }
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

  const inputStyle = { background:'var(--card)', borderColor:'var(--border2)', color:'var(--txt)' };

  return (
    <div className="min-h-screen flex" style={{ background:'var(--bg)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] p-12 relative overflow-hidden border-r"
        style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
        <div className="absolute inset-0 grid-bg pointer-events-none opacity-50" />
        <div className="absolute w-72 h-72 rounded-full blur-[80px] -top-20 -left-20" style={{ background:'var(--cyan-bg)' }} />
        <Link to="/"><BrainNexLogo size="lg" /></Link>
        <div className="relative">
          <h2 className="font-syne font-black text-4xl leading-tight mb-4" style={{ color:'var(--txt)' }}>Your AI tutor<br />is waiting</h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color:'var(--txt2)' }}>Pick up right where you left off.</p>
          {['Real-time AI tutoring in any subject','Adaptive quizzes that match your level','Beautiful progress analytics'].map(t => (
            <div key={t} className="flex items-center gap-3 text-sm mb-2" style={{ color:'var(--txt2)' }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{ background:'var(--cyan-bg)', color:'var(--cyan)' }}>✓</span>{t}
            </div>
          ))}
        </div>
        <p className="relative text-xs" style={{ color:'var(--txt3)' }}>Trusted by 50,000+ students</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {showForgot ? (
            <motion.div key="forgot"
              initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
              className="w-full max-w-md">
              <button onClick={() => { setShowForgot(false); setForgotSent(false); }}
                className="flex items-center gap-2 text-sm mb-8 transition-colors" style={{ color:'var(--txt3)' }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--txt)'} onMouseLeave={e=>e.currentTarget.style.color='var(--txt3)'}>
                <ArrowLeft size={16} /> Back
              </button>
              {forgotSent ? (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background:'rgba(52,211,153,0.15)' }}>
                    <CheckCircle size={24} style={{ color:'var(--green)' }} />
                  </div>
                  <h2 className="font-syne font-black text-2xl mb-2" style={{ color:'var(--txt)' }}>Check your email!</h2>
                  <p className="text-sm mb-1" style={{ color:'var(--txt2)' }}>Reset link sent to</p>
                  <p className="text-sm font-semibold mb-4" style={{ color:'var(--cyan)' }}>{forgotEmail}</p>
                  <button onClick={() => setForgotSent(false)} className="text-xs" style={{ color:'var(--cyan)' }}>Try again</button>
                </div>
              ) : (
                <>
                  <h1 className="font-syne font-black text-3xl mb-2" style={{ color:'var(--txt)' }}>Reset password</h1>
                  <p className="text-sm mb-6" style={{ color:'var(--txt2)' }}>Enter your email to receive a reset link</p>
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:'var(--txt3)' }} />
                      <input type="email" required placeholder="your@email.com"
                        value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)}
                        className="input-dark pl-10 text-sm" />
                    </div>
                    <button type="submit" disabled={forgotLoad} className="btn-cyan w-full py-3 text-sm disabled:opacity-50">
                      {forgotLoad ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="login"
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-30 }}
              className="w-full max-w-md">
              <div className="lg:hidden mb-6"><BrainNexLogo size="md" /></div>
              <h1 className="font-syne font-black text-3xl mb-1" style={{ color:'var(--txt)' }}>Welcome back</h1>
              <p className="text-sm mb-6" style={{ color:'var(--txt2)' }}>Sign in to continue your learning journey</p>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm border"
                  style={{ background:'rgba(248,113,113,0.1)', borderColor:'rgba(248,113,113,0.3)', color:'var(--red)' }}>
                  <AlertCircle size={14} />{error}
                </div>
              )}

              <button onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border mb-5 transition-all disabled:opacity-50"
                style={{ background:'var(--card)', borderColor:'var(--border2)', color:'var(--txt2)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background:'var(--border)' }} />
                <span className="text-xs" style={{ color:'var(--txt3)' }}>or email</span>
                <div className="flex-1 h-px" style={{ background:'var(--border)' }} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color:'var(--txt3)' }}>Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:'var(--txt3)' }} />
                    <input type="email" required placeholder="you@example.com"
                      value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                      className="input-dark pl-10 text-sm" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color:'var(--txt3)' }}>Password</label>
                    <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(form.email); }}
                      className="text-xs" style={{ color:'var(--cyan)' }}>Forgot?</button>
                  </div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:'var(--txt3)' }} />
                    <input type={showPw?'text':'password'} required placeholder="••••••••"
                      value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                      className="input-dark pl-10 pr-10 text-sm" />
                    <button type="button" onClick={()=>setShowPw(s=>!s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color:'var(--txt3)' }}>
                      {showPw?<EyeOff size={14}/>:<Eye size={14}/>}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-cyan w-full py-3 text-sm font-semibold">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-sm mt-5" style={{ color:'var(--txt3)' }}>
                No account? <Link to="/register" className="font-semibold" style={{ color:'var(--cyan)' }}>Create one free</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
