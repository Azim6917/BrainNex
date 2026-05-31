const ADMIN_UIDS = [
  'gmstE1crNjPIxSAeBYsJyg9NNh53'
]

const TIER_LIMITS = {
  free: {
    chat: 10,
    quiz: 5,
    studySession: 1,
    learningPath: 999, // lifetime limit handled separately
    learningPathLifetime: 1,
    flashcards: 5,
    explainAnswer: 5,
    weeklyReport: 0,
    canCreateRooms: false,
    maxGoals: 2,
    historyDays: 7,
    examMode: false,
    pdfExport: false,
    detailedAnalytics: false,
    voiceInput: false,
    studyPlanner: false,
    parentDashboard: false,
    priorityGeneration: false,
  },
  pro: {
    chat: 90,
    quiz: 15,
    studySession: 5,
    learningPath: 2,
    learningPathLifetime: 999,
    flashcards: 20,
    explainAnswer: 20,
    weeklyReport: 1,
    canCreateRooms: true,
    maxGoals: 10,
    historyDays: 30,
    examMode: false,
    pdfExport: false,
    detailedAnalytics: false,
    voiceInput: false,
    studyPlanner: false,
    parentDashboard: false,
    priorityGeneration: false,
  },
  premium: {
    chat: 999,
    quiz: 25,
    studySession: 8,
    learningPath: 5,
    learningPathLifetime: 999,
    flashcards: 30,
    explainAnswer: 30,
    weeklyReport: 1,
    canCreateRooms: true,
    maxGoals: 999,
    historyDays: 999,
    examMode: true,
    pdfExport: true,
    detailedAnalytics: true,
    voiceInput: false,
    studyPlanner: false,
    parentDashboard: false,
    priorityGeneration: true,
  },
  max: {
    chat: 999,
    quiz: 999,
    studySession: 999,
    learningPath: 999,
    learningPathLifetime: 999,
    flashcards: 999,
    explainAnswer: 999,
    weeklyReport: 999,
    canCreateRooms: true,
    maxGoals: 999,
    historyDays: 999,
    examMode: true,
    pdfExport: true,
    detailedAnalytics: true,
    voiceInput: true,
    studyPlanner: true,
    parentDashboard: true,
    priorityGeneration: true,
  }
}

const PLAN_PRICES = {
  pro: {
    name: 'Pro',
    price: 399,
    priceId: 'plan_pro_399',
    color: '#8B72FF',
    badge: 'PRO',
    tagline: 'Perfect for regular students',
  },
  premium: {
    name: 'Premium',
    price: 599,
    priceId: 'plan_premium_599',
    color: '#F59E0B',
    badge: 'PREMIUM',
    tagline: 'For serious exam warriors',
  }
}

const getUserTier = (uid, firestoreSubscription, subscriptionExpiry) => {
  if (ADMIN_UIDS.includes(uid)) return 'max'
  const validTiers = ['free', 'pro', 'premium', 'max']
  
  if (validTiers.includes(firestoreSubscription)) {
    if (firestoreSubscription === 'free') return 'free'
    
    if (subscriptionExpiry) {
      const today = new Date()
      // Set to midnight for accurate day comparison
      today.setHours(0, 0, 0, 0)
      const expiry = new Date(subscriptionExpiry)
      
      if (expiry < today) {
        return 'free'
      }
    }
    
    return firestoreSubscription
  }
  return 'free'
}

module.exports = { 
  ADMIN_UIDS, 
  TIER_LIMITS, 
  PLAN_PRICES, 
  getUserTier 
}
