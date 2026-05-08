import { sequelize } from '../backend/models.js';

export const dbCheck = async (req, res, next) => {
  if (req.path.startsWith('/api/health')) return next();
  
  try {
    await sequelize.authenticate();
    next();
  } catch (err) {
    return res.status(503).json({ 
      error: 'Database connection is not established. Please check server logs and MySQL configuration.',
      status: 'disconnected'
    });
  }
};
