import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import BrainNexLogo from '../components/BrainNexLogo';

export default function RefundPolicyPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Refund & Cancellation Policy - BrainNex";
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

        <h1 className="text-4xl font-bold mb-2">Refund & Cancellation Policy</h1>
        <div className="text-white/40 mb-10 text-sm">
          <p>Effective Date: May 31, 2026</p>
          <p>Last Updated: May 31, 2026</p>
        </div>

        {[
          {
            title: "1. Digital Services Nature",
            content: `BrainNex subscriptions provide access to digital educational services powered by AI. Due to the immediate access to these digital resources and the direct costs associated with processing AI requests through third-party APIs, our services are generally non-refundable once they have been accessed.`
          },
          {
            title: "2. Subscription Cancellations",
            content: `Users may cancel their subscription at any time through the Settings page. Cancellation prevents future automatic renewals but does not automatically entitle you to a refund. Upon cancellation, your premium access remains available until the current subscription period expires.`
          },
          {
            title: "3. Refund Requests",
            content: `While subscriptions are generally non-refundable, BrainNex recognizes that exceptional circumstances may occur. Duplicate payments, billing errors, technical issues preventing access, or other exceptional circumstances may be reviewed if reported within 7 days of the purchase date. BrainNex reserves the right to approve or deny any refund requests after review.`
          },
          {
            title: "4. Processing Refunds",
            content: `If a refund request is approved, the refund will be processed and credited back to the original payment method used for the transaction. Please allow a few business days for the credit to reflect in your account, depending on your bank or payment provider.`
          },
          {
            title: "5. Contact Information",
            content: `To submit a refund request or if you have questions regarding this policy, please contact our support team at sarwadazim786@gmail.com with your account details and the reason for your request.`
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
