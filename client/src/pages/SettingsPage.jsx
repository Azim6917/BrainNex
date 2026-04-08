import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Camera, Save, CheckCircle, AlertCircle, Palette, Shield, Trophy, Eye, EyeOff, Phone } from 'lucide-react';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import toast from 'react-hot-toast';
import { playCreate, playClick } from '../utils/soundEffects';
import AchievementsPage from './AchievementsPage';

const TABS = [
  { id:'profile',      label:'Profile',      icon:User    },
  { id:'security',     label:'Security',     icon:Shield  },
  { id:'achievements', label:'Achievements', icon:Trophy  },
  { id:'prefs',        label:'Preferences',  icon:Palette },
];

/* ── Profile Tab ── */
function ProfileTab({ user, profile, onSaved }) {
  const [form,     setForm]     = useState({ displayName: user?.displayName||'', phone:'', bio:'' });
  const [photoB64, setPhotoB64] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [loaded,   setLoaded]   = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setForm(f => ({ ...f, displayName:d.displayName||user.displayName||'', phone:d.phone||'', bio:d.bio||'' }));
          // Load photo: Firestore base64 > localStorage > Firebase Auth photoURL
          const storedPhoto = d.photoURL || localStorage.getItem(`brainnex-photo-${user.uid}`) || user.photoURL || '';
          setPhotoB64(storedPhoto);
        }
      } catch { /* silent */ }
      setLoaded(true);
    };
    if (user?.uid) load();
  }, [user]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Max image size is 3MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target.result;
      setPhotoB64(b64);
      // Pre-save to localStorage immediately so sidebar shows it
      localStorage.setItem(`brainnex-photo-${user.uid}`, b64);
      toast.success('Photo loaded! Click "Save Profile" to apply.');
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.displayName.trim()) { toast.error('Name cannot be empty'); return; }
    setLoading(true);
    try {
      // Save base64 photo to Firestore (works without storage bucket)
      await updateProfile(auth.currentUser, {
        displayName: form.displayName.trim(),
        photoURL:    photoB64 ? null : null, // Firebase Auth photoURL doesn't support base64
      });
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName.trim(),
        photoURL:    photoB64 || null,  // Store base64 in Firestore
        phone:       form.phone.trim(),
        bio:         form.bio.trim(),
      });
      if (photoB64) localStorage.setItem(`brainnex-photo-${user.uid}`, photoB64);
      playCreate();
      toast.success('Profile updated!');
      onSaved();
    } catch (err) {
      toast.error('Update failed: ' + (err.message||'Try again'));
    } finally { setLoading(false); }
  };

  if (!loaded) return <div className="flex items-center gap-2 text-white/40 text-sm py-4"><div className="w-4 h-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" />Loading...</div>;

  const initials = (form.displayName||'S').split(' ').map(w=>w[0]).join('').toUpperCase().substring(0,2);
  const hasPhoto = Boolean(photoB64);

  return (
    <div className="space-y-5 max-w-md">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
          {hasPhoto ? (
            <img src={photoB64} alt="avatar" className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-border2" onError={() => setPhotoB64('')} />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black font-syne text-brand-bg"
              style={{ background:'linear-gradient(135deg,#00e5ff,#a78bfa)' }}>{initials}</div>
          )}
          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-cyan flex items-center justify-center border-2 border-brand-bg">
            <Camera size={13} className="text-brand-bg" />
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} />
        </div>
        <div>
          <p className="font-syne font-bold text-lg">{form.displayName||'Your Name'}</p>
          <p className="text-xs text-white/40">{user?.email}</p>
          <button onClick={() => fileRef.current?.click()}
            className="mt-2 flex items-center gap-1.5 text-xs text-cyan hover:text-cyan/80 transition-colors">
            <Camera size={11} />{hasPhoto ? 'Change photo' : 'Upload from PC'}
          </button>
          <p className="text-[10px] text-white/20 mt-0.5">JPG, PNG, WebP · max 3MB · stored securely</p>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-white/50 mb-1.5 block">Display Name</label>
        <div className="relative">
          <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={form.displayName} onChange={e => setForm(f=>({...f,displayName:e.target.value}))}
            className="input-dark w-full text-sm pl-10" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-white/50 mb-1.5 block flex items-center gap-1.5"><Phone size={11} />Phone <span className="text-white/20">(optional)</span></label>
        <input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))}
          placeholder="+91 98765 43210" className="input-dark w-full text-sm" />
      </div>

      <div>
        <label className="text-xs font-medium text-white/50 mb-1.5 block">Bio <span className="text-white/20">(optional)</span></label>
        <textarea value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))}
          placeholder="Grade, school, study goals..." rows={3} className="input-dark w-full text-sm resize-none" />
      </div>

      <div className="text-xs text-white/25 bg-white/[0.03] border border-brand-border rounded-xl p-3">
        📸 Profile photos are stored in Firestore (your database) — no extra cost, works with the free tier.
      </div>

      <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.97 }}
        onClick={save} disabled={loading}
        className="btn-cyan flex items-center gap-2 py-3 px-6 disabled:opacity-50 text-sm font-semibold">
        {loading ? <><div className="w-4 h-4 border-2 border-brand-bg/40 border-t-brand-bg rounded-full animate-spin" />Saving...</> : <><Save size={15} />Save Profile</>}
      </motion.button>
    </div>
  );
}

/* ── Security Tab ── */
function SecurityTab({ user }) {
  const [ef, setEf] = useState({ newEmail:'', currentPassword:'' });
  const [pf, setPf] = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [show, setShow] = useState({});
  const [el, setEl] = useState(false);
  const [pl, setPl] = useState(false);
  const isGoogle = user?.providerData?.[0]?.providerId === 'google.com';

  const PwInput = ({ field, ph, state, setState }) => (
    <div className="relative">
      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
      <input type={show[field] ? 'text' : 'password'} required placeholder={ph}
        value={state[field]} onChange={e => setState(s=>({...s,[field]:e.target.value}))}
        className="input-dark w-full text-sm pl-10 pr-10" />
      <button type="button" onClick={() => setShow(s=>({...s,[field]:!s[field]}))}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
        {show[field] ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );

  if (isGoogle) return (
    <div className="max-w-md glass border border-brand-border rounded-2xl p-5 text-sm text-white/50">
      Signed in with Google — manage email and password at myaccount.google.com
    </div>
  );

  const updateEmailFn = async (e) => {
    e.preventDefault(); setEl(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, ef.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updateEmail(auth.currentUser, ef.newEmail.trim());
      playCreate(); toast.success('Email updated!'); setEf({newEmail:'',currentPassword:''});
    } catch (err) { toast.error(err.code==='auth/wrong-password' ? 'Wrong password.' : 'Failed.'); }
    finally { setEl(false); }
  };

  const updatePassFn = async (e) => {
    e.preventDefault();
    if (pf.newPassword.length < 8) { toast.error('Min 8 chars'); return; }
    if (pf.newPassword !== pf.confirm) { toast.error("Don't match"); return; }
    setPl(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, pf.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, pf.newPassword);
      playCreate(); toast.success('Password updated!'); setPf({currentPassword:'',newPassword:'',confirm:''});
    } catch (err) { toast.error(err.code==='auth/wrong-password' ? 'Wrong password.' : 'Failed.'); }
    finally { setPl(false); }
  };

  return (
    <div className="space-y-6 max-w-md">
      <div className="glass border border-brand-border rounded-2xl p-5">
        <h3 className="font-syne font-bold text-sm mb-4 flex items-center gap-2"><Mail size={14} className="text-cyan" />Change Email</h3>
        <form onSubmit={updateEmailFn} className="space-y-3">
          <div className="relative"><Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="email" required placeholder="New email" value={ef.newEmail} onChange={e=>setEf(f=>({...f,newEmail:e.target.value}))} className="input-dark w-full text-sm pl-10" /></div>
          <PwInput field="currentPassword" ph="Current password" state={ef} setState={setEf} />
          <button type="submit" disabled={el} className="btn-cyan py-2.5 px-5 text-sm disabled:opacity-50">{el?'Updating...':'Update Email'}</button>
        </form>
      </div>
      <div className="glass border border-brand-border rounded-2xl p-5">
        <h3 className="font-syne font-bold text-sm mb-4 flex items-center gap-2"><Lock size={14} className="text-neon-amber" />Change Password</h3>
        <form onSubmit={updatePassFn} className="space-y-3">
          <PwInput field="currentPassword" ph="Current password"    state={pf} setState={setPf} />
          <PwInput field="newPassword"     ph="New password (min 8)" state={pf} setState={setPf} />
          <PwInput field="confirm"         ph="Confirm new password" state={pf} setState={setPf} />
          {pf.newPassword && pf.confirm && (
            <div className={`flex items-center gap-1.5 text-xs ${pf.newPassword===pf.confirm?'text-neon-green':'text-red-400'}`}>
              {pf.newPassword===pf.confirm?<CheckCircle size={11}/>:<AlertCircle size={11}/>}
              {pf.newPassword===pf.confirm?'Match':'Do not match'}
            </div>
          )}
          <button type="submit" disabled={pl} className="btn-cyan py-2.5 px-5 text-sm disabled:opacity-50">{pl?'Updating...':'Update Password'}</button>
        </form>
      </div>
    </div>
  );
}

/* ── Prefs Tab ── */
function PrefsTab() {
  const K = 'brainnex-prefs';
  const [prefs, setPrefs] = useState(() => { try { return JSON.parse(localStorage.getItem(K)||'{}'); } catch { return {}; } });
  const toggle = (key) => {
    playClick();
    const u = { ...prefs, [key]:!prefs[key] };
    setPrefs(u); localStorage.setItem(K, JSON.stringify(u));
    toast.success(`${u[key]?'Enabled':'Disabled'}: ${key.replace(/([A-Z])/g,' $1').toLowerCase()}`);
  };
  const options = [
    { key:'soundEffects',    label:'Sound Effects',          desc:'Sounds for correct/wrong answers, XP, badges, and navigation', works:true },
    { key:'autoSaveChat',    label:'Auto-save Chat History', desc:'Save AI tutor chats in your browser',                          works:true },
    { key:'showHints',       label:'Show Quiz Hints',        desc:'Show hint button during quizzes',                             works:true },
    { key:'showXPAnimation', label:'XP Notifications',       desc:'Show toast when XP is earned',                               works:true },
    { key:'streakReminder',  label:'Daily Streak Reminder',  desc:'Browser notification to study each day',                     works:true },
  ];
  return (
    <div className="max-w-md space-y-3">
      {options.map(({ key, label, desc, works }) => (
        <div key={key} className="flex items-center justify-between p-4 glass border border-brand-border rounded-xl hover:border-brand-border2 transition-all">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-white/40 mt-0.5">{desc}</p>
          </div>
          <button onClick={() => works && toggle(key)} disabled={!works}
            className={`w-11 h-6 rounded-full transition-all flex-shrink-0 relative ${prefs[key]?'bg-cyan':'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${prefs[key]?'left-5':'left-0.5'}`} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { user }                    = useAuth();
  const { profile, refreshProfile } = useUserData();
  const [tab, setTab]               = useState('profile');

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="pt-12 lg:pt-0 mb-6">
        <h1 className="font-syne font-black text-2xl md:text-3xl mb-1">Settings</h1>
        <p className="text-white/40 text-sm">Profile, security, achievements and preferences</p>
      </div>
      <div className="flex gap-1 p-1 glass border border-brand-border rounded-2xl mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon:Icon }) => (
          <button key={id} onClick={() => { playClick(); setTab(id); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all ${tab===id?'bg-cyan/20 text-cyan border border-cyan/30':'text-white/50 hover:text-white'}`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>
      <motion.div key={tab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}>
        {tab==='profile'      && <ProfileTab user={user} profile={profile} onSaved={refreshProfile} />}
        {tab==='security'     && <SecurityTab user={user} />}
        {tab==='achievements' && <AchievementsPage />}
        {tab==='prefs'        && <PrefsTab />}
      </motion.div>
    </div>
  );
}
