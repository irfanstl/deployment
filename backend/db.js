import bcrypt from 'bcryptjs';
import { sequelize, User } from './models.js';

export const connectDB = async () => {
  try {
    console.log('Attempting to connect to MySQL...');
    await sequelize.authenticate();
    console.log('Connected to MySQL successfully.');

    // Sync all models (Creates tables and alters them if relationships/columns changed)
    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    // Seed Admin User
    const adminEmail = 'admin@nexus.com';
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (!existingAdmin) {
      const hashedPassword = bcrypt.hashSync('adminpassword123', 10);
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        displayName: 'Nexus Admin',
        role: 'admin',
      });
      console.log('Admin user seeded: admin@nexus.com / adminpassword123');
    }
  } catch (err) {
    console.error('CRITICAL: MySQL connection failed.');
    console.error('Error details:', err.message);
    console.error('Please make sure MySQL is running and your credentials in .env are correct (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE).');
  }
};
