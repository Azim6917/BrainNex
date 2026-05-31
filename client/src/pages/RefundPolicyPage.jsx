import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import BrainNexLogo from '../components/BrainNexLogo';

export default function RefundPolicyPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Refund Policy - BrainNex";
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
        className="max-w-3xl mx-auto px-6 py-12 font-serif"
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
            fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.60)'}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <h1 className="text-4xl font-bold mb-2">REFUND POLICY</h1>
        <h2 className="text-2xl font-bold mb-2 text-white/80">BrainNex — Refund Policy</h2>
        <div className="text-white/50 mb-10 text-sm">
          <p>Effective Date: June 1, 2026</p>
          <p>Last Updated: June 1, 2026</p>
        </div>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h3 className="text-xl font-bold mb-3 text-white">1. Overview</h3>
            <p className="mb-3">At BrainNex, I am committed to ensuring that every student has a satisfying experience with the platform. This Refund Policy outlines the terms and conditions under which refunds may be issued for subscription purchases made on brainnex.app. By subscribing to any paid plan on BrainNex, you agree to the terms of this Refund Policy.</p>
            <p>BrainNex is developed and operated by Azim Mohammed Rafique Sarwad as an individual proprietorship. All subscription transactions are processed securely through Razorpay.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">2. Subscription Plans</h3>
            <p className="mb-3">BrainNex currently offers the following paid subscription plans:</p>
            <ul className="list-disc pl-6 mb-3 space-y-2">
              <li><strong>Pro Plan</strong> at rupees 399 per month, which provides enhanced daily usage limits and access to additional features including the ability to create study rooms, weekly AI reports, and extended history.</li>
              <li><strong>Premium Plan</strong> at rupees 599 per month, which provides higher daily usage limits, detailed analytics, exam preparation mode, PDF export of study notes, and priority AI generation.</li>
            </ul>
            <p>All plans are billed on a monthly basis. Subscriptions renew automatically at the end of each billing period unless cancelled by the subscriber.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">3. Eligibility for Refund</h3>
            <p className="mb-3">A refund request may be considered eligible under the following conditions:</p>
            <ul className="list-disc pl-6 mb-3 space-y-2">
              <li>The request is submitted within seven calendar days of the original purchase date.</li>
              <li>The subscriber has not extensively used the premium features during the refund window.</li>
              <li>The subscriber provides a valid reason for the refund request.</li>
              <li>The payment was processed successfully and the subscription was activated.</li>
            </ul>
            <p>Refund requests submitted after seven calendar days from the purchase date will not be eligible for consideration except in exceptional circumstances at the sole discretion of BrainNex.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">4. Non-Refundable Circumstances</h3>
            <p className="mb-3">The following circumstances are not eligible for refunds:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscription periods that have been active for more than seven calendar days from the purchase date.</li>
              <li>Requests based on dissatisfaction with AI response quality as AI-generated content is inherently variable in nature.</li>
              <li>Situations where the subscriber has violated the Terms of Service of BrainNex.</li>
              <li>Duplicate purchase refund requests made after more than seven days.</li>
              <li>Partial month refunds for subscriptions that have been cancelled mid-cycle.</li>
              <li>Requests from subscribers who have previously received a refund for the same or a different BrainNex subscription.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">5. How to Request a Refund</h3>
            <p className="mb-3">To request a refund send an email to sarwadazim786@gmail.com with the subject line <strong>Refund Request BrainNex</strong> and include the following information in your email:</p>
            <ul className="list-disc pl-6 mb-3 space-y-2">
              <li>Your full name as registered on BrainNex.</li>
              <li>Your registered email address.</li>
              <li>The subscription plan you purchased.</li>
              <li>The date of purchase.</li>
              <li>Your Razorpay payment ID if available, which can be found in your payment confirmation email.</li>
              <li>A brief reason for your refund request.</li>
            </ul>
            <p>Refund requests submitted through any other channel including social media or the contact form may not be processed. All refund requests must be submitted via email to the address provided above.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">6. Refund Processing</h3>
            <p className="mb-3">Upon receipt of a valid refund request I will review the request within three to five business days and respond to your registered email address with the decision. If your refund request is approved the refund will be processed within five to seven business days from the date of approval. Refunds will be issued to the original payment method used for the purchase. BrainNex does not issue refunds in the form of cash, credits, or alternative payment methods.</p>
            <p>Processing times may vary depending on your bank or payment provider and are outside the control of BrainNex.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">7. Subscription Cancellation After Refund</h3>
            <p>If a refund is approved your subscription will be cancelled immediately upon processing of the refund. Access to premium features will be revoked upon cancellation. Your account data including quiz history, achievements, and learning paths will be retained for thirty days following cancellation after which it may be deleted.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">8. Technical Issues</h3>
            <p>If you are experiencing technical issues that are preventing you from accessing subscribed features please contact me at sarwadazim786@gmail.com before submitting a refund request. I will make every effort to resolve technical issues promptly. If the issue cannot be resolved within a reasonable timeframe a full refund will be issued.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">9. Changes to This Policy</h3>
            <p>BrainNex reserves the right to modify this Refund Policy at any time. Changes will be communicated through the website and will take effect immediately upon publication. Continued use of the platform after changes are published constitutes acceptance of the updated policy. For subscriptions purchased before a policy change the terms at the time of purchase will apply.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">10. Contact Information</h3>
            <p className="mb-2">For all refund inquiries contact:</p>
            <ul className="list-none space-y-1">
              <li><strong>Name:</strong> Azim Mohammed Rafique Sarwad</li>
              <li><strong>Email:</strong> sarwadazim786@gmail.com</li>
              <li><strong>Website:</strong> brainnex.app</li>
              <li><strong>Response time:</strong> Within 3 business days</li>
            </ul>
          </section>
        </div>
      </motion.div>

      <div className="border-t border-white/10 py-6 text-center text-white/30 text-sm font-jakarta">
        © 2026 BrainNex. All rights reserved.
      </div>
    </div>
  );
}
