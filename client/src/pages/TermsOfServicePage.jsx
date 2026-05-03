import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import BrainNexLogo from '../components/BrainNexLogo';

export default function TermsOfServicePage() {
  const navigate = useNavigate();
  useEffect(() => {
  window.scrollTo(0, 0);
}, []);

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white font-jakarta">

      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link to="/">
          <BrainNexLogo size="md" />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto px-6 py-12"
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(255,255,255,0.60)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '8px 0',
            marginBottom: '24px',
            background: 'none',
            border: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.60)'}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-white/40 mb-10">Last updated: May 1, 2026</p>

        {[
          {
            title: "1. Acceptance of Terms",
            content: `By accessing or using BrainNex at brainnex.app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. BrainNex reserves the right to update these terms at any time.`
          },
          {
            title: "2. Description of Service",
            content: `BrainNex is an AI-powered study platform for students that provides features including an AI Tutor, Quiz Generator, Learning Path Visualizer, Study Rooms, Study Sessions, and Progress Tracking. The service is provided free of charge and is intended for educational purposes.`
          },
          {
            title: "3. User Accounts",
            content: `You must create an account to access most features of BrainNex. You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration. You must be at least 13 years old to create an account. One person may not maintain multiple accounts.`
          },
          {
            title: "4. Acceptable Use",
            content: `You agree to use BrainNex only for lawful educational purposes. You must not use the platform to share harmful, offensive, or inappropriate content. You must not attempt to reverse engineer, hack, or disrupt the platform. You must not use automated tools to spam or abuse the AI features. Misuse of the AI Tutor or other features for non-educational purposes is prohibited.`
          },
          {
            title: "5. AI-Generated Content",
            content: `BrainNex uses artificial intelligence to generate educational content including tutoring responses, quizzes, and learning paths. While we strive for accuracy, AI-generated content may contain errors. BrainNex is not responsible for decisions made based on AI-generated content. Always verify important information with qualified educators or official sources.`
          },
          {
            title: "6. Study Rooms",
            content: `Study Rooms are shared spaces for collaborative learning. You are responsible for the content you post in Study Rooms. Do not share personal information, spam, or inappropriate content. BrainNex reserves the right to remove content or users that violate these terms. Room owners are responsible for managing their rooms appropriately.`
          },
          {
            title: "7. Intellectual Property",
            content: `The BrainNex name, logo, and platform design are the intellectual property of BrainNex. Content you create on the platform (notes, study materials) remains yours. AI-generated content produced through our platform may be used for your personal study purposes. You may not reproduce or redistribute BrainNex's platform code or design.`
          },
          {
            title: "8. Service Availability",
            content: `BrainNex is provided on an "as is" basis. We do not guarantee 100% uptime or uninterrupted service. We may temporarily suspend the service for maintenance or updates. The AI features depend on third-party APIs and may be affected by external service outages.`
          },
          {
            title: "9. Limitation of Liability",
            content: `BrainNex is a student-built educational project. To the maximum extent permitted by law, BrainNex shall not be liable for any indirect, incidental, or consequential damages arising from use of the platform. We are not responsible for academic outcomes based on content generated by our AI features.`
          },
          {
            title: "10. Termination",
            content: `We reserve the right to suspend or terminate accounts that violate these terms without prior notice. You may delete your account at any time through the Settings page. Upon termination, your data will be deleted from our systems within 30 days.`
          },
          {
            title: "11. Governing Law",
            content: `These Terms of Service are governed by the laws of India. Any disputes arising from use of BrainNex shall be subject to the jurisdiction of courts in India.`
          },
          {
            title: "12. Contact",
            content: `For questions about these Terms of Service, please contact us through the Contact page at brainnex.app.`
          }
        ].map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-purple-400 mb-2">{section.title}</h2>
            <p className="text-white/70 leading-relaxed">{section.content}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer */}
      <div className="border-t border-white/10 py-6 text-center text-white/30 text-sm">
        © 2026 BrainNex. All rights reserved.
      </div>
    </div>
  );
}