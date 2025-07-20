require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for proper IP detection (important for rate limiting)
app.set('trust proxy', 1);

// CORS configuration - Allow your Netlify domain
const corsOptions = {
  origin: [
    'https://cerulean-sundae-660775.netlify.app',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'https://sports-viz.onrender.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Other middleware
app.use(express.json({ limit: '10mb' })); // Increase limit for AI requests with large data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging with IP detection
app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin} - IP: ${clientIP}`);
  next();
});

// Static files
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Import and mount API and AI routes
const apiRoutes = require('./routes/api');
const aiRoutes = require('./routes/ai');
app.use('/api', apiRoutes);
app.use('/ai', aiRoutes);

// Health check with additional system information
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
    },
    nodeVersion: process.version,
    apiKeyConfigured: !!process.env.SPORTS_API_KEY,
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY
  });
});

// API documentation endpoint
app.get('/docs', (req, res) => {
  const docs = {
    title: 'Sports API Documentation',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    endpoints: {
      test: 'GET /api/test - API health check',
      data: 'GET /api/data/:sport?season=YYYY - Get sports data (basketball, baseball, football, f1)',
      standings: 'GET /api/:sport/standings?season=YYYY - Get league standings',
      teams: 'GET /api/:sport/teams?season=YYYY - Get teams',
      fixtures: 'GET /api/:sport/fixtures?season=YYYY - Get fixtures/games',
      players: 'GET /api/:sport/players?season=YYYY&team=ID - Get players',
      baseballStats: 'GET /api/baseball/stats?team=ID&player=ID&season=YYYY - Advanced baseball stats',
      aiInsights: 'POST /ai/insights/:sport - AI-powered insights',
      aiChat: 'POST /ai/chat - Sports data Q&A',
      aiPredictions: 'POST /ai/predict/:sport - Game predictions',
      aiReports: 'POST /ai/reports/:sport - Auto-generated reports'
    },
    rateLimiting: {
      window: '1 minute',
      maxRequests: 100,
      statusCode: 429
    },
    caching: {
      duration: '6 hours',
      location: 'file-based'
    }
  };
  res.json(docs);
});

// Catch-all for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ 
      error: 'API endpoint not found',
      availableEndpoints: ['/api/test', '/api/data/:sport', '/api/:sport/standings', '/api/:sport/teams', '/api/:sport/fixtures', '/api/:sport/players'],
      documentation: '/docs'
    });
  } else {
    res.sendFile(path.join(publicDir, 'index.html'));
  }
});

// Enhanced error handling
app.use((err, req, res, next) => {
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Static files: ${publicDir}`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
  console.log(`📚 Documentation: http://localhost:${PORT}/docs`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS enabled for origins: ${corsOptions.origin.join(', ')}`);
  console.log(`🔑 API Key configured: ${!!process.env.SPORTS_API_KEY}`);
  console.log(`🤖 Gemini Key configured: ${!!process.env.GEMINI_API_KEY}`);
});

module.exports = app;