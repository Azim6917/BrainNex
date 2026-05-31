import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Clock, X } from 'lucide-react'

export default function UpgradePrompt({ 
  isOpen, 
  onClose, 
  featureName, 
  upgradeMessage, 
  userTier,
  resetTime 
}) {
  const navigate = useNavigate()
  
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', 
      justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#1a1a2e',
        border: '1.5px solid rgba(139,114,255,0.25)',
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'transparent', border: 'none',
          color: 'rgba(255,255,255,0.4)', cursor: 'pointer'
        }}>
          <X size={18} />
        </button>

        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(245,158,11,0.15)',
          border: '1.5px solid rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 20px'
        }}>
          <Zap size={28} color="#F59E0B" />
        </div>

        <h2 style={{
          fontSize: '22px', fontWeight: '900',
          color: '#F0EBFF', marginBottom: '10px'
        }}>
          Daily Limit Reached
        </h2>

        <p style={{
          fontSize: '14px', color: 'rgba(240,235,255,0.6)',
          marginBottom: '8px', lineHeight: '1.6'
        }}>
          You have used all your free {featureName} for today.
        </p>

        <p style={{
          fontSize: '13px', color: '#8B72FF',
          marginBottom: '24px', lineHeight: '1.6',
          background: 'rgba(139,114,255,0.08)',
          border: '1px solid rgba(139,114,255,0.2)',
          borderRadius: '12px', padding: '12px'
        }}>
          {upgradeMessage}
        </p>

        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '6px',
          fontSize: '12px', color: 'rgba(240,235,255,0.4)',
          marginBottom: '24px'
        }}>
          <Clock size={13} />
          <span>Resets at midnight tonight</span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              onClose();
              navigate('/#pricing');
            }}
            style={{
              flex: 1, padding: '12px',
              background: 'linear-gradient(135deg, #8B72FF, #6C4FE8)',
              border: 'none', borderRadius: '12px',
              color: '#fff', fontWeight: '700',
              fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(139,114,255,0.35)'
            }}
          >
            View Plans →
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: '600', fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Come Back Tomorrow
          </button>
        </div>
      </div>
    </div>
  )
}
