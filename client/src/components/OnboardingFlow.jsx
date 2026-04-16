import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { playClick, playOnboardingStep, playComplete } from '../utils/soundEffects';
import toast from 'react-hot-toast';
import BrainNexLogo from './BrainNexLogo';

const GRADES = [
  'Class 1','Class 2','Class 3','Class 4','Class 5',
  'Class 6','Class 7','Class 8','Class 9','Class 10',
  'Class 11','Class 12','B.Tech / B.E.','B.Sc','Other',
];

/* Subjects differ by grade level */
const JUNIOR_SUBJECTS = [
  { emoji:'🔢', name:'Maths' },
  { emoji:'🔬', name:'Science' },
  { emoji:'📖', name:'English' },
  { emoji:'🌍', name:'Social Studies' },
  { emoji:'🎨', name:'Art' },
  { emoji:'🎵', name:'Music' },
];
const SENIOR_SUBJECTS = [
  { emoji:'🧮', name:'Mathematics' },{ emoji:'⚗️', name:'Chemistry' },
  { emoji:'⚡', name:'Physics' },    { emoji:'🔬', name:'Biology' },
  { emoji:'💻', name:'Computer Science' },{ emoji:'📜', name:'History' },
  { emoji:'🌍', name:'Geography' },  { emoji:'📚', name:'Literature' },
  { emoji:'💰', name:'Economics' },  { emoji:'🧠', name:'Psychology' },
];

const GOALS = [
  { id:'fun',       label:  'Learn for fun!',       icon:'🎮', desc:'Explore and enjoy at my own pace' },
  { id:'improve',   label: 'Get better at school',  icon:'📈', desc:'Improve my grades and understanding' },
  { id:'exam-prep', label: 'Prepare for exams',     icon:'📋', desc:'Focused study for upcoming tests' },
  { id:'daily',     label: 'Study every day',       icon:'🔥', desc:'Build a consistent daily habit' },
];

const STEPS = [
  { title:"Welcome to BrainNex! 🧠", sub:"Let's set up your learning in 3 quick steps." },
  { title:"What do you study?",       sub:"Pick all subjects you want to work on." },
  { title:"What's your main goal?",   sub:"This helps us personalise your experience." },
];

function isJuniorGrade(grade) {
  return ['Class 1','Class 2','Class 3','Class 4','Class 5'].includes(grade);
}

export default function OnboardingFlow({ onComplete }) {
  const { user }     = useAuth();
  const { setKidMode } = useTheme();
  const [step,     setStep]     = useState(0);
  const [grade,    setGrade]    = useState('');
  const [subjects, setSubjects] = useState([]);
  const [goal,     setGoal]     = useState('');
  const [loading,  setLoading]  = useState(false);

  const isJunior   = isJuniorGrade(grade);
  const subjectList= isJunior ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS;

  const toggleSubject = s => {
    playClick();
    setSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  };

  const next = () => {
    if (step === 0 && !grade) { toast.error('Please pick your grade'); return; }
    if (step === 1 && subjects.length === 0) { toast.error('Pick at least one subject'); return; }
    playOnboardingStep();
    setStep(s => s + 1);
  };

  const finish = async () => {
    if (!goal) { toast.error('Pick a goal'); return; }
    setLoading(true);
    try {
      const junior = isJuniorGrade(grade);
      await updateDoc(doc(db, 'users', user.uid), {
        grade,
        subjects,
        studyGoal:        goal,
        onboardingDone:   true,
        isKidMode:        junior,
        currentDifficulty: junior ? 'beginner' : 'intermediate',
      });
      if (junior) setKidMode(true);
      playComplete();
      toast.success(junior ? 'Yay! Welcome to BrainNex! 🎉' : 'All set! Welcome to BrainNex 🧠');
      onComplete();
    } catch { toast.error('Setup failed, please try again'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background:'var(--bg)' }}>
      <div className="absolute w-80 h-80 rounded-full blur-[90px] -top-10 -left-10 pointer-events-none"
        style={{ background:'var(--cyan-bg)' }} />
      <div className="absolute w-64 h-64 rounded-full blur-[80px] bottom-0 right-0 pointer-events-none"
        style={{ background:'rgba(167,139,250,0.08)' }} />

      <div className="w-full max-w-lg relative">
        <div className="flex justify-center mb-8"><BrainNexLogo size="lg" /></div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <motion.div key={i}
              animate={{ width: i === step ? 32 : 8 }}
              className="h-2 rounded-full"
              style={{ background: i <= step ? 'var(--cyan)' : 'var(--border2)' }}
              transition={{ duration:0.3 }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
            transition={{ duration:0.22 }}
            className="glass rounded-3xl p-7"
            style={{ border:'1px solid var(--border)' }}>

            <h2 className="font-syne font-black text-2xl mb-1" style={{ color:'var(--txt)' }}>{STEPS[step].title}</h2>
            <p className="text-sm mb-6" style={{ color:'var(--txt2)' }}>{STEPS[step].sub}</p>

            {/* Step 0 — Grade */}
            {step === 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color:'var(--txt3)' }}>Junior School</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {GRADES.slice(0,5).map(g => (
                    <button key={g} onClick={() => { playClick(); setGrade(g); }}
                      className="px-4 py-2 rounded-full text-sm border transition-all font-medium"
                      style={{
                        background:   g === grade ? 'var(--cyan-bg)'  : 'transparent',
                        borderColor:  g === grade ? 'var(--cyan)'      : 'var(--border2)',
                        color:        g === grade ? 'var(--cyan)'      : 'var(--txt2)',
                      }}>
                      {g}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color:'var(--txt3)' }}>Middle & Senior School</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {GRADES.slice(5,12).map(g => (
                    <button key={g} onClick={() => { playClick(); setGrade(g); }}
                      className="px-4 py-2 rounded-full text-sm border transition-all font-medium"
                      style={{
                        background:  g === grade ? 'var(--cyan-bg)' : 'transparent',
                        borderColor: g === grade ? 'var(--cyan)'    : 'var(--border2)',
                        color:       g === grade ? 'var(--cyan)'    : 'var(--txt2)',
                      }}>
                      {g}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color:'var(--txt3)' }}>Higher Education</p>
                <div className="flex flex-wrap gap-2">
                  {GRADES.slice(12).map(g => (
                    <button key={g} onClick={() => { playClick(); setGrade(g); }}
                      className="px-4 py-2 rounded-full text-sm border transition-all font-medium"
                      style={{
                        background:  g === grade ? 'var(--cyan-bg)' : 'transparent',
                        borderColor: g === grade ? 'var(--cyan)'    : 'var(--border2)',
                        color:       g === grade ? 'var(--cyan)'    : 'var(--txt2)',
                      }}>
                      {g}
                    </button>
                  ))}
                </div>
                {isJunior && (
                  <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                    className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm"
                    style={{ background:'var(--cyan-bg)', border:'1px solid var(--cyan-bdr)', color:'var(--cyan)' }}>
                    🌟 Great choice! We'll make BrainNex extra fun and friendly for you!
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 1 — Subjects */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-2">
                {subjectList.map(({ emoji, name }) => {
                  const sel = subjects.includes(name);
                  return (
                    <button key={name} onClick={() => toggleSubject(name)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm text-left transition-all"
                      style={{
                        background:  sel ? 'var(--cyan-bg)' : 'transparent',
                        borderColor: sel ? 'var(--cyan)'    : 'var(--border2)',
                        color:       sel ? 'var(--txt)'     : 'var(--txt2)',
                      }}>
                      <span className="text-xl">{emoji}</span>
                      <span className="font-medium">{name}</span>
                      {sel && <span className="ml-auto text-xs" style={{ color:'var(--cyan)' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2 — Goal */}
            {step === 2 && (
              <div className="space-y-3">
                {GOALS.map(g => (
                  <button key={g.id} onClick={() => { playClick(); setGoal(g.id); }}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all"
                    style={{
                      background:  goal === g.id ? 'var(--cyan-bg)' : 'transparent',
                      borderColor: goal === g.id ? 'var(--cyan)'    : 'var(--border2)',
                    }}>
                    <span className="text-3xl">{g.icon}</span>
                    <div>
                      <p className="font-syne font-bold text-base" style={{ color: goal===g.id ? 'var(--cyan)' : 'var(--txt)' }}>{g.label}</p>
                      <p className="text-xs" style={{ color:'var(--txt3)' }}>{g.desc}</p>
                    </div>
                    {goal === g.id && (
                      <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background:'var(--cyan)' }}>✓</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-7">
              {step > 0 && (
                <button onClick={() => { playClick(); setStep(s => s-1); }} className="btn-outline py-3 px-6 text-sm">← Back</button>
              )}
              {step < 2 ? (
                <button onClick={next} className="btn-cyan flex-1 py-3 text-sm font-semibold">Continue →</button>
              ) : (
                <button onClick={finish} disabled={loading} className="btn-cyan flex-1 py-3 text-sm font-semibold">
                  {loading ? 'Setting up...' : "Let's go! 🚀"}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-xs mt-4" style={{ color:'var(--txt3)' }}>You can change these in Settings anytime</p>
      </div>
    </div>
  );
}
