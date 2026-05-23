import mongoose from 'mongoose';
import { sequelize, User as MysqlUser, Product as MysqlProduct, Order as MysqlOrder, Log as MysqlLog, Review as MysqlReview, RFQ as MysqlRFQ } from './models.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // Make sure to load the env from root

// Mongoose Models Setup
const userSchema = new mongoose.Schema({
  email: { type: String },
  password: { type: String },
  displayName: String,
  role: { type: String },
  address: String,
  city: String,
  state: String,
  zip: String,
  isVerified: { type: Boolean },
  otp: String,
  otpExpiry: Date,
  createdAt: { type: Date },
});

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  stock: Number,
  sku: { type: String },
  tierPricing: [{ minQuantity: Number, discountPercentage: Number }],
  isRfqOnly: { type: Boolean },
  dimensions: {
    shankDiameter: String,
    fluteLength: String,
    overallLength: String,
    tolerance: String,
  },
  materialCompatibility: [String],
  coating: String,
  technicalDocs: {
    speedsAndFeedsUrl: String,
    sdsUrl: String,
  },
  createdAt: { type: Date },
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
  }],
  total: Number,
  status: { type: String },
  shippingAddress: String,
  paymentId: String,
  orderId: String,
  deliveryTime: String,
  createdAt: { type: Date },
});

const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ip: String,
  method: String,
  path: String,
  status: Number,
  userAgent: String,
  suspicious: { type: Boolean },
  reason: String,
  createdAt: { type: Date },
});

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  userName: { type: String },
  rating: { type: Number },
  comment: { type: String },
  createdAt: { type: Date },
});

const rfqSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: Number,
  details: String,
  status: { type: String },
  createdAt: { type: Date },
});

const MongoUser = mongoose.model('User', userSchema);
const MongoProduct = mongoose.model('Product', productSchema);
const MongoOrder = mongoose.model('Order', orderSchema);
const MongoLog = mongoose.model('Log', logSchema);
const MongoReview = mongoose.model('Review', reviewSchema);
const MongoRFQ = mongoose.model('RFQ', rfqSchema);

async function migrate() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('No MONGODB_URI found in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    console.log('Connecting to MySQL to ensure database exists...');
    const mysql2 = await import('mysql2/promise');
    const connection = await mysql2.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || ''
    });
    const dbName = process.env.MYSQL_DATABASE || 'nexus_ecom';
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    await connection.query(`CREATE DATABASE \`${dbName}\`;`);
    await connection.end();

    console.log('Connecting to MySQL with Sequelize...');
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // drop and recreate tables for clean migration
    console.log('Connected to MySQL and synced tables.');

    // Users
    console.log('Migrating Users...');
    const mongoUsers = await MongoUser.find().lean();
    const userMap = {}; 
    
    for (const mu of mongoUsers) {
      if (!mu.email) continue;
      const [mysqlUser, created] = await MysqlUser.findOrCreate({
        where: { email: mu.email },
        defaults: {
          password: mu.password || 'temp_password',
          displayName: mu.displayName,
          role: mu.role || 'customer',
          address: mu.address,
          city: mu.city,
          state: mu.state,
          zip: mu.zip,
          isVerified: mu.isVerified || false,
          otp: mu.otp,
          otpExpiry: mu.otpExpiry,
          createdAt: mu.createdAt || new Date()
        }
      });
      userMap[mu._id.toString()] = mysqlUser.id;
    }
    console.log(`Migrated ${mongoUsers.length} Users.`);

    // Products
    console.log('Migrating Products...');
    const mongoProducts = await MongoProduct.find().lean();
    const productMap = {};
    for (const mp of mongoProducts) {
      try {
        const mysqlProduct = await MysqlProduct.create({
          name: mp.name,
          description: mp.description,
          price: mp.price,
          category: mp.category,
          image: mp.image,
          stock: mp.stock,
          sku: mp.sku,
          tierPricing: mp.tierPricing,
          isRfqOnly: mp.isRfqOnly,
          dimensions: mp.dimensions,
          materialCompatibility: mp.materialCompatibility,
          coating: mp.coating,
          technicalDocs: mp.technicalDocs,
          createdAt: mp.createdAt || new Date()
        });
        productMap[mp._id.toString()] = mysqlProduct.id;
      } catch (err) {
        console.warn('Skipping product due to error:', mp.name, err.message);
      }
    }
    console.log(`Migrated ${mongoProducts.length} Products.`);

    // Orders
    console.log('Migrating Orders...');
    const mongoOrders = await MongoOrder.find().lean();
    for (const mo of mongoOrders) {
      try {
        const mappedItems = (mo.items || []).map(item => ({
          ...item,
          productId: item.productId ? productMap[item.productId.toString()] : null
        }));

        await MysqlOrder.create({
          userId: mo.userId ? userMap[mo.userId.toString()] : null,
          items: mappedItems,
          total: mo.total,
          status: mo.status,
          shippingAddress: mo.shippingAddress,
          paymentId: mo.paymentId,
          orderId: mo.orderId,
          deliveryTime: mo.deliveryTime,
          createdAt: mo.createdAt || new Date()
        });
      } catch (err) {
        console.warn('Skipping order due to error:', err.message);
      }
    }
    console.log(`Migrated ${mongoOrders.length} Orders.`);

    // Logs
    console.log('Migrating Logs...');
    const mongoLogs = await MongoLog.find().lean();
    for (const ml of mongoLogs) {
      await MysqlLog.create({
        userId: ml.userId ? userMap[ml.userId.toString()] : null,
        ip: ml.ip,
        method: ml.method,
        path: ml.path,
        status: ml.status,
        userAgent: ml.userAgent,
        suspicious: ml.suspicious,
        reason: ml.reason,
        createdAt: ml.createdAt || new Date()
      });
    }
    console.log(`Migrated ${mongoLogs.length} Logs.`);

    // Reviews
    console.log('Migrating Reviews...');
    const mongoReviews = await MongoReview.find().lean();
    for (const mr of mongoReviews) {
      if (!mr.productId || !productMap[mr.productId.toString()]) continue; // Skip orphan reviews
      await MysqlReview.create({
        productId: productMap[mr.productId.toString()],
        userName: mr.userName,
        rating: mr.rating,
        comment: mr.comment,
        createdAt: mr.createdAt || new Date()
      });
    }
    console.log(`Migrated ${mongoReviews.length} Reviews.`);

    // RFQs
    console.log('Migrating RFQs...');
    const mongoRFQs = await MongoRFQ.find().lean();
    for (const mr of mongoRFQs) {
      await MysqlRFQ.create({
        userId: mr.userId ? userMap[mr.userId.toString()] : null,
        productId: mr.productId ? productMap[mr.productId.toString()] : null,
        quantity: mr.quantity,
        details: mr.details,
        status: mr.status,
        createdAt: mr.createdAt || new Date()
      });
    }
    console.log(`Migrated ${mongoRFQs.length} RFQs.`);

    console.log('Migration Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration Error:', err);
    process.exit(1);
  }
}

migrate();
