import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function PaymentButton({ plan, children, className }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    if (!user) {
      navigate(`/register?plan=${plan}`)
      return
    }

    setLoading(true)

    try {
      const token = await user.getIdToken()
      
      // Create order
      const orderRes = await api.post('/payments/create-order', { plan })
      const orderData = orderRes.data



      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'BrainNex',
        description: `${orderData.planName} Subscription`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyRes = await api.post('/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan
            })

            const verifyData = verifyRes.data

            if (verifyData.success) {
              window.location.href = '/app/dashboard?subscribed=true'
            } else {
              alert('Payment verification failed. Contact support.')
            }
          } catch (err) {
            console.error('Verify error:', err)
            alert('Payment verification failed. Contact support.')
          }
        },
        prefill: {
          email: user.email || '',
          name: user.displayName || ''
        },
        theme: {
          color: plan === 'pro' ? '#8B72FF' : '#F59E0B'
        },
        modal: {
          ondismiss: () => setLoading(false)
        }
      }

      const razorpayWindow = new window.Razorpay(options)
      razorpayWindow.open()
    } catch (err) {
      console.error('Payment error:', err)
      alert(err.message || 'Payment failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={className}
    >
      {loading ? 'Processing...' : children}
    </button>
  )
}
