import express from 'express';
import dotenv from 'dotenv';
import { User } from './models.js';
import admin from 'firebase-admin';

dotenv.config();

const router = express.Router();

router.post('/complete-signup', async (req, res) => {
  const { email, displayName, uid } = req.body;
  if (!email || !displayName || !uid) return res.status(400).json({ error: 'All fields are required' });

  try {
    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        id: uid,
        email,
        displayName,
        password: 'FIREBASE_MANAGED', // Password handled by Firebase
        isVerified: true
      }
    });

    if (!created) {
      user.displayName = displayName;
      await user.save();
    }

    res.json({ user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } });
  } catch (err) {
    console.error('Complete Signup Error:', err);
    res.status(500).json({ error: 'Failed to complete signup in DB' });
  }
});

router.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    let user = await User.findOne({ where: { email: decodedToken.email } });
    if (!user) {
      // Create user if not exists (e.g. they signed in via Google Auth but didn't hit complete-signup)
      user = await User.create({
        id: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email.split('@')[0],
        password: 'FIREBASE_MANAGED',
        isVerified: true
      });
    }

    res.json({ id: user.id, email: user.email, displayName: user.displayName, role: user.role });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
