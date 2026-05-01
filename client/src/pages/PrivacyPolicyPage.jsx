import { motion } from 'framer-motion';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white font-jakarta">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <img src="/images/BrainNex_logo.png" alt="BrainNex" className="w-8 h-8" />
        <span className="text-lg font-bold text-white">BrainNex</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto px-6 py-16"
      >
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/40 mb-10">Last updated: May 1, 2026</p>

        {[
          {
            title: "1. Information We Collect",
            content: `When you register on BrainNex, we collect your name, email address, and profile information provided through Firebase Authentication. We also collect usage data such as study sessions, quiz results, learning path progress, and XP points to personalize your experience.`
          },
          {
            title: "2. How We Use Your Information",
            content: `We use your information to provide and improve our AI-powered study features including the AI Tutor, Quiz Generator, Learning Path Visualizer, and Study Rooms. Your data helps us personalize your learning experience, track your progress, and award achievements.`
          },
          {
            title: "3. AI and Data Processing",
            content: `BrainNex uses Anthropic's Claude AI to power its tutoring, quiz generation, and learning path features. Your study queries and inputs may be processed by Anthropic's API to generate responses. We do not store your conversation history beyond what is needed to provide the service. Please refer to Anthropic's privacy policy at anthropic.com for details on how they handle data.`
          },
          {
            title: "4. Data Storage",
            content: `Your account data, progress, and study materials are stored securely in Firebase Firestore by Google. We do not sell, trade, or rent your personal information to third parties. Your data is stored on Google's secure servers and protected by industry-standard encryption.`
          },
          {
            title: "5. Cookies and Local Storage",
            content: `BrainNex uses browser local storage to save your theme preference (dark/light mode) and session information. We do not use third-party tracking cookies or advertising cookies of any kind.`
          },
          {
            title: "6. Study Rooms",
            content: `Messages sent in Study Rooms are transmitted via real-time socket connections and may be temporarily stored to support the session. Study materials added to rooms are stored in Firebase Firestore. Do not share sensitive personal information in public study rooms.`
          },
          {
            title: "7. Children's Privacy",
            content: `BrainNex is designed for students including those under 18. We do not knowingly collect personal information from children under 13 without parental consent. If you are a parent and believe your child has provided us personal information, please contact us and we will delete it promptly.`
          },
          {
            title: "8. Your Rights",
            content: `You have the right to access, update, or delete your personal data at any time. You can update your profile information in Settings. To request complete account deletion, contact us at the email below and we will remove your data from our systems within 30 days.`
          },
          {
            title: "9. Changes to This Policy",
            content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Continued use of BrainNex after changes constitutes acceptance of the updated policy.`
          },
          {
            title: "10. Contact Us",
            content: `If you have any questions about this Privacy Policy, please contact us at: brainnex.app — You can also reach us through the Contact page on our website.`
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