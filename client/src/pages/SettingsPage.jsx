import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Lock, Camera, Save, CheckCircle, AlertCircle,
  Palette, Shield, Eye, EyeOff, Phone, GraduationCap,
  School, Bell, Layout, Clock, CreditCard, Activity, Zap, Crown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  updateProfile, updateEmail, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, updateDoc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { useAuth }     from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { useTheme }    from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { audioSystem } from '../utils/audio';

const TABS = [
  { id:'profile',  label:'Profile',      icon:User         },
  { id:'student',  label:'Student Info', icon:GraduationCap},
  { id:'security', label:'Security',     icon:Shield       },
  { id:'prefs',    label:'Preferences',  icon:Palette      },
  { id:'billing',  label:'Subscription', icon:CreditCard   },
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

const Label = ({ children }) => (
  <label className="text-[10px] font-bold uppercase tracking-widest text-txt3 mb-2 block">{children}</label>
);

function Toggle({ on, onChange, disabled }) {
  return (
    <button onClick={() => !disabled && onChange(!on)} disabled={disabled}
      className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 disabled:opacity-40 shadow-inner ${on ? 'bg-primary' : 'bg-space-800 border border-white/5'}`}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${on ? 'left-[26px]' : 'left-0.5'}`} />
    </button>
  );
}

function ProfileTab({ user, onSaved }) {
  const [form,     setForm]     = useState({ displayName: user?.displayName||'', phone:'', bio:'' });
  const [photoB64, setPhotoB64] = useState('');
  const [loading,  setLoading]  = useState(false);
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

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 glass-card p-6 md:p-8 border-primary/10 bg-primary/5 text-center sm:text-left shadow-sm">
        <div className="relative cursor-pointer flex-shrink-0" onClick={() => { audioSystem.playClick(); fileRef.current?.click(); }}>
          {photoB64
            ? <img src={photoB64} alt="avatar" className="w-28 h-28 rounded-2xl object-cover border-4 border-primary/20 shadow-lg" onError={() => setPhotoB64('')} />
            : <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-4xl font-jakarta font-black text-white shadow-lg border-4 border-primary/20"
                style={{ background:'linear-gradient(135deg,var(--primary),var(--cyan))' }}>{initials}</div>
          }
          <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center border-4 border-space-900 bg-primary text-white shadow-lg hover:scale-110 transition-transform">
            <Camera size={16} />
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        </div>
        <div className="flex flex-col justify-center sm:h-28">
          <p className="font-jakarta font-black text-2xl text-txt mb-1">{form.displayName||'Your Name'}</p>
          <p className="text-sm font-medium text-txt3 mb-4">{user?.email}</p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button onClick={() => { audioSystem.playClick(); fileRef.current?.click(); }}
              className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 transition-colors hover:bg-primary/20 bg-primary/10 px-4 py-2 rounded-xl shadow-sm">
              <Camera size={14} />{photoB64 ? 'Change photo' : 'Upload photo'}
            </button>
            <p className="text-[10px] font-bold text-txt3 uppercase tracking-widest">JPG, PNG · max 3MB</p>
          </div>
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
        {loading
          ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
          : <><Save size={16} />Save Profile</>}
      </button>
    </div>
  );
}

function StudentTab({ user, profile, onSaved }) {
  const { setKidMode } = useTheme();

  // If saved grade is not in the predefined list, treat as custom "Other"
  const savedGrade = profile?.grade || '';
  const gradeIsCustom = savedGrade !== '' && !GRADES.includes(savedGrade);

  const [grade,       setGrade]       = useState(gradeIsCustom ? 'Other' : savedGrade);
  const [customGrade, setCustomGrade] = useState(gradeIsCustom ? savedGrade : '');
  const [school,      setSchool]      = useState(profile?.school   || '');
  const [board,       setBoard]       = useState(profile?.board    || '');
  const [subjects,    setSubjects]    = useState(profile?.subjects || []);
  const [loading,     setLoading]     = useState(false);

  const toggleSubject = s => {
    audioSystem.playClick();
    setSubjects(p => p.includes(s) ? p.filter(x=>x!==s) : [...p,s]);
  };

  const save = async () => {
    audioSystem.playClick();
    setLoading(true);
    try {
      const actualGrade = grade === 'Other' ? customGrade.trim() : grade;
      if (grade === 'Other' && !customGrade.trim()) {
        toast.error('Please type your grade');
        setLoading(false);
        return;
      }
      const junior = ['Class 1','Class 2','Class 3','Class 4','Class 5'].includes(actualGrade);
      await updateDoc(doc(db,'users',user.uid), {
        grade: actualGrade,
        school: school.trim(),
        board,
        subjects,
        isKidMode: junior,
        currentDifficulty: junior ? 'beginner' : profile?.currentDifficulty || 'intermediate',
      });
      if (junior) setKidMode(true);
      else setKidMode(false);
      audioSystem.playCreate();
      toast.success('Student info saved!');
      onSaved();
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="p-5 rounded-2xl border border-primary/20 bg-primary/10 shadow-sm flex items-start gap-4">
        <div className="text-2xl drop-shadow-sm">🧠</div>
        <p className="text-sm font-medium text-primary-light leading-relaxed">
          Your grade affects how BrainNex teaches you. <strong className="text-primary">Class 1–5</strong> gets a fun, kid-friendly learning experience!
        </p>
      </div>

      <div className="glass-card p-6 space-y-6">

        <div>
          <Label>Class / Grade</Label>
          <div className="flex flex-wrap gap-2.5">
            {GRADES.map(g => (
              <button key={g}
                onClick={() => {
                  audioSystem.playClick();
                  setGrade(g);
                  if (g !== 'Other') setCustomGrade('');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                  g === grade
                    ? 'bg-primary/20 border-primary/40 text-primary scale-105'
                    : 'bg-space-800 border-border text-txt2 hover:border-white/20 hover:text-txt'
                }`}>
                {g}
              </button>
            ))}
          </div>

          {grade === 'Other' && (
            <div className="mt-3">
              <input
                value={customGrade}
                onChange={e => setCustomGrade(e.target.value)}
                placeholder="Type your class or grade e.g. Diploma Year 2, PhD, Self Learning"
                className="input-field text-sm py-3"
                autoFocus
              />
            </div>
          )}
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
                  b === board
                    ? 'bg-cyan/20 border-cyan/40 text-cyan scale-105'
                    : 'bg-space-800 border-border text-txt2 hover:border-white/20 hover:text-txt'
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
                    sel
                      ? 'bg-green-500/20 border-green-500/40 text-green-500 scale-105'
                      : 'bg-space-800 border-border text-txt2 hover:border-white/20 hover:text-txt'
                  }`}>
                  {sel && <CheckCircle size={12} className="text-green-500" />} {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button onClick={save} disabled={loading}
        className="btn-primary flex items-center justify-center gap-2 py-3.5 px-6 text-sm w-full md:w-auto shadow-glow-primary font-bold">
        {loading
          ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
          : <><Save size={16} />Save Student Info</>}
      </button>
    </div>
  );
}

function SecurityTab({ user }) {
  const [ef,   setEf]   = useState({ newEmail:'', currentPassword:'' });
  const [pf,   setPf]   = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [show, setShow] = useState({});
  const [el,   setEl]   = useState(false);
  const [pl,   setPl]   = useState(false);
  const [rl,   setRl]   = useState(false);
  const isGoogle = user?.providerData?.[0]?.providerId === 'google.com';

  const PwInput = ({ field, ph, state, setState }) => (
    <div className="relative">
      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
      <input type={show[field] ? 'text' : 'password'} required placeholder={ph}
        value={state[field]} onChange={e => setState(s=>({...s,[field]:e.target.value}))}
        className="input-field pl-12 pr-12 text-sm py-3" />
      <button type="button"
        onClick={() => { audioSystem.playClick(); setShow(s=>({...s,[field]:!s[field]})); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-txt3 hover:text-txt transition-colors">
        {show[field] ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  if (isGoogle) return (
    <div className="max-w-xl glass-card p-8 border-cyan/20 bg-cyan/5 text-sm font-medium text-txt2 leading-relaxed flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 bg-cyan/20 text-cyan rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-cyan/30">G</div>
      <p>Signed in with Google. Please manage your email and password settings directly at{' '}
        <a href="https://myaccount.google.com" target="_blank" rel="noreferrer" className="text-cyan font-bold hover:underline">
          myaccount.google.com
        </a>
      </p>
    </div>
  );

  const updateEmailFn = async e => {
    e.preventDefault(); setEl(true); audioSystem.playClick();
    try {
      const cred = EmailAuthProvider.credential(user.email, ef.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updateEmail(auth.currentUser, ef.newEmail.trim());
      audioSystem.playCreate();
      toast.success('Email updated!');
      setEf({ newEmail:'', currentPassword:'' });
    } catch (err) {
      toast.error(err.code === 'auth/wrong-password' ? 'Wrong password.' : 'Failed.');
    } finally { setEl(false); }
  };

  const updatePassFn = async e => {
    e.preventDefault(); audioSystem.playClick();
    if (pf.newPassword.length < 8) { toast.error('Min 8 chars'); return; }
    if (pf.newPassword !== pf.confirm) { toast.error("Don't match"); return; }
    setPl(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, pf.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, pf.newPassword);
      audioSystem.playCreate();
      toast.success('Password updated!');
      setPf({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) {
      toast.error(err.code === 'auth/wrong-password' ? 'Wrong password.' : 'Failed.');
    } finally { setPl(false); }
  };

  const sendResetEmail = async () => {
    audioSystem.playClick();
    setRl(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (err) {
      toast.error('Failed to send reset email. Try again.');
    } finally { setRl(false); }
  };

  return (
    <div className="space-y-6 max-w-xl">

      <div className="glass-card p-6 md:p-8">
        <h3 className="font-jakarta font-black text-lg mb-6 flex items-center gap-2.5 text-txt">
          <div className="p-2 rounded-lg bg-cyan/20 text-cyan shadow-sm border border-cyan/30">
            <Mail size={18} />
          </div>
          Change Email
        </h3>
        <form onSubmit={updateEmailFn} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt3" />
            <input type="email" required placeholder="New email" value={ef.newEmail}
              onChange={e => setEf(f=>({...f,newEmail:e.target.value}))}
              className="input-field pl-12 text-sm py-3" />
          </div>
          <PwInput field="currentPassword" ph="Current password" state={ef} setState={setEf} />
          <button type="submit" disabled={el}
            className="btn-cyan py-3.5 px-6 text-sm font-bold shadow-glow-cyan mt-2">
            {el ? 'Updating...' : 'Update Email'}
          </button>
        </form>
      </div>

      <div className="glass-card p-6 md:p-8">
        <h3 className="font-jakarta font-black text-lg mb-6 flex items-center gap-2.5 text-txt">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 shadow-sm border border-amber-500/30">
            <Lock size={18} />
          </div>
          Change Password
        </h3>
        <form onSubmit={updatePassFn} className="space-y-4">
          <PwInput field="currentPassword" ph="Current password"     state={pf} setState={setPf} />
          <PwInput field="newPassword"     ph="New password (min 8)" state={pf} setState={setPf} />
          <PwInput field="confirm"         ph="Confirm new password"  state={pf} setState={setPf} />
          {pf.newPassword && pf.confirm && (
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-lg border w-fit ${
              pf.newPassword === pf.confirm
                ? 'bg-green-500/10 border-green-500/30 text-green-500'
                : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}>
              {pf.newPassword === pf.confirm ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
              {pf.newPassword === pf.confirm ? 'Passwords Match' : 'Passwords do not match'}
            </div>
          )}
          <button type="submit" disabled={pl}
            className="btn-primary py-3.5 px-6 text-sm font-bold shadow-glow-primary mt-2">
            {pl ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="glass-card p-6 md:p-8">
        <h3 className="font-jakarta font-black text-lg mb-2 flex items-center gap-2.5 text-txt">
          <div className="p-2 rounded-lg bg-green-500/20 text-green-500 shadow-sm border border-green-500/30">
            <Mail size={18} />
          </div>
          Forgot Password?
        </h3>
        <p className="text-sm font-medium text-txt3 mb-5">
          We'll send a reset link to{' '}
          <span className="text-txt font-bold">{user?.email}</span>
        </p>
        <button
          onClick={sendResetEmail}
          disabled={rl}
          className="btn-outline py-3 px-6 text-sm font-bold flex items-center gap-2 border-green-500/30 text-green-500 hover:border-green-500/60 bg-green-500/5">
          {rl
            ? <><div className="w-4 h-4 border-2 border-green-500/40 border-t-green-500 rounded-full animate-spin" />Sending...</>
            : <><Mail size={16} />Send Password Reset Email</>}
        </button>
      </div>
    </div>
  );
}

function PrefsTab() {
  const K = 'brainnex-prefs';
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(K) || '{}'); }
    catch { return {}; }
  });

  const isOn = key => {
    return prefs[key] !== false;
  };

  const toggle = (key, label) => {
    audioSystem.playClick();
    const next = isOn(key) ? false : true;
    const u = { ...prefs, [key]: next };
    setPrefs(u);
    localStorage.setItem(K, JSON.stringify(u));
    toast.success(`${next ? 'Enabled' : 'Disabled'} ${label}`);
  };

  useEffect(() => {
    localStorage.setItem('brainnex-last-visit', Date.now().toString());
  }, []);

  const options = [
    {
      key:  'soundEffects',
      label:'Sound Effects',
      desc: 'Navigation clicks, answer feedback, and UI interaction sounds',
      icon: <div className="p-1.5 bg-primary/20 text-primary rounded-md border border-primary/30"><Bell size={14} /></div>,
    },
    {
      key:  'notificationSounds',
      label:'Notification Sounds',
      desc: 'Sounds specifically for quiz completion and achievement unlocks',
      icon: <div className="p-1.5 bg-cyan/20 text-cyan rounded-md border border-cyan/30"><Bell size={14} /></div>,
    }
  ];

  return (
    <div className="max-w-xl space-y-6">

      <div className="glass-card p-6 md:p-8">
        <h3 className="font-jakarta font-black text-lg mb-6 text-txt">App Settings</h3>
        <div className="space-y-6">
          {options.map(({ key, label, desc, icon }, i) => (
            <React.Fragment key={key}>
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-6">
                  <p className="text-sm font-bold text-txt flex items-center gap-2 mb-1">
                    {icon} {label}
                  </p>
                  <p className="text-xs font-medium text-txt3">{desc}</p>
                </div>
                <Toggle on={isOn(key)} onChange={() => toggle(key, label)} />
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

function BillingTab({ profile, effectiveTier }) {
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [usage, setUsage] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.uid) {
        setLoadingPayments(false);
        return;
      }
      try {
        // Fetch Payments
        const q = query(
          collection(db, 'payments'),
          where('userId', '==', profile.uid),
          orderBy('paymentDate', 'desc')
        );
        const snap = await getDocs(q);
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch Usage
        const usageSnap = await getDoc(doc(db, 'usageTracking', profile.uid));
        if (usageSnap.exists()) {
          const data = usageSnap.data();
          const today = new Date().toISOString().split('T')[0];
          if (data.date === today) {
            setUsage(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoadingPayments(false);
      }
    };
    fetchData();
  }, [profile?.uid]);

  const isFree = !effectiveTier || effectiveTier === 'free';
  const planName = effectiveTier ? effectiveTier.charAt(0).toUpperCase() + effectiveTier.slice(1) : 'Free';
  
  // Calculate days remaining
  let daysRemaining = null;
  if (!isFree && profile?.subscriptionExpiry) {
    const expiry = new Date(profile.subscriptionExpiry);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    if (diffTime > 0) {
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      daysRemaining = 0;
    }
  }

  // Banner logic
  let bannerContent = null;
  let bannerStyle = "";
  if (isFree) {
    bannerContent = "Upgrade to unlock more AI-powered features.";
    bannerStyle = "bg-primary/10 border-primary/30 text-primary";
  } else if (daysRemaining === 0) {
    bannerContent = "Your subscription has expired. Renew to continue premium access.";
    bannerStyle = "bg-red-500/10 border-red-500/30 text-red-500";
  } else if (daysRemaining <= 7) {
    bannerContent = `Your subscription expires in ${daysRemaining} days.`;
    bannerStyle = "bg-amber-500/10 border-amber-500/30 text-amber-500";
  } else {
    bannerContent = `Your subscription is active until ${new Date(profile.subscriptionExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
    bannerStyle = "bg-green-500/10 border-green-500/30 text-green-500";
  }

  const TIER_LIMITS = {
    free: { chat: 10, quiz: 5, studySession: 1, learningPath: 999, flashcards: 5 },
    pro: { chat: 90, quiz: 15, studySession: 5, learningPath: 2, flashcards: 20 },
    premium: { chat: 999, quiz: 25, studySession: 8, learningPath: 5, flashcards: 30 },
    max: { chat: 999, quiz: 999, studySession: 999, learningPath: 999, flashcards: 999 }
  };
  const limits = TIER_LIMITS[effectiveTier || 'free'];

  const getBenefits = (tier) => {
    switch (tier) {
      case 'pro':
        return [
          '90 AI Tutor Messages / Day',
          '15 Quizzes / Day',
          '5 Study Sessions / Day',
          '2 Learning Paths / Day',
          'Weekly AI Reports',
          'Create Study Rooms',
          'PRO Badge'
        ];
      case 'premium':
        return [
          'Unlimited AI Tutor Messages',
          '25 Quizzes / Day',
          '8 Study Sessions / Day',
          '5 Learning Paths / Day',
          'Weekly AI Reports',
          'Detailed Analytics',
          'Exam Prep Mode',
          'PDF Export',
          'Priority AI Generation',
          'PREMIUM Badge'
        ];
      case 'max':
        return [
          'Priority AI Generation',
          'Advanced Analytics',
          'Unlimited Study Rooms',
          'Exam Prep Mode',
          'PDF Export',
          'Premium Support'
        ];
      default:
        return [
          '10 AI Tutor Messages / Day',
          '5 Quizzes / Day',
          '1 Study Session / Day',
          'Limited Learning Paths'
        ];
    }
  };

  const benefits = getBenefits(effectiveTier);

  const usageStats = [
    { key: 'chat', label: 'AI Tutor Messages' },
    { key: 'quiz', label: 'Quizzes' },
    { key: 'studySession', label: 'Study Sessions' },
    { key: 'learningPath', label: 'Learning Paths' },
    { key: 'flashcards', label: 'Flashcards' }
  ];

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
      {/* Banner */}
      <div className={`px-4 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-sm ${bannerStyle}`}>
        <Bell size={16} />
        {bannerContent}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Row 1, Col 1: Subscription Overview */}
        <div className="glass-card p-5 border-primary/20 bg-primary/5 flex flex-col h-full">
          <h3 className="font-jakarta font-black text-base mb-4 flex items-center gap-2 text-txt">
            <div className="p-1.5 rounded bg-primary/20 text-primary border border-primary/30">
              <CreditCard size={14} />
            </div>
            Subscription Overview
          </h3>
          
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="p-3 rounded-lg bg-space-800 border border-white/5 flex flex-col justify-center">
              <p className="text-[9px] font-bold text-txt3 uppercase tracking-widest mb-0.5">Current Plan</p>
              <p className="font-jakarta font-black text-lg text-primary flex items-center gap-1.5">
                {(effectiveTier === 'max' || effectiveTier === 'premium') && <Crown size={16} className="text-amber-500" />}
                {effectiveTier === 'max' ? 'MAX PLAN' : planName}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-space-800 border border-white/5 flex flex-col justify-center">
              <p className="text-[9px] font-bold text-txt3 uppercase tracking-widest mb-0.5">Status</p>
              {isFree ? (
                <p className="text-sm font-bold text-txt2">Free Tier</p>
              ) : (
                <div className="text-[10px] font-bold bg-green-500/20 text-green-500 px-2 py-0.5 rounded border border-green-500/30 inline-flex items-center gap-1.5 w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Active {daysRemaining !== null && `• ${daysRemaining} Days`}
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-space-800 border border-white/5 flex flex-col justify-center">
              <p className="text-[9px] font-bold text-txt3 uppercase tracking-widest mb-0.5">Started</p>
              <p className="text-xs font-bold text-txt2">
                {profile?.subscriptionStarted ? new Date(profile.subscriptionStarted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-space-800 border border-white/5 flex flex-col justify-center">
              <p className="text-[9px] font-bold text-txt3 uppercase tracking-widest mb-0.5">Expires</p>
              <p className="text-xs font-bold text-txt2">
                {profile?.subscriptionExpiry ? new Date(profile.subscriptionExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Row 1, Col 2: Usage Stats */}
        {effectiveTier === 'max' ? (
           <div className="glass-card p-5 flex flex-col items-center justify-center text-center bg-green-500/5 border-green-500/20 h-full min-h-[220px]">
             <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-3 shadow-glow-green">
               <Zap size={24} />
             </div>
             <h3 className="font-jakarta font-black text-xl text-green-500 mb-1">Unlimited Access</h3>
             <p className="text-xs font-medium text-txt3">You have unlimited usage across all features.</p>
           </div>
        ) : (
          <div className="glass-card p-5 flex flex-col h-full">
            <h3 className="font-jakarta font-black text-base mb-4 flex items-center gap-2 text-txt">
              <div className="p-1.5 rounded bg-cyan/20 text-cyan border border-cyan/30">
                <Activity size={14} />
              </div>
              Today's Usage
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
              {usageStats.map(stat => {
                const limit = limits[stat.key];
                const used = usage[stat.key] || 0;
                const isUnlimited = limit >= 999;
                return (
                  <div key={stat.key} className="p-3 rounded-lg bg-space-800 border border-white/5 flex flex-col justify-center gap-0.5">
                    <p className="text-[9px] font-bold text-txt3 uppercase tracking-widest">{stat.label}</p>
                    {isUnlimited ? (
                      <p className="font-jakarta font-black text-base text-green-500">Unlimited</p>
                    ) : (
                      <p className="font-jakarta font-black text-base text-txt">
                        <span className="text-primary">{used}</span> <span className="text-txt3 text-xs font-medium">/ {limit}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 2, Col 1: Included Benefits */}
        <div className="glass-card p-5 flex flex-col h-full">
          <h3 className="font-jakarta font-black text-base mb-4 flex items-center gap-2 text-txt">
            <div className="p-1.5 rounded bg-green-500/20 text-green-500 border border-green-500/30">
              <CheckCircle size={14} />
            </div>
            {effectiveTier === 'max' ? 'MAX Benefits' : `Included in ${planName}`}
          </h3>
          <ul className="flex flex-col gap-2 flex-1 justify-center">
            {benefits.map((b, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2 text-xs font-medium text-txt2">
                <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                {b}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Row 2, Col 2: Manage Plan */}
        <div className="glass-card p-5 border-cyan/20 bg-cyan/5 flex flex-col h-full">
          <div className="flex-1 flex flex-col justify-center text-center items-center">
            {effectiveTier === 'max' ? (
              <>
                <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mb-3 shadow-glow-amber">
                  <CheckCircle size={24} />
                </div>
                <h3 className="font-jakarta font-black text-xl text-amber-500 mb-1">All Features Unlocked</h3>
                <p className="text-xs text-txt3">You are on the highest possible tier.</p>
              </>
            ) : (
              <>
                <h3 className="font-jakarta font-black text-base text-txt mb-1">Manage Plan</h3>
                <p className="text-xs text-txt3 mb-4">
                  {isFree ? 'Unlock premium features by upgrading your plan.' : 'Upgrade to a higher tier or manage your current subscription.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                  {effectiveTier === 'free' && (
                    <>
                      <Link to="/pricing" className="flex-1 sm:flex-none btn-outline py-2 px-4 text-xs font-bold border-primary/30 text-primary hover:border-primary/60 hover:bg-primary/5">
                        Upgrade to Pro
                      </Link>
                      <Link to="/pricing" className="flex-1 sm:flex-none btn-primary py-2 px-4 text-xs font-bold flex justify-center items-center gap-1.5 shadow-glow-primary">
                        <Zap size={14} /> Upgrade to Premium
                      </Link>
                    </>
                  )}
                  {effectiveTier === 'pro' && (
                    <Link to="/pricing" className="btn-primary py-2 px-6 text-xs font-bold flex items-center gap-1.5 shadow-glow-primary">
                      <Zap size={14} /> Upgrade to Premium
                    </Link>
                  )}
                  {effectiveTier === 'premium' && (
                    <button className="btn-outline py-2 px-6 text-xs font-bold border-cyan/30 text-cyan hover:border-cyan/60 hover:bg-cyan/5">
                      Manage Subscription
                    </button>
                  )}
                </div>

                {(effectiveTier === 'free' || effectiveTier === 'pro') && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 w-full text-left">
                    <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1.5 mb-2">
                      <Zap size={14} /> Unlock with Premium
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {['Unlimited AI Tutor', 'Detailed Analytics', 'Exam Prep Mode', 'Priority Generation'].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-txt2">
                          <CheckCircle size={10} className="text-amber-500 flex-shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Row 3, Col 1: Payment History */}
        {!(effectiveTier === 'max' && payments.length === 0) && (
          <div className="glass-card p-5 flex flex-col h-full max-h-64 overflow-hidden">
            <h3 className="font-jakarta font-black text-base mb-4 flex items-center gap-2 text-txt">
              <div className="p-1.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                <CreditCard size={14} />
              </div>
              Payment History
            </h3>
            {loadingPayments ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
                {payments.map(p => (
                  <div key={p.id} className="p-3 rounded-lg bg-space-800 border border-white/5 flex items-center justify-between gap-2 hover:border-white/10 transition-colors">
                    <div>
                      <p className="font-bold text-txt text-xs">{p.plan === 'premium' ? 'Premium Plan' : p.plan === 'pro' ? 'Pro Plan' : p.plan}</p>
                      <p className="text-[10px] text-txt3 font-medium">
                        {p.paymentDate?.toDate ? p.paymentDate.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-jakarta font-bold text-txt text-sm">₹{p.amount}</p>
                      <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest inline-block ${
                        p.status === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'
                      }`}>
                        {p.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-space-800/50 rounded-lg border border-white/5 border-dashed p-4">
                <p className="text-xs font-medium text-txt3 text-center">No payment history available yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Row 3, Col 2: Legal Links */}
        <div className={`glass-card p-4 flex flex-col justify-center items-center h-full ${(effectiveTier === 'max' && payments.length === 0) ? 'lg:col-span-2' : ''}`}>
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-[10px] font-bold text-txt3 uppercase tracking-widest">
            <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <span className="w-1 h-1 rounded-full bg-txt3/30" />
            <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms</Link>
            <span className="w-1 h-1 rounded-full bg-txt3/30" />
            <Link to="/refund-policy" className="hover:text-primary transition-colors">Refunds</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user }                                                         = useAuth();
  const { profile, effectiveTier, refreshProfile, loadingProfile }       = useUserData();
  const [tab, setTab]                                                    = useState('profile');

  if (loadingProfile) {
    return (
      <div className="p-5 md:p-8 max-w-[1400px] mx-auto w-full flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-txt3">
          <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading your settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto w-full">
      <div className="pt-12 lg:pt-0 mb-8">
        <h1 className="font-jakarta font-black text-3xl md:text-4xl text-txt mb-2">Settings</h1>
        <p className="text-sm font-medium text-txt3">Profile, student info, security and preferences</p>
      </div>

      <div className="flex gap-2 p-2 rounded-2xl mb-8 overflow-x-auto glass-card shadow-sm border-transparent custom-scrollbar">
        {TABS.map(({ id, label, icon:Icon }) => (
          <button key={id} onClick={() => { audioSystem.playClick(); setTab(id); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs whitespace-nowrap font-bold uppercase tracking-wider transition-all flex-1 justify-center ${
              tab === id
                ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm scale-105'
                : 'text-txt3 hover:text-txt2 hover:bg-space-800'
            }`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}>
        {tab === 'profile'  && <ProfileTab  user={user} onSaved={refreshProfile} />}
        {tab === 'student'  && <StudentTab  user={user} profile={profile} onSaved={refreshProfile} />}
        {tab === 'security' && <SecurityTab user={user} />}
        {tab === 'prefs'    && <PrefsTab />}
        {tab === 'billing'  && <BillingTab profile={profile} effectiveTier={effectiveTier} />}
      </motion.div>
    </div>
  );
}