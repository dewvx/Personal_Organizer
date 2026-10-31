require('dotenv').config();
const app = require('./src/app');
const { pool } = require('./src/config/database');
const SchedulerService = require('./src/services/schedulerService');

const PORT = process.env.PORT || 5000;

// Test DB Connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.warn('⚠️  PostgreSQL connection warning:', err.message);
    console.warn('👉 Please verify DB credentials in backend/.env or run schema.sql in PostgreSQL');
  } else {
    console.log('✅ PostgreSQL Database connected successfully at:', res.rows[0].now);
  }
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Personal Organizer Backend running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  // Start automated cron jobs
  SchedulerService.start();
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Gracefully shutting down...');
  SchedulerService.stop();
  server.close(() => {
    console.log('HTTP server closed.');
    pool.end(() => {
      console.log('PostgreSQL pool closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
