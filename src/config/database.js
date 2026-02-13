/**
 * MongoDB Database холболтын тохиргоо
 * Production-ready холболт - олон хүн зэрэг ашиглах боломжтой
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const options = {
      // Connection pool тохиргоо - олон хүн зэрэг хандахад
      maxPoolSize: 50,
      minPoolSize: 10,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      
      // Автомат reconnect
      autoIndex: true,
      retryWrites: true,
      retryReads: true,
      w: 'majority'
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    logger.info(`✅ MongoDB холбогдлоо: ${conn.connection.host}`);
    logger.info(`📊 Database: ${conn.connection.name}`);

    // Connection events
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected event');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('❌ MongoDB холбогдох алдаа:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;