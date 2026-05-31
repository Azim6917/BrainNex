import React from 'react'
import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LockedFeature({
  children,
  userTier,
  requiredTier = 'pro',
  featureName = 'this feature',
  fallbackMessage = null,
  minimal = false
}) {
  const navigate = useNavigate()

  const tierRanks = { free: 0, pro: 1, premium: 2, max: 3 }
  const hasAccess = tierRanks[userTier] >= tierRanks[requiredTier]

  if (hasAccess) {
    return children
  }

  if (minimal) {
    return (
      <button
        onClick={() => navigate('/#pricing')}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
      >
        <Lock size={14} className="text-[#8B72FF]" />
        <span>Unlock {featureName}</span>
      </button>
    )
  }

  return (
    <div className="relative group rounded-2xl overflow-hidden border border-gray-800 bg-[#161622] p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 z-0" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-4 shadow-lg">
          <Lock size={20} className="text-[#8B72FF]" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          {featureName} is locked
        </h3>
        <p className="text-sm text-gray-400 mb-6 max-w-sm">
          {fallbackMessage || `Upgrade to ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} to access ${featureName.toLowerCase()} and boost your productivity.`}
        </p>
        <button
          onClick={() => navigate('/#pricing')}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#8B72FF] to-[#6C4FE8] shadow-[0_4px_16px_rgba(139,114,255,0.3)] hover:scale-105 active:scale-95 transition-all"
        >
          View Upgrade Plans →
        </button>
      </div>
    </div>
  )
}
