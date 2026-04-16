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
import { playCreate, playClick } from '../utils/soundEffects';
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
  <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color:'var(--txt3)' }}>{children}</label>
);

/* ── Toggle switch ── */
function Toggle({ on, onChange, disabled }) {
  return (
    <button onClick={() => !disabled && onChange(!on)} disabled={disabled}
      className="w-11 h-6 rounded-full transition-all relative flex-shrink-0 disabled:opacity-40"
      style={{ background: on ? 'var(--cyan)' : 'var(--border2)' }}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-5' : 'left-0.5'}`} />
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
      playCreate(); toast.success('Profile updated!'); onSaved();
    } catch (err) { toast.error('Failed: ' + err.message); }
    finally { setLoading(false); }
  };

  const initials = (form.displayName||'S').split(' ').map(w=>w[0]).join('').toUpperCase().substring(0,2);

  return (
    <div className="space-y-5 max-w-md">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
          {photoB64
            ? <img src={photoB64} alt="avatar" className="w-20 h-20 rounded-2xl object-cover border-2" style={{ borderColor:'var(--border2)' }} onError={() => setPhotoB64('')} />
            : <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black font-syne text-white"
                style={{ background:'linear-gradient(135deg,var(--cyan),var(--violet))' }}>{initials}</div>
          }
          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center border-2"
            style={{ background:'var(--cyan)', borderColor:'var(--bg)' }}>
            <Camera size={13} className="text-white" />
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        </div>
        <div>
          <p className="font-syne font-bold text-lg" style={{ color:'var(--txt)' }}>{form.displayName||'Your Name'}</p>
          <p className="text-xs" style={{ color:'var(--txt3)' }}>{user?.email}</p>
          <button onClick={() => fileRef.current?.click()}
            className="mt-1.5 text-xs flex items-center gap-1 transition-colors" style={{ color:'var(--cyan)' }}>
            <Camera size={11} />{photoB64 ? 'Change photo' : 'Upload from PC'}
          </button>
          <p className="text-[10px] mt-0.5" style={{ color:'var(--txt3)' }}>JPG, PNG · max 3MB</p>
        </div>
      </div>

      <div>
        <Label>Display Name</Label>
        <div className="relative">
          <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:'var(--txt3)' }} />
          <input value={form.displayName} onChange={e => setForm(f=>({...f,displayName:e.target.value}))}
            className="input-dark pl-10 text-sm" />
        </div>
      </div>
      <div>
        <Label>Phone (optional)</Label>
        <input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))}
          placeholder="+91 98765 43210" className="input-dark text-sm" />
      </div>
      <div>
        <Label>About Me (optional)</Label>
        <textarea value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))}
          placeholder="Grade, school, goals..." rows={3} className="input-dark text-sm resize-none" />
      </div>

      <button onClick={save} disabled={loading}
        className="btn-cyan flex items-center gap-2 py-3 px-6 text-sm disabled:opacity-50">
        {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : <><Save size={15} />Save Profile</>}
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
    playClick();
    setSubjects(p => p.includes(s) ? p.filter(x=>x!==s) : [...p,s]);
  };

  const save = async () => {
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
      playCreate(); toast.success('Student info saved!'); onSaved();
    } catch (err) { toast.error('Failed: ' + err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5 max-w-md">
      <div className="p-4 rounded-2xl border" style={{ background:'var(--cyan-bg)', borderColor:'var(--cyan-bdr)' }}>
        <p className="text-xs font-semibold" style={{ color:'var(--cyan)' }}>
          🧠 Your grade affects how BrainNex teaches you. Class 1-5 gets a fun, kid-friendly experience!
        </p>
      </div>

      <div>
        <Label>Class / Grade</Label>
        <div className="flex flex-wrap gap-2">
          {GRADES.map(g => (
            <button key={g} onClick={() => { playClick(); setGrade(g); }}
              className="px-3 py-1.5 rounded-full text-xs border font-medium transition-all"
              style={{
                background:  g===grade ? 'var(--cyan-bg)' : 'transparent',
                borderColor: g===grade ? 'var(--cyan)'    : 'var(--border2)',
                color:       g===grade ? 'var(--cyan)'    : 'var(--txt2)',
              }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>School Name (optional)</Label>
        <div className="relative">
          <School size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:'var(--txt3)' }} />
          <input value={school} onChange={e => setSchool(e.target.value)}
            placeholder="e.g. Delhi Public School" className="input-dark pl-10 text-sm" />
        </div>
      </div>

      <div>
        <Label>Board (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {BOARDS.map(b => (
            <button key={b} onClick={() => { playClick(); setBoard(b); }}
              className="px-3 py-1.5 rounded-full text-xs border font-medium transition-all"
              style={{
                background:  b===board ? 'var(--cyan-bg)' : 'transparent',
                borderColor: b===board ? 'var(--cyan)'    : 'var(--border2)',
                color:       b===board ? 'var(--cyan)'    : 'var(--txt2)',
              }}>
              {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>My Subjects</Label>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS_ALL.map(s => {
            const sel = subjects.includes(s);
            return (
              <button key={s} onClick={() => toggleSubject(s)}
                className="px-3 py-1.5 rounded-full text-xs border font-medium transition-all"
                style={{
                  background:  sel ? 'var(--cyan-bg)' : 'transparent',
                  borderColor: sel ? 'var(--cyan)'    : 'var(--border2)',
                  color:       sel ? 'var(--cyan)'    : 'var(--txt2)',
                }}>
                {s} {sel && '✓'}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={save} disabled={loading} className="btn-cyan flex items-center gap-2 py-3 px-6 text-sm disabled:opacity-50">
        {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Saving...</> : <><Save size={15}/>Save Student Info</>}
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
      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:'var(--txt3)' }} />
      <input type={show[field]?'text':'password'} required placeholder={ph}
        value={state[field]} onChange={e => setState(s=>({...s,[field]:e.target.value}))}
        className="input-dark pl-10 pr-10 text-sm" />
      <button type="button" onClick={() => setShow(s=>({...s,[field]:!s[field]}))}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
        style={{ color:'var(--txt3)' }}>
        {show[field] ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );

  if (isGoogle) return (
    <div className="max-w-md p-5 rounded-2xl border text-sm" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--txt2)' }}>
      Signed in with Google — manage your email and password at myaccount.google.com
    </div>
  );

  const updateEmailFn = async e => {
    e.preventDefault(); setEl(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, ef.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updateEmail(auth.currentUser, ef.newEmail.trim());
      playCreate(); toast.success('Email updated!'); setEf({newEmail:'',currentPassword:''});
    } catch (err) { toast.error(err.code==='auth/wrong-password'?'Wrong password.':'Failed.'); }
    finally { setEl(false); }
  };

  const updatePassFn = async e => {
    e.preventDefault();
    if (pf.newPassword.length<8) { toast.error('Min 8 chars'); return; }
    if (pf.newPassword!==pf.confirm) { toast.error("Don't match"); return; }
    setPl(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, pf.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, pf.newPassword);
      playCreate(); toast.success('Password updated!'); setPf({currentPassword:'',newPassword:'',confirm:''});
    } catch (err) { toast.error(err.code==='auth/wrong-password'?'Wrong password.':'Failed.'); }
    finally { setPl(false); }
  };

  return (
    <div className="space-y-5 max-w-md">
      <div className="p-5 rounded-2xl border" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
        <h3 className="font-syne font-bold text-sm mb-4 flex items-center gap-2" style={{ color:'var(--txt)' }}>
          <Mail size={14} style={{ color:'var(--cyan)' }} />Change Email
        </h3>
        <form onSubmit={updateEmailFn} className="space-y-3">
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:'var(--txt3)' }} />
            <input type="email" required placeholder="New email" value={ef.newEmail}
              onChange={e=>setEf(f=>({...f,newEmail:e.target.value}))} className="input-dark pl-10 text-sm" />
          </div>
          <PwInput field="currentPassword" ph="Current password" state={ef} setState={setEf} />
          <button type="submit" disabled={el} className="btn-cyan py-2.5 px-5 text-sm disabled:opacity-50">
            {el?'Updating...':'Update Email'}
          </button>
        </form>
      </div>

      <div className="p-5 rounded-2xl border" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
        <h3 className="font-syne font-bold text-sm mb-4 flex items-center gap-2" style={{ color:'var(--txt)' }}>
          <Lock size={14} style={{ color:'var(--amber)' }} />Change Password
        </h3>
        <form onSubmit={updatePassFn} className="space-y-3">
          <PwInput field="currentPassword" ph="Current password"    state={pf} setState={setPf} />
          <PwInput field="newPassword"     ph="New password (min 8)" state={pf} setState={setPf} />
          <PwInput field="confirm"         ph="Confirm new password" state={pf} setState={setPf} />
          {pf.newPassword&&pf.confirm&&(
            <div className="flex items-center gap-1.5 text-xs"
              style={{ color: pf.newPassword===pf.confirm?'var(--green)':'var(--red)' }}>
              {pf.newPassword===pf.confirm?<CheckCircle size={11}/>:<AlertCircle size={11}/>}
              {pf.newPassword===pf.confirm?'Match':'Do not match'}
            </div>
          )}
          <button type="submit" disabled={pl} className="btn-cyan py-2.5 px-5 text-sm disabled:opacity-50">
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
    playClick();
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
    <div className="max-w-md space-y-5">
      {/* Theme row */}
      <div className="p-5 rounded-2xl border" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
        <h3 className="font-syne font-bold text-sm mb-4" style={{ color:'var(--txt)' }}>Appearance</h3>
        <div className="space-y-3">
          {/* Dark / Light toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color:'var(--txt)' }}>
                {theme==='dark' ? <><Moon size={14} className="inline mr-1.5" style={{ color:'var(--cyan)' }} />Dark Mode</> : <><Sun size={14} className="inline mr-1.5" style={{ color:'var(--amber)' }} />Light Mode</>}
              </p>
              <p className="text-xs" style={{ color:'var(--txt3)' }}>Switch between dark and light themes</p>
            </div>
            <button onClick={() => { playClick(); toggleTheme(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all"
              style={{ background:'var(--card)', borderColor:'var(--border2)', color:'var(--txt2)' }}>
              {theme==='dark' ? <><Sun size={13}/> Light Mode</> : <><Moon size={13}/> Dark Mode</>}
            </button>
          </div>

          {/* Kid mode */}
          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor:'var(--border)' }}>
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5" style={{ color:'var(--txt)' }}>
                <Smile size={14} style={{ color:'var(--violet)' }} />Kid-Friendly Mode
              </p>
              <p className="text-xs" style={{ color:'var(--txt3)' }}>Playful UI, simpler language, fun emojis — for Class 1–5</p>
            </div>
            <Toggle on={kidMode} onChange={v => { setKidMode(v); playClick(); toast.success(v?'Kid mode ON 🌟':'Kid mode OFF'); }} />
          </div>
        </div>
      </div>

      {/* Other prefs */}
      <div className="p-5 rounded-2xl border" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
        <h3 className="font-syne font-bold text-sm mb-4" style={{ color:'var(--txt)' }}>App Settings</h3>
        <div className="space-y-4">
          {options.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium" style={{ color:'var(--txt)' }}>{label}</p>
                <p className="text-xs" style={{ color:'var(--txt3)' }}>{desc}</p>
              </div>
              <Toggle on={!!prefs[key]} onChange={() => toggle(key)} />
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs" style={{ color:'var(--txt3)' }}>All preferences saved on your device — no server needed.</p>
    </div>
  );
}

/* ─────────────────── MAIN PAGE ─────────────────── */
export default function SettingsPage() {
  const { user }                    = useAuth();
  const { profile, refreshProfile } = useUserData();
  const [tab, setTab]               = useState('profile');

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl" style={{ color:'var(--txt)' }}>
      <div className="pt-12 lg:pt-0 mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Profile, student info, security and preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-2xl mb-6 overflow-x-auto border"
        style={{ background:'var(--card)', borderColor:'var(--border)' }}>
        {TABS.map(({ id, label, icon:Icon }) => (
          <button key={id} onClick={() => { playClick(); setTab(id); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap font-medium transition-all"
            style={{
              background:  tab===id ? 'var(--cyan-bg)' : 'transparent',
              color:       tab===id ? 'var(--cyan)'    : 'var(--txt2)',
              border:      tab===id ? '1px solid var(--cyan-bdr)' : '1px solid transparent',
            }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}>
        {tab==='profile'      && <ProfileTab  user={user} onSaved={refreshProfile} />}
        {tab==='student'      && <StudentTab  user={user} profile={profile} onSaved={refreshProfile} />}
        {tab==='security'     && <SecurityTab user={user} />}
        {tab==='achievements' && <AchievementsPage />}
        {tab==='prefs'        && <PrefsTab />}
      </motion.div>
    </div>
  );
}
