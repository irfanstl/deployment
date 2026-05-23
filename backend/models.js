import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'nexus_ecom', 
  process.env.MYSQL_USER || 'root', 
  process.env.MYSQL_PASSWORD || '', 
  {
    host: process.env.MYSQL_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

export const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  displayName: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: 'customer' },
  address: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING },
  state: { type: DataTypes.STRING },
  zip: { type: DataTypes.STRING },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: true },
  otp: { type: DataTypes.STRING },
  otpExpiry: { type: DataTypes.DATE },
}, { timestamps: true });

export const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.FLOAT },
  category: { type: DataTypes.STRING },
  image: { type: DataTypes.TEXT },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  sku: { type: DataTypes.STRING },
  tierPricing: { type: DataTypes.JSON },
  isRfqOnly: { type: DataTypes.BOOLEAN, defaultValue: false },
  dimensions: { type: DataTypes.JSON },
  materialCompatibility: { type: DataTypes.JSON },
  coating: { type: DataTypes.STRING },
  technicalDocs: { type: DataTypes.JSON },
}, { timestamps: true });

export const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID },
  items: { type: DataTypes.JSON },
  total: { type: DataTypes.FLOAT },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  shippingAddress: { type: DataTypes.TEXT },
  paymentId: { type: DataTypes.STRING },
  orderId: { type: DataTypes.STRING },
  deliveryTime: { type: DataTypes.STRING },
}, { timestamps: true });

export const Log = sequelize.define('Log', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID },
  ip: { type: DataTypes.STRING },
  method: { type: DataTypes.STRING },
  path: { type: DataTypes.STRING },
  status: { type: DataTypes.INTEGER },
  userAgent: { type: DataTypes.STRING },
  suspicious: { type: DataTypes.BOOLEAN, defaultValue: false },
  reason: { type: DataTypes.STRING },
}, { timestamps: true });

export const Review = sequelize.define('Review', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  productId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID },
  userName: { type: DataTypes.STRING, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  comment: { type: DataTypes.TEXT }, // allowed to be empty for 1-tap ratings
  isVerifiedPurchase: { type: DataTypes.BOOLEAN, defaultValue: false },
  upvotes: { type: DataTypes.INTEGER, defaultValue: 0 },
  isVineVoice: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });

export const RFQ = sequelize.define('RFQ', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID },
  productId: { type: DataTypes.UUID },
  quantity: { type: DataTypes.INTEGER },
  details: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
}, { timestamps: true });

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Log, { foreignKey: 'userId' });
Log.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Review, { foreignKey: 'productId' });
Review.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(RFQ, { foreignKey: 'userId' });
RFQ.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(RFQ, { foreignKey: 'productId' });
RFQ.belongsTo(Product, { foreignKey: 'productId' });

export const Cart = sequelize.define('Cart', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  productId: { type: DataTypes.UUID, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
}, { timestamps: true });

User.hasMany(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Cart, { foreignKey: 'productId' });
Cart.belongsTo(Product, { foreignKey: 'productId' });

export { sequelize };
