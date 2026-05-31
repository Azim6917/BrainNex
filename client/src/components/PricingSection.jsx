import React, { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import PaymentButton from './PaymentButton';

const PLANS = [
  {
    tier: 'free',
    title: 'Free',
    price: 0,
    yearlyPrice: 0,
    tagline: 'Start your learning journey',
    color: '#6B7280',
    features: [
      { text: '10 AI tutor messages per day', included: true },
      { text: '5 quizzes per day', included: true },
      { text: '1 study session per day', included: true },
      { text: '1 learning path (lifetime)', included: true },
      { text: '5 flashcard sets per day', included: true },
      { text: 'Join study rooms', included: true },
      { text: '2 study goals', included: true },
      { text: 'All achievement badges', included: true },
      { text: '7 days history', included: true },
      { text: 'Weekly AI report', included: false },
      { text: 'Create study rooms', included: false },
      { text: 'Detailed analytics', included: false },
      { text: 'Exam prep mode', included: false },
      { text: 'PDF export', included: false },
      { text: 'Priority support', included: false },
    ]
  },
  {
    tier: 'pro',
    title: 'Pro',
    badge: 'MOST POPULAR',
    price: 399,
    yearlyPrice: 3192,
    crossedOut: 4788,
    tagline: 'Perfect for regular students',
    color: '#8B72FF',
    features: [
      { text: '90 AI tutor messages per day', included: true },
      { text: '15 quizzes per day', included: true },
      { text: '5 study sessions per day', included: true },
      { text: '2 learning paths per day', included: true },
      { text: '20 flashcard sets per day', included: true },
      { text: 'Create and join study rooms', included: true },
      { text: '10 study goals', included: true },
      { text: 'All achievement badges', included: true },
      { text: '30 days history', included: true },
      { text: 'Weekly AI report', included: true },
      { text: 'Email support', included: true },
      { text: 'PRO badge on profile', included: true },
      { text: 'Detailed analytics', included: false },
      { text: 'Exam prep mode', included: false },
      { text: 'PDF export', included: false },
      { text: 'Priority generation', included: false },
    ]
  },
  {
    tier: 'premium',
    title: 'Premium',
    badge: 'BEST VALUE',
    price: 599,
    yearlyPrice: 4792,
    crossedOut: 7188,
    tagline: 'For serious exam warriors',
    color: '#F59E0B',
    features: [
      { text: 'Unlimited AI tutor messages', included: true },
      { text: '25 quizzes per day', included: true },
      { text: '8 study sessions per day', included: true },
      { text: '5 learning paths per day', included: true },
      { text: '30 flashcard sets per day', included: true },
      { text: 'Create and join study rooms', included: true },
      { text: 'Unlimited study goals', included: true },
      { text: 'All achievement badges', included: true },
      { text: 'Full history forever', included: true },
      { text: 'Weekly AI report', included: true },
      { text: 'Detailed analytics dashboard', included: true },
      { text: 'Exam prep mode', included: true },
      { text: 'PDF export of study notes', included: true },
      { text: 'Priority AI generation', included: true },
      { text: 'PREMIUM badge on profile', included: true },
      { text: 'Priority email support', included: true },
    ]
  }
];

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6 lg:px-8 bg-brand-bg relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-sans font-extrabold text-4xl lg:text-5xl tracking-tight mb-4 text-white">Pricing Plans</h2>
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-bold ${!yearly ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
            <button 
              onClick={() => setYearly(!yearly)}
              className="w-14 h-7 rounded-full bg-space-800 border border-white/10 relative transition-colors"
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-primary transition-all ${yearly ? 'left-[30px]' : 'left-1'}`} />
            </button>
            <span className={`text-sm font-bold flex items-center gap-2 ${yearly ? 'text-white' : 'text-gray-500'}`}>
              Yearly <span className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded-full">SAVE 20%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center max-w-6xl mx-auto mb-20">
          {PLANS.map((plan, i) => {
            const isPro = plan.tier === 'pro';
            const isPremium = plan.tier === 'premium';
            
            return (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-[#1a1a2e] rounded-3xl p-8 flex flex-col ${isPro ? 'border-2 shadow-[0_0_30px_rgba(139,114,255,0.15)] bg-[#1e1e36]' : isPremium ? 'border-2 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'border border-gray-700'}`}
                style={{ borderColor: isPro ? plan.color : isPremium ? plan.color : '#374151' }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 right-6 text-[10px] font-bold px-3 py-1 rounded-full text-white tracking-widest shadow-lg"
                    style={{ background: isPremium ? '#F59E0B' : '#8B72FF', color: isPremium ? '#000' : '#fff' }}>
                    {plan.badge}
                  </div>
                )}
                
                <h3 className="text-2xl font-bold mb-2 text-white">{plan.title}</h3>
                <p className="text-sm text-gray-400 mb-6">{plan.tagline}</p>
                
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      ₹{yearly && plan.yearlyPrice ? Math.floor(plan.yearlyPrice/12) : plan.price}
                    </span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  {yearly && plan.crossedOut && (
                    <div className="text-sm text-gray-500 mt-1 flex gap-2">
                      <span className="line-through">₹{plan.crossedOut}/year</span>
                      <span className="text-green-500 font-bold">Billed ₹{plan.yearlyPrice}/year</span>
                    </div>
                  )}
                  {yearly && !plan.crossedOut && plan.price === 0 && (
                    <div className="text-sm text-gray-500 mt-1">Free forever</div>
                  )}
                </div>

                {plan.price === 0 ? (
                  <a href="/register" className="block text-center py-3 rounded-xl font-bold text-sm bg-gray-700/50 hover:bg-gray-700 text-white transition-colors mb-8 border border-gray-600">
                    Get Started Free →
                  </a>
                ) : (
                  <PaymentButton plan={plan.tier} className="w-full py-3 rounded-xl font-bold text-sm text-white transition-transform hover:scale-[1.02] active:scale-95 mb-8 shadow-lg"
                    style={{ background: isPremium ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'linear-gradient(135deg, #8B72FF, #6C4FE8)' }}>
                    Start {plan.title} Plan →
                  </PaymentButton>
                )}

                <div className="flex-1 space-y-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      {feature.included ? (
                        <CheckCircle size={18} className="shrink-0" style={{ color: plan.color }} />
                      ) : (
                        <X size={18} className="text-gray-600 shrink-0" />
                      )}
                      <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>{feature.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="max-w-4xl mx-auto mb-24">
          <h2 className="text-3xl font-bold text-center mb-10 text-white">Compare Features</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="py-4 px-6 text-gray-400 font-medium">Feature</th>
                  <th className="py-4 px-6 font-bold text-center text-white">Free</th>
                  <th className="py-4 px-6 font-bold text-[#8B72FF] text-center">Pro</th>
                  <th className="py-4 px-6 font-bold text-[#F59E0B] text-center">Premium</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-300">
                <tr className="border-b border-gray-800/50"><td className="py-4 px-6">AI Tutor Messages</td><td className="py-4 px-6 text-center">10/day</td><td className="py-4 px-6 text-center text-[#8B72FF]">90/day</td><td className="py-4 px-6 text-center text-[#F59E0B]">Unlimited</td></tr>
                <tr className="border-b border-gray-800/50"><td className="py-4 px-6">Quizzes</td><td className="py-4 px-6 text-center">5/day</td><td className="py-4 px-6 text-center text-[#8B72FF]">15/day</td><td className="py-4 px-6 text-center text-[#F59E0B]">25/day</td></tr>
                <tr className="border-b border-gray-800/50"><td className="py-4 px-6">Study Sessions</td><td className="py-4 px-6 text-center">1/day</td><td className="py-4 px-6 text-center text-[#8B72FF]">5/day</td><td className="py-4 px-6 text-center text-[#F59E0B]">8/day</td></tr>
                <tr className="border-b border-gray-800/50"><td className="py-4 px-6">Learning Paths</td><td className="py-4 px-6 text-center">1 lifetime</td><td className="py-4 px-6 text-center text-[#8B72FF]">2/day</td><td className="py-4 px-6 text-center text-[#F59E0B]">5/day</td></tr>
                <tr className="border-b border-gray-800/50"><td className="py-4 px-6">Weekly AI Report</td><td className="py-4 px-6 text-center text-gray-600"><X size={16} className="mx-auto" /></td><td className="py-4 px-6 text-center text-[#8B72FF]"><CheckCircle size={16} className="mx-auto" /></td><td className="py-4 px-6 text-center text-[#F59E0B]"><CheckCircle size={16} className="mx-auto" /></td></tr>
                <tr className="border-b border-gray-800/50"><td className="py-4 px-6">Detailed Analytics</td><td className="py-4 px-6 text-center text-gray-600"><X size={16} className="mx-auto" /></td><td className="py-4 px-6 text-center text-gray-600"><X size={16} className="mx-auto" /></td><td className="py-4 px-6 text-center text-[#F59E0B]"><CheckCircle size={16} className="mx-auto" /></td></tr>
                <tr className="border-b border-gray-800/50"><td className="py-4 px-6">Priority Generation</td><td className="py-4 px-6 text-center text-gray-600"><X size={16} className="mx-auto" /></td><td className="py-4 px-6 text-center text-gray-600"><X size={16} className="mx-auto" /></td><td className="py-4 px-6 text-center text-[#F59E0B]"><CheckCircle size={16} className="mx-auto" /></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-white">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h4 className="text-lg font-bold mb-2 text-white">Can I cancel anytime?</h4>
              <p className="text-gray-400 text-sm">Yes. Cancel from Settings anytime. Access continues until end of billing period.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h4 className="text-lg font-bold mb-2 text-white">Is my data safe if I cancel?</h4>
              <p className="text-gray-400 text-sm">Yes. Your quiz history, achievements and progress are saved for 30 days after cancellation.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h4 className="text-lg font-bold mb-2 text-white">What payment methods are accepted?</h4>
              <p className="text-gray-400 text-sm">UPI (GPay, PhonePe, Paytm), Credit Card, Debit Card, Net Banking through Razorpay.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h4 className="text-lg font-bold mb-2 text-white">Will I get a refund if not satisfied?</h4>
              <p className="text-gray-400 text-sm">Yes. Refund requests within 7 days of purchase are reviewed. Contact sarwadazim786@gmail.com.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h4 className="text-lg font-bold mb-2 text-white">Is there a student discount?</h4>
              <p className="text-gray-400 text-sm">BrainNex is already priced for Indian students. Pro at ₹399 is less than one coaching class fee.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
