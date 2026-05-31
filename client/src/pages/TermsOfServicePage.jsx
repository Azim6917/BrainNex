import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import BrainNexLogo from '../components/BrainNexLogo';

export default function TermsOfServicePage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Terms of Service - BrainNex";
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

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <div className="text-white/40 mb-10 text-sm">
          <p>Effective Date: May 31, 2026</p>
          <p>Last Updated: May 31, 2026</p>
        </div>

        {[
          {
            title: "1. Acceptance of Terms",
            content: `By accessing or using BrainNex at brainnex.app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. BrainNex reserves the right to update these terms at any time.`
          },
          {
            title: "2. Description of Service",
            content: `BrainNex is an AI-powered study platform for students that provides features including an AI Tutor, Quiz Generator, Learning Path Visualizer, Study Rooms, Study Sessions, and Progress Tracking.`
          },
          {
            title: "3. Subscription Plans",
            content: `BrainNex offers both free and premium subscription plans (Pro and Premium). Premium plans provide increased AI limits and additional features. Details of what is included in each plan are available on our Pricing page.`
          },
          {
            title: "4. Billing & Payments",
            content: `Premium subscriptions require payment. Payments are processed securely via Razorpay. By choosing a premium plan, you authorize BrainNex and our payment processor to charge your selected payment method.`
          },
          {
            title: "5. Plan Expiry",
            content: `Subscription plans automatically expire at the end of the billing period unless auto-renewed or extended. Once a plan expires, your account will revert to the free tier limits, but your data and progress will remain accessible.`
          },
          {
            title: "6. Acceptable Use",
            content: `You agree to use BrainNex only for lawful educational purposes. You must not use the platform to share harmful, offensive, or inappropriate content. You must not attempt to reverse engineer, hack, or disrupt the platform. You must not use automated tools to spam or abuse the AI features.`
          },
          {
            title: "7. AI-Generated Content Disclaimer",
            content: `AI-generated content is provided for educational assistance purposes only. While BrainNex strives to provide useful and accurate educational content, AI-generated responses may contain inaccuracies, omissions, or outdated information. Users should independently verify important information.`
          },
          {
            title: "8. Intellectual Property",
            content: `The BrainNex name, logo, and platform design are the intellectual property of BrainNex. Content you create on the platform remains yours. AI-generated content produced through our platform may be used for your personal study purposes.`
          },
          {
            title: "9. Account Suspension or Termination",
            content: `We reserve the right to suspend or terminate accounts that violate these Terms of Service without prior notice or refund.`
          },
          {
            title: "10. Refund & Cancellation Reference",
            content: `BrainNex subscriptions are generally non-refundable once digital services have been accessed. Please refer to our complete Refund & Cancellation Policy for specific details on how to request a review of exceptional circumstances.`
          },
          {
            title: "11. Limitation of Liability",
            content: `BrainNex is provided on an "as is" basis. To the maximum extent permitted by law, BrainNex shall not be liable for any indirect, incidental, or consequential damages arising from the use of the platform. We are not responsible for academic outcomes based on content generated by our AI features.`
          },
          {
            title: "12. Changes to Services",
            content: `BrainNex is continuously evolving. We may add, modify, or remove features and services at any time. We will endeavor to notify users of significant changes.`
          },
          {
            title: "13. Contact Information",
            content: `For questions about these Terms of Service, please contact us at sarwadazim786@gmail.com.`
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