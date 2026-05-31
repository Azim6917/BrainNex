const express = require('express')
const router = express.Router()
const Razorpay = require('razorpay')
const crypto = require('crypto')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { verifyToken } = require('../middleware/auth')

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

const PLANS = {
  pro: {
    amount: 39900, // in paise (399 rupees)
    currency: 'INR',
    tier: 'pro',
    name: 'BrainNex Pro'
  },
  premium: {
    amount: 59900, // in paise (599 rupees)
    currency: 'INR',
    tier: 'premium',
    name: 'BrainNex Premium'
  }
}

// Create order
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const { plan } = req.body

    if (plan !== 'pro' && plan !== 'premium') {
      return res.status(400).json({ error: 'Invalid plan selected' })
    }

    const planDetails = PLANS[plan]

    const order = await razorpay.orders.create({
      amount: planDetails.amount,
      currency: planDetails.currency,
      receipt: `rcpt_${req.user.uid.substring(0,8)}_${Date.now()}`,
      notes: {
        userId: req.user.uid,
        plan: plan,
        userEmail: req.user.email || ''
      }
    })

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: plan,
      planName: planDetails.name,
      keyId: process.env.RAZORPAY_KEY_ID
    })
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ error: 'Failed to create payment order' })
  }
})

// Verify payment and activate subscription
router.post('/verify-payment', verifyToken, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan
    } = req.body

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        error: 'Payment verification failed',
        success: false 
      })
    }

    // Payment verified - activate subscription
    const db = getFirestore()
    const userRef = db.collection('users').doc(req.user.uid)
    const paymentsRef = db.collection('payments').doc(razorpay_payment_id)

    const now = new Date()
    const expiryDate = new Date(now)
    expiryDate.setMonth(expiryDate.getMonth() + 1)

    const expiryDateStr = expiryDate.toISOString().split('T')[0]
    const startedStr = now.toISOString().split('T')[0]

    const batch = db.batch()

    batch.update(userRef, {
      subscription: plan,
      subscriptionExpiry: expiryDateStr,
      subscriptionStarted: startedStr,
      lastPaymentId: razorpay_payment_id,
      lastOrderId: razorpay_order_id,
      subscriptionUpdatedAt: FieldValue.serverTimestamp()
    })

    batch.set(paymentsRef, {
      userId: req.user.uid,
      plan: plan,
      amount: PLANS[plan].amount / 100, // store in rupees
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paymentDate: FieldValue.serverTimestamp(),
      status: 'success',
      expiryDate: expiryDateStr,
      couponCode: null,
      referralCode: null
    })

    await batch.commit()

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      plan: plan,
      expiry: expiryDateStr
    })
  } catch (error) {
    console.error('Verify payment error:', error)
    res.status(500).json({ error: 'Payment verification failed' })
  }
})

// Get current subscription status
router.get('/subscription-status', verifyToken, async (req, res) => {
  try {
    const db = getFirestore()
    const userDoc = await db.collection('users').doc(req.user.uid).get()
    const userData = userDoc.data() || {}

    const { getUserTier } = require('../config/subscriptions')
    const effectiveTier = getUserTier(req.user.uid, userData.subscription, userData.subscriptionExpiry)

    res.json({
      subscription: userData.subscription || 'free',
      effectiveTier,
      expiry: userData.subscriptionExpiry || null,
      started: userData.subscriptionStarted || null
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get subscription status' })
  }
})

// Cancel subscription
router.post('/cancel-subscription', verifyToken, async (req, res) => {
  try {
    const db = getFirestore()
    const userRef = db.collection('users').doc(req.user.uid)

    await userRef.update({
      subscriptionCancelledAt: FieldValue.serverTimestamp(),
      subscriptionStatus: 'cancelled'
    })

    res.json({
      success: true,
      message: 'Subscription cancelled. Access continues until expiry date.'
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
})

module.exports = router
