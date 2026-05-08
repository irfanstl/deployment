import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { connectDB } from './db.js';
import admin from 'firebase-admin';

dotenv.config();

// Initialize Firebase Admin (Using SERVICE_ACCOUNT from .env or mock for dev)
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized with SERVICE_ACCOUNT');
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log('Firebase Admin initialized with applicationDefault');
    }
  } catch (err) {
    console.warn('Firebase Admin init failed. Defaulting to mock user for dev.', err.message);
  }
}

import authRoutes from './auth.js';
import paymentRoutes from './payment.js';
import productRoutes from './routes/products.js';
import apiRoutes from './routes.js';
import { Log, sequelize, User } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  app.set('io', io);
  const PORT = process.env.PORT || 3000;

  await connectDB();

  app.use(cors());
  app.use(express.json());

  // Middleware to check DB connection
  app.use(async (req, res, next) => {
    if (req.path.startsWith('/api/health')) return next();
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

      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const userId = req.user?.id || null;
      const suspicious = res.statusCode >= 400 && (req.body?.email?.includes("'") || req.path.includes('admin'));

      Log.create({
        userId, ip, method: req.method, path: req.path, status: res.statusCode, userAgent, suspicious
      }).catch(err => console.error('Logging error:', err));

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, '../dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
