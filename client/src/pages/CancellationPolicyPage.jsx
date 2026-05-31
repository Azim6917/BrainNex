import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import BrainNexLogo from '../components/BrainNexLogo';

export default function CancellationPolicyPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Cancellation Policy - BrainNex";
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

        <h1 className="text-4xl font-bold mb-2">CANCELLATION POLICY</h1>
        <h2 className="text-2xl font-bold mb-2 text-white/80">BrainNex — Cancellation Policy</h2>
        <div className="text-white/50 mb-10 text-sm">
          <p>Effective Date: June 1, 2026</p>
          <p>Last Updated: June 1, 2026</p>
        </div>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h3 className="text-xl font-bold mb-3 text-white">1. Overview</h3>
            <p>This Cancellation Policy explains how subscribers can cancel their BrainNex subscription and what happens to their account and data after cancellation. BrainNex is committed to making the cancellation process simple, transparent, and fair.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">2. How to Cancel Your Subscription</h3>
            <p className="mb-3">You can cancel your BrainNex subscription at any time through the following steps:</p>
            <ol className="list-decimal pl-6 mb-3 space-y-2">
              <li>Log in to your BrainNex account at brainnex.app.</li>
              <li>Navigate to Settings using the sidebar navigation.</li>
              <li>Click on the Subscription tab.</li>
              <li>Scroll down to find the Cancel Subscription button.</li>
              <li>Read the cancellation confirmation information.</li>
              <li>Click Confirm Cancellation to complete the process.</li>
            </ol>
            <p className="mb-3">Cancellation takes effect immediately in the system. However your access to premium features will continue until the end of your current billing period.</p>
            <p>Alternatively you can request cancellation by emailing sarwadazim786@gmail.com with the subject line <strong>Cancellation Request BrainNex</strong> and include your registered email address and reason for cancellation.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">3. What Happens After Cancellation</h3>
            <p className="mb-3">After you cancel your subscription the following applies:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your premium access continues until the end of your current paid billing period. For example if you subscribed on the first of the month and cancel on the fifteenth your premium access will continue until the end of that month.</li>
              <li>No further charges will be made to your payment method after cancellation.</li>
              <li>Your account will automatically downgrade to the Free plan at the end of the billing period.</li>
              <li>All your data including quiz history, learning paths, achievements, streak records, and study session history will be retained for thirty days after the billing period ends. After thirty days your data may be subject to deletion in accordance with the BrainNex Privacy Policy.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">4. Resubscription</h3>
            <p>You can resubscribe to any BrainNex plan at any time after cancellation by visiting the Pricing section at brainnex.app or from the Settings Subscription tab in your account. If you resubscribe within thirty days of cancellation all your previously saved data will be fully restored. If you resubscribe after thirty days your account will start fresh with default settings.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">5. Automatic Renewal</h3>
            <p>BrainNex subscriptions renew automatically at the end of each monthly billing cycle. The renewal amount will be charged to your original payment method. You will not receive a reminder before automatic renewal. To avoid being charged for another month you must cancel your subscription before the renewal date. The renewal date is the same date each month as your original subscription start date.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">6. Failed Payments</h3>
            <p>If a renewal payment fails due to insufficient funds, expired card, or any other reason BrainNex will attempt to process the payment again. If the payment continues to fail your subscription will be automatically cancelled and your account will revert to the Free plan. You will receive an email notification to your registered email address if a payment fails.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">7. Cancellation by BrainNex</h3>
            <p>BrainNex reserves the right to cancel or suspend any subscription without prior notice in cases of violation of the Terms of Service, suspected fraudulent activity, abuse of the platform or its AI features, or any other conduct that BrainNex determines to be harmful to the platform or its users. In such cases no refund will be issued for the remaining subscription period.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">8. Data After Cancellation</h3>
            <p className="mb-3">Upon cancellation your account data is handled as follows:</p>
            <ul className="list-disc pl-6 mb-3 space-y-2">
              <li>Your profile information is retained for thirty days.</li>
              <li>Your quiz history and results are retained for thirty days.</li>
              <li>Your learning paths and study session history are retained for thirty days.</li>
              <li>Your achievement badges and XP records are retained for thirty days.</li>
            </ul>
            <p>After thirty days all data associated with your account may be permanently deleted from BrainNex servers. If you wish to export your data before deletion please contact sarwadazim786@gmail.com before the thirty day period expires.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">9. Contact Information</h3>
            <p className="mb-2">For cancellation assistance contact:</p>
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
