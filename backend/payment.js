import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Order, Product, sequelize } from './models.js';
import { sendOrderConfirmation } from './utils.js';

dotenv.config();

const router = express.Router();

// Razorpay Instance
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.error('Razorpay initialization failed:', err.message);
  }
} else {
  console.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Payment functionality will be disabled.');
}

// Razorpay Order Creation
router.post('/order', async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  if (!razorpay) {
    console.error('[Razorpay] Instance not initialized. Check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    return res.status(503).json({ error: 'Razorpay is not configured' });
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise (integer)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };
    
    console.log(`[Razorpay] Attempting to create order: ${JSON.stringify(options)}`);
    const order = await razorpay.orders.create(options);
    console.log(`[Razorpay] Order created successfully: ${order.id}`);
    res.json(order);
  } catch (err) {
    console.error('[Razorpay] Order Creation Error:', err);
    res.status(500).json({ 
      error: 'Failed to create Razorpay order',
      details: err.error?.description || err.message || 'Unknown Razorpay error'
    });
  }
});

// Razorpay Payment Verification
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret')
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    // Start TCL Transaction
    const t = await sequelize.transaction();
    
    try {
      // 1. Deduct stock for each item (trigger will validate this)
      for (const item of orderData.items) {
        const product = await Product.findByPk(item.productId, { transaction: t });
        if (!product) {
          throw new Error(`Product ${item.name} not found`);
        }
        await product.decrement('stock', { by: item.quantity, transaction: t });
      }

      // 2. Create Order
      const order = await Order.create({
        ...orderData,
        userId: req.user.id,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: 'paid'
      }, { transaction: t });

      // Execute TCL COMMIT
      await t.commit();

      // Broadcast to all users using io attached to app
      const io = req.app.get('io');
      if (io) {
        io.emit('newOrder', {
          id: order.id,
          userName: req.user.email,
          total: order.total,
          items: Array.isArray(order.items) ? order.items.length : 0
        });
      }

      // Send confirmation email
      sendOrderConfirmation(req.user.email, order);

      res.json({ success: true, orderId: order.id });
    } catch (err) {
      // Execute TCL ROLLBACK on error
      await t.rollback();
      console.error('Transaction failed:', err);
      res.status(500).json({ error: 'Failed to save order or insufficient stock', details: err.message });
    }
  } else {
    res.status(400).json({ error: 'Invalid signature' });
  }
});

export default router;
