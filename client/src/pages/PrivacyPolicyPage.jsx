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

        <h1 className="text-4xl font-bold mb-2">PRIVACY POLICY</h1>
        <h2 className="text-2xl font-bold mb-2 text-white/80">BrainNex — Privacy Policy</h2>
        <div className="text-white/50 mb-10 text-sm">
          <p>Effective Date: June 1, 2026</p>
          <p>Last Updated: June 1, 2026</p>
        </div>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h3 className="text-xl font-bold mb-3 text-white">1. Introduction</h3>
            <p className="mb-3">Welcome to BrainNex. This Privacy Policy explains how I, Azim Mohammed Rafique Sarwad, operating BrainNex as an individual developer, collect, use, store, and protect information about users of the BrainNex platform accessible at brainnex.app.</p>
            <p>I am committed to protecting your privacy and handling your personal data with transparency and care. By using BrainNex you agree to the collection and use of information as described in this Privacy Policy. This policy applies to all users of BrainNex including students, parents, and any other visitors to the platform.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">2. Information I Collect</h3>
            <p className="mb-3">I collect the following categories of information when you use BrainNex:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> When you register for BrainNex I collect your full name, email address, and if you use Google OAuth authentication, your Google profile name and email address. I do not collect your Google password.</li>
              <li><strong>Profile Information:</strong> Information you voluntarily provide including your grade or class, school name, curricular board, selected subjects, and study goals. Profile photographs uploaded by users are stored as base64-encoded data within our secure database.</li>
              <li><strong>Usage Data:</strong> Information about how you use the platform including quiz results, quiz questions and answers, study session content and scores, learning path data, chat conversation history with the AI Tutor, achievement badges earned, experience points accumulated, daily study streaks, and study goals created and completed.</li>
              <li><strong>Payment Information:</strong> If you subscribe to a paid plan I collect payment-related information through Razorpay, our payment processor. BrainNex does not directly collect or store your credit card numbers, debit card details, or bank account information. All payment data is handled securely by Razorpay in accordance with their Privacy Policy and PCI DSS compliance standards. I receive only a payment confirmation and transaction identifier from Razorpay.</li>
              <li><strong>Technical Data:</strong> Browser type and version, device type, operating system, IP address, pages visited, time spent on pages, and error reports collected through Sentry error monitoring software.</li>
              <li><strong>Communications:</strong> Messages you send through the Contact form are stored to enable me to respond to your inquiries.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">3. How I Use Your Information</h3>
            <p className="mb-3">I use the information collected for the following purposes:</p>
            <ul className="list-disc pl-6 mb-3 space-y-2">
              <li>To provide and operate the BrainNex platform and its AI-powered features.</li>
              <li>To personalize your learning experience based on your grade level, subjects, and performance data.</li>
              <li>To process subscription payments and manage your subscription status.</li>
              <li>To track and display your academic progress, gamification data, and achievement history.</li>
              <li>To improve the platform through analysis of usage patterns and error reports.</li>
              <li>To send important service-related communications including payment confirmations and subscription updates.</li>
              <li>To respond to your inquiries submitted through the Contact form.</li>
              <li>To enforce our Terms of Service and prevent abuse of the platform.</li>
              <li>To comply with applicable legal obligations.</li>
            </ul>
            <p>I do not use your personal data for advertising purposes. BrainNex does not display third-party advertisements and does not sell your data to advertisers.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">4. AI and Data Processing</h3>
            <p className="mb-3">BrainNex uses Anthropic Claude AI to power its tutoring, quiz generation, study session, and learning path features. When you interact with these features your messages and requests are sent to Anthropic's API for processing. Anthropic processes this data in accordance with their own Privacy Policy. I recommend reviewing Anthropic's Privacy Policy at anthropic.com for details on how they handle data.</p>
            <p>I implement conversation history trimming that limits the amount of conversation data sent to the AI API to the last six messages, minimizing the amount of personal data processed externally.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">5. Data Storage and Security</h3>
            <p className="mb-3">All BrainNex user data is stored in Firebase Firestore, a cloud database service provided by Google. Firebase implements industry-standard security measures including encryption of data in transit and at rest. User authentication is managed through Firebase Authentication which implements secure password hashing and token-based session management.</p>
            <p className="mb-3">I implement the following security measures: HTTPS encryption for all data transmission, Firebase Authentication token verification for all API requests, Firestore security rules that prevent users from accessing other users' data, environment variable protection for all API keys and sensitive credentials, and regular monitoring through Sentry error tracking.</p>
            <p>Despite these measures no system is completely secure. I cannot guarantee absolute security of your data and encourage you to use a strong unique password for your BrainNex account.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">6. Data Retention</h3>
            <p>I retain your personal data for as long as your account is active. If you delete your account or if your account is cancelled your data will be retained for thirty days before permanent deletion. Payment records may be retained for longer periods as required by applicable financial regulations. Error logs collected through Sentry are retained for ninety days.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">7. Cookies and Local Storage</h3>
            <p>BrainNex uses browser local storage to save your theme preferences, sound settings, and chat session data on your device. This data is stored locally on your device and is not transmitted to our servers. BrainNex uses session storage to manage temporary UI states such as dismissed notification banners. I may use cookies for authentication session management through Firebase Authentication.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">8. Sharing of Information</h3>
            <p className="mb-3">I do not sell, trade, or rent your personal information to third parties. I share data only with the following service providers who help operate BrainNex:</p>
            <ul className="list-disc pl-6 mb-3 space-y-2">
              <li>Firebase by Google for authentication and database services.</li>
              <li>Anthropic for AI processing of tutor and quiz requests.</li>
              <li>Razorpay for payment processing.</li>
              <li>Vercel for frontend hosting and content delivery.</li>
              <li>Render for backend server hosting.</li>
              <li>Sentry for error monitoring and performance tracking.</li>
            </ul>
            <p className="mb-3">Each of these providers has their own privacy policies and I encourage you to review them. I share only the minimum data necessary for each provider to perform their function.</p>
            <p>I may disclose your information if required by law, court order, or government authority.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">9. Children's Privacy</h3>
            <p>BrainNex serves students from Class 1 onward which includes children under the age of thirteen. I take the privacy of young users seriously. BrainNex does not knowingly collect any sensitive personal information from children beyond what is necessary to provide the educational service. The platform does not include social features that expose children's information to other users. If you are a parent or guardian and believe your child has provided personal information without your consent please contact me at sarwadazim786@gmail.com and I will promptly address the matter.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">10. Your Rights</h3>
            <p className="mb-3">You have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 mb-3 space-y-2">
              <li><strong>Right to Access:</strong> You can access your personal data through your BrainNex account dashboard and Settings page.</li>
              <li><strong>Right to Correction:</strong> You can update your profile information at any time through the Settings page.</li>
              <li><strong>Right to Deletion:</strong> You can request deletion of your account and associated data by emailing sarwadazim786@gmail.com with the subject Account Deletion Request.</li>
              <li><strong>Right to Data Portability:</strong> You can request a copy of your data by emailing sarwadazim786@gmail.com.</li>
              <li><strong>Right to Withdraw Consent:</strong> You can withdraw consent for data processing by deleting your account. Note that withdrawal of consent will result in the inability to use BrainNex services.</li>
            </ul>
            <p>To exercise any of these rights contact me at sarwadazim786@gmail.com. I will respond to all requests within thirty days.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">11. Changes to This Privacy Policy</h3>
            <p>I may update this Privacy Policy from time to time to reflect changes in the platform, legal requirements, or data practices. Significant changes will be communicated through a notice on the BrainNex website. The date of the most recent update is displayed at the top of this page. Continued use of BrainNex after changes are published constitutes acceptance of the updated Privacy Policy.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-3 text-white">12. Contact Information</h3>
            <p className="mb-2">For privacy-related inquiries contact:</p>
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