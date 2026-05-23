import express from 'express';
import { User, Order, Log, RFQ, Product } from './models.js';
import { sendShippingUpdate, sendOrderConfirmation } from './utils.js';
import { upload, uploadFileToCloud } from './firebaseStorage.js';

const router = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

// RFQ Routes
router.post('/rfq', async (req, res) => {
  try {
    const rfq = await RFQ.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, id: rfq.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit RFQ' });
  }
});

// Order Routes
router.post('/orders', async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, userId: req.user.id });

    const io = req.app.get('io');
    if (io) {
      io.emit('newOrder', {
        id: order.id,
        userName: req.user.email,
        total: order.total,
        items: Array.isArray(order.items) ? order.items.length : 0
      });
    }

    sendOrderConfirmation(req.user.email, order);
    res.json({ id: order.id, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.put('/orders/:id/status', isAdmin, async (req, res) => {
  const { status, deliveryTime } = req.body;
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['email'] }]
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    if (deliveryTime) order.deliveryTime = deliveryTime;
    await order.save();

    if (status === 'shipped' && order.user?.email) {
      sendShippingUpdate(order.user.email, order);
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

router.delete('/orders/:id', isAdmin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await order.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await Order.findAll({
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['email', 'displayName'] }]
      });
    } else {
      orders = await Order.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// User Profile Routes
router.get('/users/profile', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/users/profile', async (req, res) => {
  try {
    await User.update(req.body, { where: { id: req.user.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// User Management for Admin
router.get('/admin/users', isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.delete('/admin/users/:id', isAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/admin/logs', isAdmin, async (req, res) => {
  try {
    const logs = await Log.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100,
      include: [{ model: User, attributes: ['email'] }]
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Admin Product Routes
router.post('/admin/products', isAdmin, upload.single('media'), async (req, res) => {
  try {
    const { name, price, category, stock, description, image } = req.body;
    let imageUrl = image || '';

    // If a media file was uploaded, send it to Firebase Storage
    if (req.file) {
      imageUrl = await uploadFileToCloud(req.file);
    }

    const product = await Product.create({
      name,
      price: parseFloat(price),
      category,
      stock: parseInt(stock, 10) || 0,
      description,
      image: imageUrl, 
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error('Failed to create product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/admin/products/:id', isAdmin, upload.single('media'), async (req, res) => {
  try {
    const { name, price, category, stock, description, image } = req.body;
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let imageUrl = image !== undefined ? image : product.image;
    if (req.file) {
      imageUrl = await uploadFileToCloud(req.file);
    }

    await product.update({
      name,
      price: parseFloat(price),
      category,
      stock: parseInt(stock, 10) || 0,
      description,
      image: imageUrl,
    });

    res.json(product);
  } catch (err) {
    console.error('Failed to update product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/admin/products/:id', isAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    await product.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
