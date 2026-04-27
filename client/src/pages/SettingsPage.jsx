import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Lock, Camera, Save, CheckCircle, AlertCircle,
  Palette, Shield, Trophy, Eye, EyeOff, Phone, GraduationCap,
  School, Sun, Moon, Smile
} from 'lucide-react';
import {
  updateProfile, updateEmail, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential
} from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { useAuth }     from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { useTheme }    from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { audioSystem } from '../utils/audio';
import AchievementsPage from './AchievementsPage';

const TABS = [
  { id:'profile',      label:'Profile',      icon:User         },
  { id:'student',      label:'Student Info', icon:GraduationCap},
  { id:'security',     label:'Security',     icon:Shield       },
  { id:'achievements', label:'Achievements', icon:Trophy       },
  { id:'prefs',        label:'Preferences',  icon:Palette      },
];

const GRADES = [
  'Class 1','Class 2','Class 3','Class 4','Class 5',
  'Class 6','Class 7','Class 8','Class 9','Class 10',
  'Class 11','Class 12','B.Tech / B.E.','B.Sc','Other',
];
const BOARDS = ['CBSE','ICSE','State Board','IB','IGCSE','Other'];
const SUBJECTS_ALL = [
  'Maths','Science','English','Social Studies',
  'Mathematics','Physics','Chemistry','Biology',
  'Computer Science','History','Geography','Literature','Economics','Psychology',
];

/* ── Reusable label ── */
const Label = ({ children }) => (
  <label className="text-[10px] font-bold uppercase tracking-widest text-txt3 mb-2 block">{children}</label>
);

/* ── Toggle switch ── */
function Toggle({ on, onChange, disabled }) {
  return (
    <button onClick={() => !disabled && onChange(!on)} disabled={disabled}
      className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 disabled:opacity-40 shadow-inner ${on ? 'bg-primary' : 'bg-space-800 border border-white/5'}`}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${on ? 'left-[26px]' : 'left-0.5'}`} />
    </button>
  );
}

/* ─────────────────── PROFILE TAB ─────────────────── */
function ProfileTab({ user, onSaved }) {
  const [form,    setForm]    = useState({ displayName: user?.displayName||'', phone:'', bio:'' });
  const [photoB64,setPhotoB64]= useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    getDoc(doc(db,'users',user.uid)).then(snap => {
      if (!snap.exists()) return;
      const d = snap.data();
      setForm(f => ({ ...f, displayName:d.displayName||user.displayName||'', phone:d.phone||'', bio:d.bio||'' }));
      setPhotoB64(d.photoURL || localStorage.getItem(`brainnex-photo-${user.uid}`) || '');
    }).catch(() => {});
  }, [user]);

  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3*1024*1024) { toast.error('Max 3MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target.result;
      setPhotoB64(b64);
      localStorage.setItem(`brainnex-photo-${user.uid}`, b64);
      toast.success('Photo loaded — save profile to apply!');
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.displayName.trim()) { toast.error('Name required'); return; }
    audioSystem.playClick();
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: form.displayName.trim() });
      await updateDoc(doc(db,'users',user.uid), {
        displayName: form.displayName.trim(),
        photoURL:    photoB64 || null,
        phone:       form.phone.trim(),
        bio:         form.bio.trim(),
      });
      if (photoB64) localStorage.setItem(`brainnex-photo-${user.uid}`, photoB64);
      audioSystem.playCreate(); toast.success('Profile updated!'); onSaved();
    } catch (err) { toast.error('Failed: ' + err.message); }
    finally { setLoading(false); }
  };

  const initials = (form.displayName||'S').split(' ').map(w=>w[0]).join('').toUpperCase().substring(0,2);

  return (
    <div className="space-y-6 max-w-xl">
      {/* Avatar */}
      <div className="flex items-center gap-6 glass-card p-6 border-primary/10 bg-primary/5">
        <div className="relative cursor-pointer" onClick={() => { audioSystem.playClick(); fileRef.current?.click(); }}>
          {photoB64
            ? <img src={photoB64} alt="avatar" className="w-24 h-24 rounded-2xl object-cover border-2 border-primary/30 shadow-sm" onError={() => setPhotoB64('')} />
            : <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-jakarta font-black text-white shadow-sm"
                style={{ background:'linear-gradient(135deg,var(--primary),var(--cyan))' }}>{initials}</div>
          }
          <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center border-4 border-space-900 bg-primary text-white shadow-sm hover:scale-110 transition-transform">
            <Camera size={14} />
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        </div>
        <div>
          <p className="font-jakarta font-black text-xl text-txt mb-1">{form.displayName||'Your Name'}</p>
          <p className="text-sm font-medium text-txt3 mb-3">{user?.email}</p>
          <button onClick={() => { audioSystem.playClick(); fileRef.current?.click(); }}
            className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 transition-colors hover:text-primary-light bg-primary/10 px-3 py-1.5 rounded-lg">
            <Camera size={12} />{photoB64 ? 'Change photo' : 'Upload photo'}
          </button>
          <p className="text-[10px] font-bold text-txt3 mt-2 uppercase tracking-widest">JPG, PNG · max 3MB</p>
        </div>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div>
          <Label>Display Name</Label>
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
            <input value={form.displayName} onChange={e => setForm(f=>({...f,displayName:e.target.value}))}
              className="input-field pl-12 text-sm py-3" />
          </div>
        </div>
        <div>
          <Label>Phone (optional)</Label>
          <div className="relative">
            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
            <input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))}
              placeholder="+91 98765 43210" className="input-field pl-12 text-sm py-3" />
          </div>
        </div>
        <div>
          <Label>About Me (optional)</Label>
          <textarea value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))}
            placeholder="Grade, school, goals..." rows={4} className="input-field text-sm resize-none py-3" />
        </div>
      </div>

      <button onClick={save} disabled={loading}
        className="btn-primary flex items-center justify-center gap-2 py-3.5 px-6 text-sm w-full md:w-auto shadow-glow-primary font-bold">
        {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : <><Save size={16} />Save Profile</>}
      </button>
    </div>
  );
}

/* ─────────────────── STUDENT INFO TAB ─────────────────── */
function StudentTab({ user, profile, onSaved }) {
  const { setKidMode } = useTheme();
  const [grade,    setGrade]    = useState(profile?.grade    || '');
  const [school,   setSchool]   = useState(profile?.school   || '');
  const [board,    setBoard]    = useState(profile?.board    || '');
  const [subjects, setSubjects] = useState(profile?.subjects || []);
  const [loading,  setLoading]  = useState(false);

  const toggleSubject = s => {
    audioSystem.playClick();
    setSubjects(p => p.includes(s) ? p.filter(x=>x!==s) : [...p,s]);
  };

  const save = async () => {
    audioSystem.playClick();
    setLoading(true);
    try {
      const junior = ['Class 1','Class 2','Class 3','Class 4','Class 5'].includes(grade);
      await updateDoc(doc(db,'users',user.uid), {
        grade, school: school.trim(), board, subjects,
        isKidMode:  junior,
        currentDifficulty: junior ? 'beginner' : profile?.currentDifficulty || 'intermediate',
      });
      if (junior) setKidMode(true);
      else setKidMode(false);
      audioSystem.playCreate(); toast.success('Student info saved!'); onSaved();
    } catch (err) { toast.error('Failed: ' + err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="p-5 rounded-2xl border border-primary/20 bg-primary/10 shadow-sm flex items-start gap-4">
        <div className="text-2xl drop-shadow-sm">🧠</div>
        <p className="text-sm font-medium text-primary-light leading-relaxed">
          Your grade affects how BrainNex teaches you. <strong className="text-primary">Class 1-5</strong> gets a fun, kid-friendly learning experience!
        </p>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div>
          <Label>Class / Grade</Label>
          <div className="flex flex-wrap gap-2.5">
            {GRADES.map(g => (
              <button key={g} onClick={() => { audioSystem.playClick(); setGrade(g); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                  g===grade ? 'bg-primary/20 border-primary/40 text-primary scale-105' : 'bg-space-800 border-border text-txt2 hover:border-white/20 hover:text-txt'
                }`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>School Name (optional)</Label>
          <div className="relative">
            <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
            <input value={school} onChange={e => setSchool(e.target.value)}
              placeholder="e.g. Delhi Public School" className="input-field pl-12 text-sm py-3" />
          </div>
        </div>

        <div>
          <Label>Board (optional)</Label>
          <div className="flex flex-wrap gap-2.5">
            {BOARDS.map(b => (
              <button key={b} onClick={() => { audioSystem.playClick(); setBoard(b); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                  b===board ? 'bg-cyan/20 border-cyan/40 text-cyan scale-105' : 'bg-space-800 border-border text-txt2 hover:border-white/20 hover:text-txt'
                }`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>My Subjects</Label>
          <div className="flex flex-wrap gap-2.5">
            {SUBJECTS_ALL.map(s => {
              const sel = subjects.includes(s);
              return (
                <button key={s} onClick={() => toggleSubject(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border flex items-center gap-1.5 ${
                    sel ? 'bg-green-500/20 border-green-500/40 text-green-500 scale-105' : 'bg-space-800 border-border text-txt2 hover:border-white/20 hover:text-txt'
                  }`}>
                  {sel && <CheckCircle size={12} className="text-green-500" />} {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button onClick={save} disabled={loading} className="btn-primary flex items-center justify-center gap-2 py-3.5 px-6 text-sm w-full md:w-auto shadow-glow-primary font-bold">
        {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Saving...</> : <><Save size={16}/>Save Student Info</>}
      </button>
    </div>
  );
}

/* ─────────────────── SECURITY TAB ─────────────────── */
function SecurityTab({ user }) {
  const [ef, setEf]  = useState({ newEmail:'', currentPassword:'' });
  const [pf, setPf]  = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [show, setShow] = useState({});
  const [el, setEl]  = useState(false);
  const [pl, setPl]  = useState(false);
  const isGoogle = user?.providerData?.[0]?.providerId === 'google.com';

  const PwInput = ({ field, ph, state, setState }) => (
    <div className="relative">
      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
      <input type={show[field]?'text':'password'} required placeholder={ph}
        value={state[field]} onChange={e => setState(s=>({...s,[field]:e.target.value}))}
        className="input-field pl-12 pr-12 text-sm py-3" />
      <button type="button" onClick={() => { audioSystem.playClick(); setShow(s=>({...s,[field]:!s[field]})); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-txt3 hover:text-txt transition-colors">
        {show[field] ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  if (isGoogle) return (
    <div className="max-w-xl glass-card p-8 border-cyan/20 bg-cyan/5 text-sm font-medium text-txt2 leading-relaxed flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 bg-cyan/20 text-cyan rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-cyan/30">G</div>
      <p>Signed in with Google. Please manage your email and password settings directly at <a href="https://myaccount.google.com" target="_blank" rel="noreferrer" className="text-cyan font-bold hover:underline">myaccount.google.com</a></p>
    </div>
  );

  const updateEmailFn = async e => {
    e.preventDefault(); setEl(true); audioSystem.playClick();
    try {
      const cred = EmailAuthProvider.credential(user.email, ef.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updateEmail(auth.currentUser, ef.newEmail.trim());
      audioSystem.playCreate(); toast.success('Email updated!'); setEf({newEmail:'',currentPassword:''});
    } catch (err) { toast.error(err.code==='auth/wrong-password'?'Wrong password.':'Failed.'); }
    finally { setEl(false); }
  };

  const updatePassFn = async e => {
    e.preventDefault(); audioSystem.playClick();
    if (pf.newPassword.length<8) { toast.error('Min 8 chars'); return; }
    if (pf.newPassword!==pf.confirm) { toast.error("Don't match"); return; }
    setPl(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, pf.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, pf.newPassword);
      audioSystem.playCreate(); toast.success('Password updated!'); setPf({currentPassword:'',newPassword:'',confirm:''});
    } catch (err) { toast.error(err.code==='auth/wrong-password'?'Wrong password.':'Failed.'); }
    finally { setPl(false); }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="glass-card p-6 md:p-8">
        <h3 className="font-jakarta font-black text-lg mb-6 flex items-center gap-2.5 text-txt">
          <div className="p-2 rounded-lg bg-cyan/20 text-cyan shadow-sm border border-cyan/30"><Mail size={18} /></div> Change Email
        </h3>
        <form onSubmit={updateEmailFn} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
            <input type="email" required placeholder="New email" value={ef.newEmail}
              onChange={e=>setEf(f=>({...f,newEmail:e.target.value}))} className="input-field pl-12 text-sm py-3" />
          </div>
          <PwInput field="currentPassword" ph="Current password" state={ef} setState={setEf} />
          <button type="submit" disabled={el} className="btn-cyan py-3.5 px-6 text-sm font-bold shadow-glow-cyan mt-2">
            {el?'Updating...':'Update Email'}
          </button>
        </form>
      </div>

      <div className="glass-card p-6 md:p-8">
        <h3 className="font-jakarta font-black text-lg mb-6 flex items-center gap-2.5 text-txt">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 shadow-sm border border-amber-500/30"><Lock size={18} /></div> Change Password
        </h3>
        <form onSubmit={updatePassFn} className="space-y-4">
          <PwInput field="currentPassword" ph="Current password"    state={pf} setState={setPf} />
          <PwInput field="newPassword"     ph="New password (min 8)" state={pf} setState={setPf} />
          <PwInput field="confirm"         ph="Confirm new password" state={pf} setState={setPf} />
          {pf.newPassword&&pf.confirm&&(
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-lg border w-fit ${pf.newPassword===pf.confirm?'bg-green-500/10 border-green-500/30 text-green-500':'bg-red-500/10 border-red-500/30 text-red-500'}`}>
              {pf.newPassword===pf.confirm?<CheckCircle size={14}/>:<AlertCircle size={14}/>}
              {pf.newPassword===pf.confirm?'Passwords Match':'Passwords do not match'}
            </div>
          )}
          <button type="submit" disabled={pl} className="btn-primary py-3.5 px-6 text-sm font-bold shadow-glow-primary mt-2">
            {pl?'Updating...':'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────── PREFERENCES TAB ─────────────────── */
function PrefsTab() {
  const { theme, toggleTheme, kidMode, setKidMode } = useTheme();
  const K = 'brainnex-prefs';
  const [prefs, setPrefs] = useState(() => { try { return JSON.parse(localStorage.getItem(K)||'{}'); } catch { return {}; } });

  const toggle = key => {
    audioSystem.playClick();
    const u = { ...prefs, [key]:!prefs[key] };
    setPrefs(u); localStorage.setItem(K, JSON.stringify(u));
    toast.success(`${u[key]?'Enabled':'Disabled'} ${key.replace(/([A-Z])/g,' $1').toLowerCase()}`);
  };

  const options = [
    { key:'soundEffects',    label:'Sound Effects',         desc:'Sounds for correct/wrong answers, XP, and navigation' },
    { key:'autoSaveChat',    label:'Auto-save Chat History',desc:'Save AI tutor conversations on your device' },
    { key:'showHints',       label:'Show Quiz Hints',       desc:'Show hint button during quizzes' },
    { key:'showXPAnimation', label:'XP Gain Toasts',        desc:'Show notification when you earn XP' },
  ];

  return (
    <div className="max-w-xl space-y-6">
      {/* Theme row */}
      <div className="glass-card p-6 md:p-8">
        <h3 className="font-jakarta font-black text-lg mb-6 text-txt">Appearance</h3>
        <div className="space-y-6">
          {/* Dark / Light toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-txt flex items-center gap-2 mb-1">
                {theme==='dark' ? <><div className="p-1.5 bg-cyan/20 text-cyan rounded-md border border-cyan/30"><Moon size={14} /></div> Dark Mode</> : <><div className="p-1.5 bg-amber-500/20 text-amber-500 rounded-md border border-amber-500/30"><Sun size={14} /></div> Light Mode</>}
              </p>
              <p className="text-xs font-medium text-txt3">Switch between dark and light themes</p>
            </div>
            <button onClick={() => { audioSystem.playClick(); toggleTheme(); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm bg-space-800 border-border text-txt2 hover:border-white/20 hover:text-txt uppercase tracking-widest">
              {theme==='dark' ? <><Sun size={14}/> Light</> : <><Moon size={14}/> Dark</>}
            </button>
          </div>

          <div className="w-full h-px bg-border" />

          {/* Kid mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-txt flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-violet-500/20 text-violet-500 rounded-md border border-violet-500/30"><Smile size={14} /></div> Kid-Friendly Mode
              </p>
              <p className="text-xs font-medium text-txt3">Playful UI, simpler language, fun emojis — for Class 1–5</p>
            </div>
            <Toggle on={kidMode} onChange={v => { setKidMode(v); audioSystem.playClick(); toast.success(v?'Kid mode ON 🌟':'Kid mode OFF'); }} />
          </div>
        </div>
      </div>

      {/* Other prefs */}
      <div className="glass-card p-6 md:p-8">
        <h3 className="font-jakarta font-black text-lg mb-6 text-txt">App Settings</h3>
        <div className="space-y-6">
          {options.map(({ key, label, desc }, i) => (
            <React.Fragment key={key}>
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-6">
                  <p className="text-sm font-bold text-txt mb-1">{label}</p>
                  <p className="text-xs font-medium text-txt3">{desc}</p>
                </div>
                <Toggle on={!!prefs[key]} onChange={() => toggle(key)} />
              </div>
              {i < options.length - 1 && <div className="w-full h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-txt3 bg-space-800 border border-white/5 px-4 py-2.5 rounded-xl">
        <CheckCircle size={12} className="text-green-500" /> All preferences saved on your device — no server needed.
      </div>
    </div>
  );
}

/* ─────────────────── MAIN PAGE ─────────────────── */
export default function SettingsPage() {
  const { user }                    = useAuth();
  const { profile, refreshProfile } = useUserData();
  const [tab, setTab]               = useState('profile');

  return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto w-full">
      <div className="pt-12 lg:pt-0 mb-8">
        <h1 className="font-jakarta font-black text-3xl md:text-4xl text-txt mb-2">Settings</h1>
        <p className="text-sm font-medium text-txt3">Profile, student info, security and preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 p-2 rounded-2xl mb-8 overflow-x-auto glass-card shadow-sm border-transparent custom-scrollbar">
        {TABS.map(({ id, label, icon:Icon }) => (
          <button key={id} onClick={() => { audioSystem.playClick(); setTab(id); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs whitespace-nowrap font-bold uppercase tracking-wider transition-all flex-1 justify-center ${
              tab===id ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm scale-105' : 'text-txt3 hover:text-txt2 hover:bg-space-800'
            }`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}>
        {tab==='profile'      && <ProfileTab  user={user} onSaved={refreshProfile} />}
        {tab==='student'      && <StudentTab  user={user} profile={profile} onSaved={refreshProfile} />}
        {tab==='security'     && <SecurityTab user={user} />}
        {tab==='achievements' && <div className="-mt-12 lg:-mt-0"><AchievementsPage /></div>}
        {tab==='prefs'        && <PrefsTab />}
      </motion.div>
    </div>
  );
}
