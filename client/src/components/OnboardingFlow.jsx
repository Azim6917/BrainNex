import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { playClick, playComplete } from '../utils/soundEffects';
import toast from 'react-hot-toast';
import BrainNexLogo from './BrainNexLogo';

const GRADES = ['Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12','B.Tech / B.E.','B.Sc','Other'];
const SUBJECTS = [
  { emoji:'🧮', name:'Mathematics' },{ emoji:'⚗️', name:'Chemistry' },
  { emoji:'⚡', name:'Physics' },    { emoji:'🔬', name:'Biology' },
  { emoji:'💻', name:'Computer Science' },{ emoji:'📜', name:'History' },
  { emoji:'🌍', name:'Geography' },  { emoji:'📚', name:'Literature' },
  { emoji:'💰', name:'Economics' },  { emoji:'🧠', name:'Psychology' },
];
const GOALS = [
  { id:'5-daily',    label:'5 quizzes/day',     icon:'🎯', desc:'Focused daily practice' },
  { id:'exam-prep',  label:'Exam preparation',  icon:'📋', desc:'Intensive study sessions' },
  { id:'casual',     label:'Casual learning',   icon:'😊', desc:'Learn at my own pace' },
  { id:'improve',    label:'Improve weak areas',icon:'📈', desc:'Fix my problem topics' },
];

const steps = [
  { title: "Welcome to BrainNex! 🧠", sub: "Let's personalize your learning in 3 quick steps." },
  { title: "What do you study?",       sub: "Pick all subjects you want to improve in." },
  { title: "What's your main goal?",   sub: "This helps us tailor your experience." },
];

export default function OnboardingFlow({ onComplete }) {
  const { user }   = useAuth();
  const [step,     setStep]     = useState(0);
  const [grade,    setGrade]    = useState('');
  const [subjects, setSubjects] = useState([]);
  const [goal,     setGoal]     = useState('');
  const [loading,  setLoading]  = useState(false);

  const toggleSubject = (s) => {
    playClick();
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const next = () => {
    if (step === 0 && !grade) { toast.error('Please select your grade'); return; }
    if (step === 1 && subjects.length === 0) { toast.error('Pick at least one subject'); return; }
    playClick();
    setStep(s => s + 1);
  };

  const finish = async () => {
    if (!goal) { toast.error('Please select a goal'); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        grade,
        subjects,
        studyGoal:       goal,
        onboardingDone:  true,
        currentDifficulty: 'beginner',
      });
      playComplete();
      toast.success('All set! Welcome to BrainNex 🎉');
      onComplete();
    } catch (err) {
      toast.error('Setup failed, please try again');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-brand-bg z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Background orbs */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan/8 blur-[100px] -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-72 h-72 rounded-full bg-violet-500/8 blur-[100px] bottom-0 right-0 pointer-events-none" />

      <div className="w-full max-w-lg relative">
        {/* Logo */}
        <div className="flex justify-center mb-8"><BrainNexLogo size="lg" /></div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <motion.div key={i} animate={{ width: i === step ? 32 : 8, opacity: i <= step ? 1 : 0.3 }}
              className="h-2 rounded-full bg-cyan" transition={{ duration: 0.3 }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="glass border border-brand-border rounded-3xl p-7">

            <h2 className="font-syne font-black text-2xl mb-1">{steps[step].title}</h2>
            <p className="text-white/40 text-sm mb-6">{steps[step].sub}</p>

            {/* Step 0 — Grade */}
            {step === 0 && (
              <div className="flex flex-wrap gap-2">
                {GRADES.map(g => (
                  <button key={g} onClick={() => { playClick(); setGrade(g); }}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${g === grade ? 'bg-cyan/20 border-cyan/50 text-cyan font-semibold' : 'border-brand-border text-white/50 hover:border-brand-border2 hover:text-white'}`}>
                    {g}
                  </button>
                ))}
              </div>
            )}

            {/* Step 1 — Subjects */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map(({ emoji, name }) => {
                  const selected = subjects.includes(name);
                  return (
                    <button key={name} onClick={() => toggleSubject(name)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm text-left transition-all ${selected ? 'bg-cyan/15 border-cyan/50 text-white' : 'border-brand-border text-white/50 hover:border-brand-border2'}`}>
                      <span className="text-xl">{emoji}</span>
                      <span className="font-medium">{name}</span>
                      {selected && <span className="ml-auto text-cyan text-xs">✓</span>}
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
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all ${goal === g.id ? 'bg-cyan/15 border-cyan/50' : 'border-brand-border hover:border-brand-border2'}`}>
                    <span className="text-3xl">{g.icon}</span>
                    <div>
                      <p className={`font-syne font-bold text-base ${goal === g.id ? 'text-cyan' : 'text-white'}`}>{g.label}</p>
                      <p className="text-xs text-white/40">{g.desc}</p>
                    </div>
                    {goal === g.id && <div className="ml-auto w-5 h-5 rounded-full bg-cyan flex items-center justify-center text-brand-bg text-xs font-bold">✓</div>}
                  </button>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-7">
              {step > 0 && (
                <button onClick={() => { playClick(); setStep(s => s - 1); }}
                  className="btn-outline py-3 px-6 text-sm">← Back</button>
              )}
              {step < 2 ? (
                <button onClick={next} className="btn-cyan flex-1 py-3 text-sm font-semibold">
                  Continue →
                </button>
              ) : (
                <button onClick={finish} disabled={loading} className="btn-cyan flex-1 py-3 text-sm font-semibold disabled:opacity-50">
                  {loading ? 'Setting up...' : "Let's go! 🚀"}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-xs text-white/20 mt-4">You can change these later in Settings</p>
      </div>
    </div>
  );
}
