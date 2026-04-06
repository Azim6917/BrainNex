import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Lock, Phone, Camera, Save,
  CheckCircle, AlertCircle, Palette, Bell, Shield
} from 'lucide-react';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'profile',  label: 'Profile',   icon: User    },
  { id: 'security', label: 'Security',  icon: Shield  },
  { id: 'prefs',    label: 'Preferences', icon: Palette },
];

/* ── Tab: Profile ── */
function ProfileTab({ user, profile, onSaved }) {
  const [form,    setForm]    = useState({
    displayName: user?.displayName || '',
    photoURL:    user?.photoURL    || '',
    phone:       '',
    bio:         '',
  });
  const [loading, setLoading] = useState(false);
  const [loaded,  setLoaded]  = useState(false);

  useEffect(() => {
    const loadExtra = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setForm(f => ({ ...f, phone: d.phone || '', bio: d.bio || '', photoURL: d.photoURL || user?.photoURL || '' }));
        }
      } catch {}
      setLoaded(true);
    };
    if (user?.uid) loadExtra();
  }, [user]);

  const save = async () => {
    if (!form.displayName.trim()) { toast.error('Name cannot be empty'); return; }
    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: form.displayName.trim(),
        photoURL:    form.photoURL.trim() || null,
      });

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName.trim(),
        photoURL:    form.photoURL.trim() || null,
        phone:       form.phone.trim(),
        bio:         form.bio.trim(),
      });

      toast.success('Profile updated!');
      onSaved();
    } catch (err) {
      toast.error('Failed to update profile. ' + (err.message || ''));
    } finally { setLoading(false); }
  };

  if (!loaded) return <div className="flex items-center gap-2 text-white/40 text-sm"><div className="w-4 h-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" /> Loading...</div>;

  const initials = (form.displayName || 'S').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

  return (
    <div className="space-y-6 max-w-lg">
      {/* Avatar preview */}
      <div className="flex items-center gap-5">
        <div className="relative">
          {form.photoURL ? (
            <img src={form.photoURL} alt="avatar"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-border2"
              onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black font-syne text-brand-bg"
              style={{ background: 'linear-gradient(135deg, #00e5ff, #a78bfa)' }}>
              {initials}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan flex items-center justify-center">
            <Camera size={11} className="text-brand-bg" />
          </div>
        </div>
        <div>
          <p className="font-syne font-bold text-lg">{form.displayName || 'Your Name'}</p>
          <p className="text-xs text-white/40 mt-0.5">{user?.email}</p>
          <p className="text-xs text-white/40">Level {profile?.level || 1} · {(profile?.xp || 0).toLocaleString()} XP</p>
        </div>
      </div>

      {/* Photo URL */}
      <div>
        <label className="text-xs font-medium text-white/50 mb-1.5 block">
          Profile Photo URL <span className="text-white/20">(paste any image URL)</span>
        </label>
        <input value={form.photoURL} onChange={e => setForm(f => ({ ...f, photoURL: e.target.value }))}
          placeholder="https://example.com/your-photo.jpg"
          className="input-dark w-full text-sm" />
        <p className="text-[10px] text-white/20 mt-1">Upload your photo to any free image host (imgbb.com, imgur.com) and paste the URL here.</p>
      </div>

      {/* Display name */}
      <div>
        <label className="text-xs font-medium text-white/50 mb-1.5 block">Display Name</label>
        <div className="relative">
          <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
            placeholder="Your name" className="input-dark w-full text-sm pl-10" />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="text-xs font-medium text-white/50 mb-1.5 block">Phone Number <span className="text-white/20">(optional)</span></label>
        <div className="relative">
          <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="+91 98765 43210" className="input-dark w-full text-sm pl-10" />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="text-xs font-medium text-white/50 mb-1.5 block">Bio <span className="text-white/20">(optional)</span></label>
        <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          placeholder="Tell us about yourself — grade, school, goals..."
          rows={3} className="input-dark w-full text-sm resize-none" />
      </div>

      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
        onClick={save} disabled={loading}
        className="btn-cyan flex items-center gap-2 py-3 px-6 disabled:opacity-50 text-sm font-semibold">
        {loading ? <><div className="w-4 h-4 border-2 border-brand-bg/40 border-t-brand-bg rounded-full animate-spin" /> Saving...</>
          : <><Save size={15} /> Save Profile</>}
      </motion.button>
    </div>
  );
}

/* ── Tab: Security ── */
function SecurityTab({ user }) {
  const [emailForm,  setEmailForm]  = useState({ newEmail: '', currentPassword: '' });
  const [passForm,   setPassForm]   = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [emailLoad,  setEmailLoad]  = useState(false);
  const [passLoad,   setPassLoad]   = useState(false);

  const isGoogle = user?.providerData?.[0]?.providerId === 'google.com';

  const updateEmailHandler = async (e) => {
    e.preventDefault();
    if (!emailForm.newEmail.trim()) { toast.error('Enter new email'); return; }
    setEmailLoad(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, emailForm.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updateEmail(auth.currentUser, emailForm.newEmail.trim());
      toast.success('Email updated!');
      setEmailForm({ newEmail: '', currentPassword: '' });
    } catch (err) {
      if (err.code === 'auth/wrong-password')      toast.error('Current password is incorrect.');
      else if (err.code === 'auth/email-already-in-use') toast.error('Email already in use.');
      else toast.error('Failed to update email.');
    } finally { setEmailLoad(false); }
  };

  const updatePasswordHandler = async (e) => {
    e.preventDefault();
    if (passForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (passForm.newPassword !== passForm.confirm) { toast.error('Passwords do not match'); return; }
    setPassLoad(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, passForm.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, passForm.newPassword);
      toast.success('Password updated!');
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      if (err.code === 'auth/wrong-password') toast.error('Current password is incorrect.');
      else toast.error('Failed to update password.');
    } finally { setPassLoad(false); }
  };

  if (isGoogle) return (
    <div className="max-w-lg">
      <div className="glass border border-brand-border rounded-2xl p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        </div>
        <div>
          <p className="font-semibold text-sm">Google Account</p>
          <p className="text-xs text-white/40 mt-1 leading-relaxed">Your account is linked to Google. Email and password are managed by Google — change them at myaccount.google.com</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-lg">
      {/* Change Email */}
      <div className="glass border border-brand-border rounded-2xl p-5">
        <h3 className="font-syne font-bold text-base mb-4 flex items-center gap-2">
          <Mail size={15} className="text-cyan" /> Change Email
        </h3>
        <form onSubmit={updateEmailHandler} className="space-y-3">
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="email" required placeholder="New email address"
              value={emailForm.newEmail} onChange={e => setEmailForm(f => ({ ...f, newEmail: e.target.value }))}
              className="input-dark w-full text-sm pl-10" />
          </div>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="password" required placeholder="Current password to confirm"
              value={emailForm.currentPassword} onChange={e => setEmailForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="input-dark w-full text-sm pl-10" />
          </div>
          <button type="submit" disabled={emailLoad}
            className="btn-cyan py-2.5 px-5 text-sm disabled:opacity-50">
            {emailLoad ? 'Updating...' : 'Update Email'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="glass border border-brand-border rounded-2xl p-5">
        <h3 className="font-syne font-bold text-base mb-4 flex items-center gap-2">
          <Lock size={15} className="text-neon-amber" /> Change Password
        </h3>
        <form onSubmit={updatePasswordHandler} className="space-y-3">
          {[
            { key: 'currentPassword', placeholder: 'Current password' },
            { key: 'newPassword',     placeholder: 'New password (min 8 chars)' },
            { key: 'confirm',         placeholder: 'Confirm new password' },
          ].map(({ key, placeholder }) => (
            <div key={key} className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="password" required placeholder={placeholder}
                value={passForm[key]} onChange={e => setPassForm(f => ({ ...f, [key]: e.target.value }))}
                className="input-dark w-full text-sm pl-10" />
            </div>
          ))}
          {passForm.newPassword && passForm.confirm && (
            <div className={`flex items-center gap-1.5 text-xs ${passForm.newPassword === passForm.confirm ? 'text-neon-green' : 'text-red-400'}`}>
              {passForm.newPassword === passForm.confirm ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
              {passForm.newPassword === passForm.confirm ? 'Passwords match' : 'Passwords do not match'}
            </div>
          )}
          <button type="submit" disabled={passLoad}
            className="btn-cyan py-2.5 px-5 text-sm disabled:opacity-50">
            {passLoad ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Tab: Preferences ── */
function PrefsTab() {
  const PREF_KEY = 'brainnex-prefs';
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { return {}; }
  });

  const toggle = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem(PREF_KEY, JSON.stringify(updated));
    toast.success('Preference saved!');
  };

  const options = [
    { key: 'soundEffects',    label: 'Sound Effects',         desc: 'Play sounds on correct/wrong answers', icon: '🔊' },
    { key: 'streakReminder',  label: 'Streak Reminder',       desc: 'Remind me to study each day',          icon: '🔥' },
    { key: 'showXPAnimation', label: 'XP Animations',         desc: 'Show XP gain animations after quizzes', icon: '⚡' },
    { key: 'compactMode',     label: 'Compact Sidebar',       desc: 'Smaller sidebar for more screen space',  icon: '📐' },
    { key: 'autoSaveChat',    label: 'Auto-Save Chat History',desc: 'Save AI tutor conversations locally',    icon: '💬' },
    { key: 'showHints',       label: 'Show Quiz Hints',       desc: 'Show hint button during quizzes',       icon: '💡' },
  ];

  return (
    <div className="max-w-lg space-y-3">
      {options.map(({ key, label, desc, icon }) => (
        <div key={key}
          className="flex items-center justify-between p-4 glass border border-brand-border rounded-xl hover:border-brand-border2 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-white/40">{desc}</p>
            </div>
          </div>
          <button onClick={() => toggle(key)}
            className={`w-11 h-6 rounded-full transition-all flex-shrink-0 relative ${prefs[key] ? 'bg-cyan' : 'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${prefs[key] ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
      ))}
      <p className="text-xs text-white/20 pt-2">Preferences are stored locally on your device — no server needed.</p>
    </div>
  );
}

/* ── Main Settings Page ── */
export default function SettingsPage() {
  const { user }             = useAuth();
  const { profile, refreshProfile } = useUserData();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-3xl mb-1">Settings</h1>
        <p className="text-white/40 text-sm mb-8">Manage your profile, security, and preferences</p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 glass border border-brand-border rounded-2xl mb-8 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
              activeTab === id ? 'bg-cyan/20 text-cyan border border-cyan/30' : 'text-white/50 hover:text-white'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === 'profile'  && <ProfileTab  user={user} profile={profile} onSaved={refreshProfile} />}
        {activeTab === 'security' && <SecurityTab user={user} />}
        {activeTab === 'prefs'    && <PrefsTab />}
      </motion.div>
    </div>
  );
}
