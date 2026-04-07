import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Camera, Save, CheckCircle, AlertCircle, Palette, Shield, Trophy, Eye, EyeOff } from 'lucide-react';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import toast from 'react-hot-toast';
import AchievementsPage from './AchievementsPage';

const TABS = [
  { id:'profile',       label:'Profile',      icon: User    },
  { id:'security',      label:'Security',     icon: Shield  },
  { id:'achievements',  label:'Achievements', icon: Trophy  },
  { id:'prefs',         label:'Preferences',  icon: Palette },
];

/* ── Profile Tab ── */
function ProfileTab({ user, profile, onSaved }) {
  const [form, setForm]       = useState({ displayName: user?.displayName||'', phone:'', bio:'' });
  const [photoURL, setPhotoURL] = useState(user?.photoURL || localStorage.getItem(`brainnex-photo-${user?.uid}`) || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef          = useRef(null);

  useEffect(() => {
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setForm(f => ({ ...f, displayName: d.displayName||user.displayName||'', phone: d.phone||'', bio: d.bio||'' }));
        const savedPhoto = d.photoURL || localStorage.getItem(`brainnex-photo-${user.uid}`) || '';
        setPhotoURL(savedPhoto);
      }
    }).catch(() => {});
  }, [user]);

  // Handle file upload — convert to base64, store in localStorage
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image too large. Max 2MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setPhotoURL(base64);
      // Store in localStorage (free, no server)
      localStorage.setItem(`brainnex-photo-${user.uid}`, base64);
      toast.success('Photo selected! Save profile to apply.');
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.displayName.trim()) { toast.error('Name cannot be empty'); return; }
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: form.displayName.trim(), photoURL: photoURL || null });
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName.trim(),
        photoURL:    photoURL || null,
        phone:       form.phone.trim(),
        bio:         form.bio.trim(),
      });
      toast.success('Profile updated!');
      onSaved();
    } catch (err) {
      toast.error('Update failed: ' + (err.message || 'Try again'));
    } finally { setLoading(false); }
  };

  const initials = (form.displayName||'S').split(' ').map(w=>w[0]).join('').toUpperCase().substring(0,2);

  return (
    <div className="space-y-5 max-w-md">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          {photoURL
            ? <img src={photoURL} alt="avatar" className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-border2" onError={() => setPhotoURL('')} />
            : <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black font-syne text-brand-bg"
                style={{ background:'linear-gradient(135deg,#00e5ff,#a78bfa)' }}>{initials}</div>
          }
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-cyan flex items-center justify-center border-2 border-brand-bg">
            <Camera size={13} className="text-brand-bg" />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
        <div>
          <p className="font-syne font-bold text-lg">{form.displayName||'Your Name'}</p>
          <p className="text-xs text-white/40">{user?.email}</p>
          <button onClick={() => fileInputRef.current?.click()}
            className="mt-1.5 text-xs text-cyan hover:underline flex items-center gap-1">
            <Camera size={11} />Click photo to upload from PC
          </button>
          <p className="text-[10px] text-white/20 mt-0.5">JPG, PNG, WebP · Max 2MB</p>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-white/50 mb-1.5 block">Display Name</label>
        <div className="relative">
          <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName:e.target.value }))}
            className="input-dark w-full text-sm pl-10" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-white/50 mb-1.5 block">Phone <span className="text-white/20">(optional)</span></label>
        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone:e.target.value }))}
          placeholder="+91 98765 43210" className="input-dark w-full text-sm" />
      </div>

      <div>
        <label className="text-xs font-medium text-white/50 mb-1.5 block">Bio <span className="text-white/20">(optional)</span></label>
        <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio:e.target.value }))}
          placeholder="Grade, school, goals..." rows={3} className="input-dark w-full text-sm resize-none" />
      </div>

      <div className="text-xs text-white/30 bg-white/[0.03] border border-brand-border rounded-xl p-3">
        📸 Profile photos are stored on your device (no server cost). They appear in the sidebar and app.
      </div>

      <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.97 }}
        onClick={save} disabled={loading}
        className="btn-cyan flex items-center gap-2 py-3 px-6 disabled:opacity-50 text-sm font-semibold">
        {loading ? <><div className="w-4 h-4 border-2 border-brand-bg/40 border-t-brand-bg rounded-full animate-spin" />Saving...</>
          : <><Save size={15} />Save Profile</>}
      </motion.button>
    </div>
  );
}

/* ── Security Tab ── */
function SecurityTab({ user }) {
  const [emailForm, setEmailForm] = useState({ newEmail:'', currentPassword:'' });
  const [passForm,  setPassForm]  = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [showPw,    setShowPw]    = useState({});
  const [eLoad,     setELoad]     = useState(false);
  const [pLoad,     setPLoad]     = useState(false);
  const isGoogle = user?.providerData?.[0]?.providerId === 'google.com';

  if (isGoogle) return (
    <div className="max-w-md glass border border-brand-border rounded-2xl p-5 flex items-start gap-3">
      <svg width="24" height="24" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <div>
        <p className="font-semibold text-sm mb-1">Signed in with Google</p>
        <p className="text-xs text-white/40 leading-relaxed">Manage your email and password at myaccount.google.com</p>
      </div>
    </div>
  );

  const handleUpdateEmail = async (e) => {
    e.preventDefault(); setELoad(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, emailForm.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updateEmail(auth.currentUser, emailForm.newEmail.trim());
      toast.success('Email updated!'); setEmailForm({ newEmail:'', currentPassword:'' });
    } catch (err) {
      if (err.code==='auth/wrong-password') toast.error('Wrong current password.');
      else if (err.code==='auth/email-already-in-use') toast.error('Email already in use.');
      else toast.error('Failed to update email.');
    } finally { setELoad(false); }
  };

  const handleUpdatePass = async (e) => {
    e.preventDefault();
    if (passForm.newPassword.length < 8) { toast.error('Min 8 characters'); return; }
    if (passForm.newPassword !== passForm.confirm) { toast.error("Passwords don't match"); return; }
    setPLoad(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, passForm.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, passForm.newPassword);
      toast.success('Password updated!'); setPassForm({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) {
      toast.error(err.code==='auth/wrong-password' ? 'Wrong current password.' : 'Failed to update password.');
    } finally { setPLoad(false); }
  };

  const PwInput = ({ field, placeholder, formState, setFormState }) => (
    <div className="relative">
      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
      <input type={showPw[field] ? 'text' : 'password'} required placeholder={placeholder}
        value={formState[field]} onChange={e => setFormState(f => ({ ...f, [field]:e.target.value }))}
        className="input-dark w-full text-sm pl-10 pr-10" />
      <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]:!p[field] }))}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
        {showPw[field] ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-md">
      <div className="glass border border-brand-border rounded-2xl p-5">
        <h3 className="font-syne font-bold text-sm mb-4 flex items-center gap-2"><Mail size={14} className="text-cyan" />Change Email</h3>
        <form onSubmit={handleUpdateEmail} className="space-y-3">
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="email" required placeholder="New email" value={emailForm.newEmail}
              onChange={e => setEmailForm(f => ({ ...f, newEmail:e.target.value }))} className="input-dark w-full text-sm pl-10" />
          </div>
          <PwInput field="currentPassword" placeholder="Current password to confirm" formState={emailForm} setFormState={setEmailForm} />
          <button type="submit" disabled={eLoad} className="btn-cyan py-2.5 px-5 text-sm disabled:opacity-50">
            {eLoad ? 'Updating...' : 'Update Email'}
          </button>
        </form>
      </div>

      <div className="glass border border-brand-border rounded-2xl p-5">
        <h3 className="font-syne font-bold text-sm mb-4 flex items-center gap-2"><Lock size={14} className="text-neon-amber" />Change Password</h3>
        <form onSubmit={handleUpdatePass} className="space-y-3">
          <PwInput field="currentPassword" placeholder="Current password"      formState={passForm} setFormState={setPassForm} />
          <PwInput field="newPassword"     placeholder="New password (min 8)"  formState={passForm} setFormState={setPassForm} />
          <PwInput field="confirm"         placeholder="Confirm new password"  formState={passForm} setFormState={setPassForm} />
          {passForm.newPassword && passForm.confirm && (
            <div className={`flex items-center gap-1.5 text-xs ${passForm.newPassword===passForm.confirm ? 'text-neon-green' : 'text-red-400'}`}>
              {passForm.newPassword===passForm.confirm ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
              {passForm.newPassword===passForm.confirm ? 'Passwords match' : 'Passwords do not match'}
            </div>
          )}
          <button type="submit" disabled={pLoad} className="btn-cyan py-2.5 px-5 text-sm disabled:opacity-50">
            {pLoad ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Preferences Tab (actually working) ── */
function PrefsTab() {
  const PREF_KEY = 'brainnex-prefs';
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { return {}; }
  });

  const toggle = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem(PREF_KEY, JSON.stringify(updated));
    toast.success(`${updated[key] ? 'Enabled' : 'Disabled'} ${key.replace(/([A-Z])/g,' $1').toLowerCase()}`);
  };

  const options = [
    { key:'autoSaveChat',    label:'Auto-save Chat History',  desc:'Save AI tutor conversations (uses your device storage)', works:true },
    { key:'showHints',       label:'Show Quiz Hints',         desc:'Show hint button during quizzes',                       works:true },
    { key:'showXPAnimation', label:'XP Gain Notifications',  desc:'Show toast notification when you earn XP',              works:true },
    { key:'streakReminder',  label:'Daily Streak Reminder',   desc:'Browser reminder to study daily (requires permission)', works:true },
    { key:'soundEffects',    label:'Sound Effects',           desc:'Coming soon — browser audio API in development',        works:false },
  ];

  // Streak reminder using browser Notification API
  useEffect(() => {
    if (prefs.streakReminder) {
      if ('Notification' in window) {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') toast.success('Streak reminders enabled! You\'ll be notified daily.');
          else toast.error('Please allow notifications in browser settings.');
        });
      }
    }
  }, [prefs.streakReminder]);

  return (
    <div className="max-w-md space-y-3">
      {options.map(({ key, label, desc, works }) => (
        <div key={key}
          className={`flex items-center justify-between p-4 glass border border-brand-border rounded-xl transition-all ${works ? 'hover:border-brand-border2' : 'opacity-60'}`}>
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-sm font-medium flex items-center gap-2">
              {label}
              {!works && <span className="text-[9px] px-1.5 py-0.5 bg-white/[0.06] text-white/30 rounded-full">Coming soon</span>}
            </p>
            <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{desc}</p>
          </div>
          <button onClick={() => works && toggle(key)} disabled={!works}
            className={`w-11 h-6 rounded-full transition-all flex-shrink-0 relative disabled:cursor-not-allowed ${prefs[key] ? 'bg-cyan' : 'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${prefs[key] ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
      ))}
      <p className="text-xs text-white/20 pt-2">All preferences stored on your device — free, no server needed.</p>
    </div>
  );
}

/* ── Main Settings Page ── */
export default function SettingsPage() {
  const { user }                      = useAuth();
  const { profile, refreshProfile }   = useUserData();
  const [activeTab, setActiveTab]     = useState('profile');

  if (activeTab === 'achievements') return (
    <div>
      <div className="flex items-center gap-3 px-4 md:px-6 lg:px-8 pt-4 pb-0 lg:pt-6">
        <div className="flex gap-1 p-1 glass border border-brand-border rounded-2xl w-full overflow-x-auto">
          {TABS.map(({ id, label, icon:Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all ${activeTab===id ? 'bg-cyan/20 text-cyan border border-cyan/30' : 'text-white/50 hover:text-white'}`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
      </div>
      <AchievementsPage />
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
        <h1 className="font-syne font-black text-2xl md:text-3xl mb-1 pt-10 lg:pt-0">Settings</h1>
        <p className="text-white/40 text-sm mb-6">Manage your profile, security, and preferences</p>
      </motion.div>

      <div className="flex gap-1 p-1 glass border border-brand-border rounded-2xl mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon:Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all ${activeTab===id ? 'bg-cyan/20 text-cyan border border-cyan/30' : 'text-white/50 hover:text-white'}`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}>
        {activeTab === 'profile'  && <ProfileTab user={user} profile={profile} onSaved={refreshProfile} />}
        {activeTab === 'security' && <SecurityTab user={user} />}
        {activeTab === 'prefs'    && <PrefsTab />}
      </motion.div>
    </div>
  );
}
