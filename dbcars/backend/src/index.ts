import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import vehiclesRoutes from './routes/vehicles';
import bookingsRoutes from './routes/bookings';
import locationsRoutes from './routes/locations';
import extrasRoutes from './routes/extras';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import blogRoutes from './routes/blog';
import couponsRoutes from './routes/coupons';
import draftsRoutes from './routes/drafts';
import contactRoutes from './routes/contact';
import { testConnection } from './config/database';
import { validateEnv } from './config/env';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || 'http://localhost:3000')
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Increased limit for large JSON payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increased limit for form data

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/extras', extrasRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/auth', authRoutes);
// Register more specific admin routes first
app.use('/api/admin/drafts', draftsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'DB Luxury Cars API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      vehicles: '/api/vehicles',
      bookings: '/api/bookings',
      locations: '/api/locations',
      extras: '/api/extras',
      auth: '/api/auth',
      admin: '/api/admin',
      blog: '/api/blog'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Car Rental API is running' });
});

// Start server with database connection check
async function startServer() {
  try {
    // Validate environment variables
    const { errors, warnings } = validateEnv();
    
    if (warnings.length > 0) {
      console.warn('⚠️  Environment variable warnings:');
      warnings.forEach((warning) => console.warn(`   - ${warning}`));
    }

    if (errors.length > 0) {
      console.error('❌ Environment variable errors:');
      errors.forEach((error) => console.error(`   - ${error}`));
      console.error('\n💡 Please check your .env file and ensure all required variables are set.');
      process.exit(1);
    }

    // Test database connection before starting server
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database!');
      console.error('Please check:');
      console.error('  1. PostgreSQL is running');
      console.error('  2. Database credentials in .env file are correct');
      console.error('  3. Database "' + (process.env.DB_NAME || 'dbcars_db') + '" exists');
      console.error('\nDatabase configuration:');
      console.error(`  Host: ${process.env.DB_HOST || 'localhost'}`);
      console.error(`  Port: ${process.env.DB_PORT || '5432'}`);
      console.error(`  Database: ${process.env.DB_NAME || 'dbcars_db'}`);
      console.error(`  User: ${process.env.DB_USER || 'postgres'}`);
      console.error('\n💡 Tip: Make sure PostgreSQL is running and the database exists.');
      process.exit(1);
    }

    console.log('✅ Database connection successful!');
    console.log(`🚀 Starting server on port ${PORT}...`);
    
    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

