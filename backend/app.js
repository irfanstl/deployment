import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

import authRoutes from './auth.js';
import paymentRoutes from './payment.js';
import productRoutes from './routes/products.js';
import apiRoutes from './routes.js';
import { Log, sequelize, User } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Firebase Admin (Using SERVICE_ACCOUNT from .env or mock for dev)
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET
      });
      console.log('Firebase Admin initialized with SERVICE_ACCOUNT');
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET
      });
      console.log('Firebase Admin initialized with applicationDefault');
    }
  } catch (err) {
    console.warn('Firebase Admin init failed. Defaulting to mock user for dev.', err.message);
  }
}

const app = express();

// Handle Netlify / Vercel path prefix normalization
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '/api');
  }
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

app.use(cors());
app.use(express.json());

// Simple hello / health-check endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: "Hello from backend" });
});

app.get('/api/health', (req, res) => {
  res.json({ status: "ok" });
});

// Middleware to check DB connection for protected/write endpoints
app.use(async (req, res, next) => {
  if (
    req.path.includes('health') ||
    req.path.includes('hello') ||
    req.path.includes('products')
  ) {
    return next();
  }
  try {
    await sequelize.authenticate();
    next();
  } catch (err) {
    return res.status(503).json({
      error: 'Database connection is not established.',
      status: 'disconnected'
    });
  }
});

// Logging Middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (body) {
    res.send = originalSend;
    const response = res.send(body);

    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const userId = req.user?.id || null;
      const suspicious = res.statusCode >= 400 && (req.body?.email?.includes("'") || req.path?.includes('admin'));

      Log.create({
        userId, ip, method: req.method, path: req.path, status: res.statusCode, userAgent, suspicious
      }).catch(() => {});
    } catch (_) {
      // Never crash response on logging failures
    }

    return response;
  };
  next();
});

// Public Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Authentication Middleware for protected routes
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get role from MySQL User table
    const userRecord = await User.findOne({ where: { email: decodedToken.email }});
    req.user = {
      id: userRecord ? userRecord.id : decodedToken.uid,
      email: decodedToken.email,
      role: userRecord ? userRecord.role : 'customer'
    };
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Protected Routes
app.use('/api/razorpay', authenticate, paymentRoutes);
app.use('/api', authenticate, apiRoutes);

export default app;
