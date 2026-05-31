import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import BrainNexLogo from '../components/BrainNexLogo';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Privacy Policy - BrainNex";
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white font-jakarta">

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

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <div className="text-white/40 mb-10 text-sm">
          <p>Effective Date: May 31, 2026</p>
          <p>Last Updated: May 31, 2026</p>
        </div>

        {[
          {
            title: "1. Information Collected",
            content: `When you register on BrainNex, we collect your account information (name, email address, profile picture) provided through Firebase Authentication. We also collect learning preferences, study goals, usage analytics (quiz results, session history), and payment information when you subscribe to a premium plan.`
          },
          {
            title: "2. Firebase Authentication and Firestore Data Storage",
            content: `BrainNex utilizes Firebase Authentication to securely manage user sign-ups and logins. Your account data, progress, study materials, and app preferences are stored securely in a Firebase Firestore database hosted by Google. We rely on Firebase's robust security infrastructure to protect your data.`
          },
          {
            title: "3. Anthropic AI Services",
            content: `BrainNex uses Anthropic AI services to generate learning paths, quizzes, explanations, flashcards, and other educational content. Information submitted through AI-powered features may be processed through Anthropic APIs to provide these services. Please review Anthropic's privacy policies for more information on how they handle API data.`
          },
          {
            title: "4. Razorpay Payment Processing",
            content: `For premium subscriptions, BrainNex uses Razorpay as our payment processor. We do not directly store your credit card or bank account details. Your payment information is securely transmitted to and processed by Razorpay.`
          },
          {
            title: "5. Hosting Infrastructure",
            content: `BrainNex is hosted on secure cloud infrastructure providers. Your interactions with the platform are transmitted securely over HTTPS.`
          },
          {
            title: "6. Cookies and Local Storage",
            content: `BrainNex uses browser local storage to save your theme preference, session information, and local app settings. We do not use third-party tracking cookies or advertising cookies of any kind.`
          },
          {
            title: "7. Data Retention",
            content: `We retain your personal data for as long as your account is active or as needed to provide you the BrainNex services. If you cancel a premium subscription, we still retain your study history and progress data so you can continue using the free tier.`
          },
          {
            title: "8. User Rights and Account Deletion Requests",
            content: `You have the right to access, update, or delete your personal data. You can update your profile information in the Settings page. To request complete account deletion, please contact us at sarwadazim786@gmail.com. Upon request, we will remove your personal data from our active systems within a reasonable timeframe.`
          },
          {
            title: "9. Security Practices",
            content: `We implement industry-standard security measures to protect your personal information, including encryption in transit and relying on secure third-party services like Firebase and Razorpay. However, no internet transmission is entirely secure, and we cannot guarantee absolute data security.`
          },
          {
            title: "10. Contact Us",
            content: `If you have any questions about this Privacy Policy, please contact us at sarwadazim786@gmail.com.`
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

      <div className="border-t border-white/10 py-6 text-center text-white/30 text-sm">
        © 2026 BrainNex. All rights reserved.
      </div>
    </div>
  );
}