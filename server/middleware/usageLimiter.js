const { getFirestore } = require('firebase-admin/firestore')
const { getUserTier, TIER_LIMITS } = require('../config/subscriptions')

function usageLimiter(featureKey) {
  return async (req, res, next) => {
    try {
      const uid = req.user?.uid
      if (!uid) return next()

      const db = getFirestore()
      
      const userDoc = await db.collection('users').doc(uid).get()
      const userData = userDoc.data() || {}
      const firestoreSubscription = userData.subscription || 'free'
      const userTier = getUserTier(uid, firestoreSubscription, userData.subscriptionExpiry)
      const limits = TIER_LIMITS[userTier]
      const limit = limits[featureKey]

      req.userTier = userTier
      req.tierLimits = limits

      if (limit >= 999) return next()

      if (featureKey === 'weeklyReport' && limit === 0) {
        return res.status(403).json({
          error: 'Feature not available',
          feature: featureKey,
          userTier,
          upgradeRequired: true,
          upgradeMessage: 'Weekly AI Report is available on Pro plan at just ₹399 per month.',
          canUpgrade: true
        })
      }

      const today = new Date().toISOString().split('T')[0]
      const usageRef = db.collection('usageTracking').doc(uid)
      const usageSnap = await usageRef.get()
      let usageData = usageSnap.exists ? usageSnap.data() : {}

      if (usageData.date !== today) {
        usageData = { date: today }
      }

      const currentCount = usageData[featureKey] || 0

      if (currentCount >= limit) {
        const upgradeMessages = {
          free: {
            pro: `Upgrade to Pro at ₹399/month for ${
              featureKey === 'chat' ? '90 daily messages' :
              featureKey === 'quiz' ? '15 quizzes per day' :
              featureKey === 'studySession' ? '5 study sessions per day' :
              'more daily usage'
            } and unlock more features!`,
          },
          pro: {
            premium: `Upgrade to Premium at ₹599/month for ${
              featureKey === 'chat' ? 'unlimited messages' :
              featureKey === 'quiz' ? '25 quizzes per day' :
              featureKey === 'studySession' ? '8 study sessions per day' :
              'more daily usage'
            } and advanced features!`,
          }
        }

        const upgradeMessage = upgradeMessages[userTier]?.premium || 
                               upgradeMessages[userTier]?.pro || 
                               'Come back tomorrow for more usage.'

        return res.status(429).json({
          error: 'Daily limit reached',
          feature: featureKey,
          limit,
          used: currentCount,
          userTier,
          upgradeRequired: userTier !== 'max',
          upgradeMessage,
          resetTime: 'Resets at midnight',
          canUpgrade: userTier !== 'max'
        })
      }

      if (featureKey === 'learningPath') {
        const lifetimeLimit = limits.learningPathLifetime
        if (lifetimeLimit < 999) {
          const lifetimeCount = usageData.learningPathLifetime_count || 0
          if (lifetimeCount >= lifetimeLimit) {
            return res.status(429).json({
              error: 'Lifetime limit reached',
              feature: 'learningPathLifetime',
              limit: lifetimeLimit,
              used: lifetimeCount,
              userTier,
              upgradeRequired: true,
              upgradeMessage: `You've reached your lifetime limit of ${lifetimeLimit} learning paths on the ${userTier} plan. Upgrade to unlock more!`,
              resetTime: 'Never',
              canUpgrade: true
            })
          }
          usageData.learningPathLifetime_count = lifetimeCount + 1
        }
      }

      usageData[featureKey] = currentCount + 1
      await usageRef.set(usageData, { merge: true })

      next()
    } catch (err) {
      console.error('Usage limiter error:', err)
      next()
    }
  }
}

module.exports = usageLimiter
