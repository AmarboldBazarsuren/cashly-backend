/**
 * CASHLY BACKEND - Main Server File
 * ✅ Static uploads folder нэмсэн
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const fs = require('fs');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middlewares/errorHandler');
const { startCronJobs } = require('./src/utils/cronJobs');

// Environment variables ачаалах
dotenv.config();

// Express app үүсгэх
const app = express();

// Database холболт
connectDB();

// Cron jobs эхлүүлэх (production дээр)
if (process.env.NODE_ENV === 'production') {
  startCronJobs();
}

// Security Middlewares
app.use(helmet()); // HTTP headers аюулгүй болгоно
app.use(mongoSanitize()); // NoSQL injection-аас хамгаална
app.use(compression()); // Response compression

// CORS тохиргоо - бүх origin зөвшөөрөх (production дээр тодорхой domain оруулна)
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Uploads folder үүсгэх + Static files serve
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('📁 Uploads folder үүсгэгдлээ');
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
logger.info('📁 Static files serving: /uploads');

// Request logging
if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cashly Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// API Routes импортлох
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const loanRoutes = require('./src/routes/loanRoutes');
const walletRoutes = require('./src/routes/walletRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');

// Routes ашиглах
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transaction', transactionRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint олдсонгүй'
  });
});

// Global Error Handler
app.use(errorHandler);

// Server эхлүүлэх
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Cashly Backend server ${PORT} port дээр ажиллаж байна`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Unhandled rejection handler
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;