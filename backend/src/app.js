const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { uploadDir } = require('./middlewares/upload');
const { pool } = require('./config/database');

const app = express();

// Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// HTTP Response Compression
app.use(compression());

// Global Rate Limiting (300 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'มีคำขอเข้ามามากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง (Rate limit exceeded)',
  },
});
app.use('/api', globalLimiter);

// Strict Rate Limiting for PIN Verification (10 requests per 1 minute to prevent brute-force)
const pinVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'กรอกรหัส PIN ผิดบ่อยเกินไป กรุณารอ 1 นาทีก่อนลองใหม่',
  },
});
app.use('/api/auth/pin/verify', pinVerifyLimiter);

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically with strict security headers (prevent XSS execution)
app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'attachment');
  },
}));

// Comprehensive Health Check (Probes PostgreSQL Pool)
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  try {
    const dbRes = await pool.query('SELECT NOW() as db_time, current_database() as db_name');
    const latencyMs = Date.now() - startTime;

    res.status(200).json({
      status: 'ok',
      message: 'Personal Organizer API is healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        latencyMs,
        time: dbRes.rows[0].db_time,
        name: dbRes.rows[0].db_name,
        pool: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
        },
      },
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// API Routes
app.use('/api', routes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
