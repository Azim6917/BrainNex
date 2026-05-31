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

        <h1 className="text-4xl font-bold mb-2">TERMS OF SERVICE</h1>
        <h2 className="text-2xl font-bold mb-2 text-white/80">BrainNex — Terms of Service</h2>
        <div className="text-white/50 mb-10 text-sm">
          <p>Effective Date: June 1, 2026</p>
          <p>Last Updated: June 1, 2026</p>
        </div>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h3 className="text-xl font-bold mb-3 text-white">1. Acceptance of Terms</h3>
            <p>By accessing or using BrainNex at brainnex.app you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree to these terms you must not use the BrainNex platform. BrainNex is developed and operated by Azim Mohammed Rafique Sarwad as an individual developer. These Terms of Service constitute a legally binding agreement between you and BrainNex.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">2. Description of Service</h3>
            <p className="mb-3">BrainNex is an AI-powered personalized learning platform designed for students from Class 1 through Class 12 and beyond. The platform provides the following services: an AI Chat Tutor powered by Anthropic Claude AI, a Smart Quiz Generator for creating custom subject assessments, Study Sessions with AI-generated lesson content, a Learning Path Visualizer for structured topic progression, Study Rooms for collaborative group learning, an Achievements and Gamification system, Study Goals tracking, and subscription-based premium features.</p>
            <p>BrainNex is provided on an as-is and as-available basis. I reserve the right to modify, suspend, or discontinue any aspect of the service at any time with or without notice.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">3. User Accounts</h3>
            <p className="mb-3">To access certain features of BrainNex you must create an account. You agree to provide accurate, current, and complete information during registration and to update this information to keep it accurate and current. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify me immediately at sarwadazim786@gmail.com if you suspect unauthorized access to your account. BrainNex will not be liable for any loss or damage arising from unauthorized use of your account.</p>
            <p>You must be at least thirteen years of age to create a BrainNex account independently. Users under thirteen years of age may use BrainNex only with verifiable parental consent and parental involvement.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">4. Subscription Terms</h3>
            <p>BrainNex offers a free tier and paid subscription plans. Paid subscriptions are billed monthly and renew automatically at the end of each billing cycle. By subscribing to a paid plan you authorize BrainNex and its payment processor Razorpay to charge your payment method the applicable subscription fee on a recurring monthly basis until you cancel. Subscription fees are non-refundable except as specified in the BrainNex Refund Policy. You may cancel your subscription at any time through the Settings page. Cancellation takes effect at the end of the current billing period. BrainNex reserves the right to change subscription prices with thirty days advance notice to subscribers. Continued use of the platform after a price change constitutes acceptance of the new pricing.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">5. Acceptable Use</h3>
            <p>By using BrainNex you agree to use the platform only for lawful educational purposes and in accordance with these Terms of Service. You agree not to use BrainNex to submit false, misleading, or fraudulent information. You agree not to attempt to gain unauthorized access to any part of the platform or to another user's account. You agree not to use automated tools, bots, or scripts to access or interact with the platform. You agree not to attempt to reverse engineer, decompile, or extract the source code of BrainNex. You agree not to use the AI Tutor or any other feature to generate content that is harmful, offensive, illegal, or violates the rights of others. You agree not to share your account credentials with others or allow multiple users to use a single account. You agree not to abuse the free tier usage limits through multiple account creation or other circumvention methods. You agree not to reproduce, distribute, or commercially exploit any content generated by BrainNex without explicit written permission.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">6. AI-Generated Content</h3>
            <p>BrainNex uses Anthropic Claude AI to generate educational content including tutor responses, quiz questions, study session lessons, and learning paths. AI-generated content is provided for educational purposes only. While I make efforts to ensure the quality and accuracy of AI-generated content I cannot guarantee that all content is completely accurate, current, or suitable for every user's specific educational needs. AI-generated content should not be used as the sole source of information for critical academic decisions. BrainNex is not liable for any errors, inaccuracies, or omissions in AI-generated content. Users are encouraged to verify important information through official educational resources including textbooks, teachers, and official curriculum materials.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">7. Intellectual Property</h3>
            <p>BrainNex and its original content, features, functionality, and design are owned by Azim Mohammed Rafique Sarwad and are protected by applicable intellectual property laws. The BrainNex name, logo, and brand identity are proprietary to BrainNex. AI-generated content produced in response to your specific queries is provided for your personal educational use. You may not reproduce, distribute, or commercially exploit AI-generated content from BrainNex without permission.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">8. Privacy</h3>
            <p>Your use of BrainNex is also governed by the BrainNex Privacy Policy which is incorporated into these Terms of Service by reference. Please review the Privacy Policy at brainnex.app/privacy-policy to understand our data practices.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">9. Payment and Billing</h3>
            <p>All payments on BrainNex are processed by Razorpay, a third-party payment processor. By providing payment information you represent that you are authorized to use the payment method and authorize the charges described. All prices are listed in Indian Rupees and include applicable taxes where required. BrainNex uses Razorpay's secure payment infrastructure and does not store your payment card information. In case of payment disputes you agree to first contact BrainNex at sarwadazim786@gmail.com before initiating a chargeback with your bank or card provider.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">10. Limitation of Liability</h3>
            <p>To the maximum extent permitted by applicable law BrainNex and its developer Azim Mohammed Rafique Sarwad shall not be liable for any indirect, incidental, special, consequential, or punitive damages including but not limited to loss of data, loss of academic progress, or any other damages arising from your use of or inability to use the BrainNex platform. In no event shall BrainNex's total liability to you for all claims exceed the amount you have paid to BrainNex in the twelve months preceding the claim.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">11. Disclaimers</h3>
            <p>BrainNex is an educational technology tool and is not a substitute for qualified human teachers, tutors, or educational institutions. The platform is designed to supplement and support learning, not to replace traditional education. BrainNex does not guarantee any specific academic outcomes, examination results, or grades as a result of using the platform. Results depend on individual student effort, engagement, and many factors outside the control of BrainNex.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">12. Termination</h3>
            <p>I reserve the right to suspend or terminate your account at any time for violation of these Terms of Service, abusive behavior toward the platform or other users, suspected fraudulent activity, or any other conduct I determine to be harmful. Upon termination your right to use BrainNex ceases immediately. Provisions of these Terms of Service that by their nature should survive termination shall survive including intellectual property provisions, disclaimers, and limitations of liability.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">13. Governing Law</h3>
            <p>These Terms of Service are governed by the laws of India. Any disputes arising from these Terms or your use of BrainNex shall be subject to the exclusive jurisdiction of the courts of Maharashtra, India.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">14. Changes to Terms</h3>
            <p>I reserve the right to modify these Terms of Service at any time. Changes will be posted on this page with an updated effective date. Significant changes will be communicated through a notice on the BrainNex website. Your continued use of BrainNex after changes are posted constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">15. Contact Information</h3>
            <p className="mb-2">For questions about these Terms of Service contact:</p>
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