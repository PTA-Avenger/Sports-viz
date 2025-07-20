const express = require('express');
const router = express.Router();
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const API_KEY = process.env.SPORTS_API_KEY;

// Rate limiting setup
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per minute

// Rate limiting middleware
const rateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = rateLimitMap.get(clientIP);
  
  if (now > clientData.resetTime) {
    // Reset the rate limit window
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded', 
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
};

// Apply rate limiting to all API routes
router.use(rateLimit);

// CORS middleware for API routes
const corsOptions = {
  origin: [
    'https://cerulean-sundae-660775.netlify.app',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'https://sports-viz.onrender.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS to all API routes
router.use(cors(corsOptions));

// Middleware to add CORS headers manually (as backup)
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Cache configuration
const CACHE_DIR = path.join(__dirname, '../cache');
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in ms

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      console.log('Cache directory created:', CACHE_DIR);
    } catch (error) {
      console.error('Failed to create cache directory:', error.message);
    }
  }
}

// Initialize cache directory
ensureCacheDir();

function getCacheFile(sport, season) {
  return path.join(CACHE_DIR, `${sport}_${season}.json`);
}

// Improved API request helper with better error handling
async function makeAPIRequest(url, params, headers, sport = 'unknown') {
  try {
    const response = await axios.get(url, {
      params,
      headers,
      timeout: 10000
    });
    return {
      success: true,
      data: response.data.response || response.data || [],
      status: response.status
    };
  } catch (error) {
    console.error(`${sport} API error:`, {
      url,
      params,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    return {
      success: false,
      error: error.message,
      status: error.response?.status || 500,
      data: []
    };
  }
}

// Unified data fetchers with consistent API endpoints
async function fetchBasketballData(season = '2024') {
  const result = await makeAPIRequest(
    'https://v3.basketball.api-sports.io/games',
    { season },
    { 'x-apisports-key': API_KEY },
    'Basketball'
  );
  return result.data;
}

async function fetchBaseballData(season = '2024') {
  const result = await makeAPIRequest(
    'https://v1.baseball.api-sports.io/games',
    { season },
    { 'x-apisports-key': API_KEY },
    'Baseball'
  );
  return result.data;
}

async function fetchF1Data(season = '2024') {
  try {
    const response = await axios.get('https://ergast.com/api/f1/current/constructorStandings.json', {
      timeout: 10000
    });
    const standings = response.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
    return standings;
  } catch (error) {
    console.error('F1 API error:', error.message);
    return [];
  }
}

async function fetchFootballData(season = '2024') {
  const result = await makeAPIRequest(
    'https://v3.football.api-sports.io/teams/statistics',
    { league: 39, season, team: 33 },
    { 'x-apisports-key': API_KEY },
    'Football'
  );
  return result.data;
}

// Test route with enhanced information
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    origin: req.headers.origin,
    corsEnabled: true,
    rateLimitingEnabled: true,
    cacheDirectory: CACHE_DIR,
    cacheDirectoryExists: fs.existsSync(CACHE_DIR),
    apiKeyConfigured: !!API_KEY
  });
});

// Main data route with improved caching and error handling
router.get('/data/:sport', async (req, res) => {
  const sport = req.params.sport;
  const season = req.query.season || '2024';

  if (!sport) {
    return res.status(400).json({ 
      error: 'Sport parameter is required',
      supported: ['basketball', 'baseball', 'f1', 'football']
    });
  }

  if (!API_KEY && sport !== 'f1') {
    return res.status(500).json({
      error: 'API configuration error',
      message: 'Sports API key not configured'
    });
  }

  const cacheFile = getCacheFile(sport, season);
  let useCache = false;
  let cachedData = null;

  // Try to read cache
  if (fs.existsSync(cacheFile)) {
    try {
      const stat = fs.statSync(cacheFile);
      const age = Date.now() - stat.mtimeMs;
      if (age < CACHE_DURATION) {
        cachedData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        useCache = true;
        console.log(`Cache hit for ${sport} ${season}`);
      } else {
        console.log(`Cache expired for ${sport} ${season}`);
      }
    } catch (e) {
      console.warn('Cache read error:', e.message);
    }
  }

  if (useCache && cachedData) {
    return res.json({
      data: cachedData,
      cached: true,
      timestamp: new Date().toISOString()
    });
  }

  try {
    let data = [];
    let fetchResult = { success: true };

    switch (sport.toLowerCase()) {
      case 'basketball':
        data = await fetchBasketballData(season);
        break;
      case 'baseball':
        data = await fetchBaseballData(season);
        break;
      case 'f1':
        data = await fetchF1Data(season);
        break;
      case 'football':
        data = await fetchFootballData(season);
        break;
      default:
        return res.status(404).json({ 
          error: 'Sport not supported',
          supported: ['basketball', 'baseball', 'f1', 'football']
        });
    }

    // Save to cache if we have data
    if (data && data.length > 0) {
      try {
        ensureCacheDir(); // Ensure directory exists before writing
        fs.writeFileSync(cacheFile, JSON.stringify(data), 'utf8');
        console.log(`Cache updated for ${sport} ${season}`);
      } catch (e) {
        console.warn('Cache write error:', e.message);
      }
    }

    res.json({
      data: data,
      cached: false,
      timestamp: new Date().toISOString(),
      count: Array.isArray(data) ? data.length : 0
    });
  } catch (error) {
    console.error(`Error fetching ${sport} data:`, error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      sport: sport,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced Baseball Advanced & Fantasy Stats Endpoint
router.get('/baseball/stats', async (req, res) => {
  const season = req.query.season || '2024';
  const team = req.query.team;
  const player = req.query.player;
  const API_BASE = 'https://v1.baseball.api-sports.io';

  if (!team && !player) {
    return res.status(400).json({ 
      error: 'team or player parameter required',
      example: '/api/baseball/stats?team=1&season=2024'
    });
  }

  if (!API_KEY) {
    return res.status(500).json({
      error: 'API configuration error',
      message: 'Sports API key not configured'
    });
  }

  try {
    let stats = {};
    const requests = [];

    // Team stats
    if (team) {
      requests.push(
        makeAPIRequest(
          `${API_BASE}/teams/statistics`,
          { team, season, league: 1 },
          { 'x-apisports-key': API_KEY },
          'Baseball Team Stats'
        ).then(result => {
          stats.team = result.success ? result.data : { error: result.error };
        })
      );
    }

    // Player stats
    if (player) {
      requests.push(
        makeAPIRequest(
          `${API_BASE}/players`,
          { player, season },
          { 'x-apisports-key': API_KEY },
          'Baseball Player Stats'
        ).then(result => {
          stats.player = result.success ? result.data : { error: result.error };
        })
      );
    }

    // Fantasy/box stats (recent games)
    if (team) {
      requests.push(
        makeAPIRequest(
          `${API_BASE}/games`,
          { team, season },
          { 'x-apisports-key': API_KEY },
          'Baseball Games'
        ).then(result => {
          stats.games = result.success ? result.data : { error: result.error };
        })
      );
    }

    await Promise.all(requests);

    res.json({
      ...stats,
      timestamp: new Date().toISOString(),
      season,
      team,
      player
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch baseball stats', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced generic endpoints with better error handling
router.get('/:sport/standings', async (req, res) => {
  const { sport } = req.params;
  const season = req.query.season || '2024';
  
  if (!API_KEY) {
    return res.status(500).json({
      error: 'API configuration error',
      message: 'Sports API key not configured'
    });
  }

  let url, params;
  switch (sport.toLowerCase()) {
    case 'baseball':
      url = 'https://v1.baseball.api-sports.io/standings';
      params = { league: 1, season };
      break;
    case 'football':
      url = 'https://v3.football.api-sports.io/standings';
      params = { league: 39, season };
      break;
    case 'basketball':
      url = 'https://v3.basketball.api-sports.io/standings';
      params = { league: 12, season };
      break;
    default:
      return res.status(400).json({ 
        error: 'Sport not supported for standings',
        supported: ['baseball', 'football', 'basketball']
      });
  }

  const result = await makeAPIRequest(url, params, { 'x-apisports-key': API_KEY }, `${sport} standings`);
  
  if (!result.success) {
    return res.status(result.status).json({
      error: 'Failed to fetch standings',
      message: result.error,
      sport,
      season
    });
  }

  res.json({
    data: result.data,
    sport,
    season,
    timestamp: new Date().toISOString()
  });
});

router.get('/:sport/teams', async (req, res) => {
  const { sport } = req.params;
  const season = req.query.season || '2024';
  
  if (!API_KEY) {
    return res.status(500).json({
      error: 'API configuration error',
      message: 'Sports API key not configured'
    });
  }

  let url, params;
  switch (sport.toLowerCase()) {
    case 'baseball':
      url = 'https://v1.baseball.api-sports.io/teams';
      params = { league: 1, season };
      break;
    case 'football':
      url = 'https://v3.football.api-sports.io/teams';
      params = { league: 39, season };
      break;
    case 'basketball':
      url = 'https://v3.basketball.api-sports.io/teams';
      params = { league: 12, season };
      break;
    default:
      return res.status(400).json({ 
        error: 'Sport not supported for teams',
        supported: ['baseball', 'football', 'basketball']
      });
  }

  const result = await makeAPIRequest(url, params, { 'x-apisports-key': API_KEY }, `${sport} teams`);
  
  if (!result.success) {
    return res.status(result.status).json({
      error: 'Failed to fetch teams',
      message: result.error,
      sport,
      season
    });
  }

  res.json({
    data: result.data,
    sport,
    season,
    timestamp: new Date().toISOString()
  });
});

router.get('/:sport/fixtures', async (req, res) => {
  const { sport } = req.params;
  const season = req.query.season || '2024';
  
  if (!API_KEY) {
    return res.status(500).json({
      error: 'API configuration error',
      message: 'Sports API key not configured'
    });
  }

  let url, params;
  switch (sport.toLowerCase()) {
    case 'baseball':
      url = 'https://v1.baseball.api-sports.io/games';
      params = { league: 1, season };
      break;
    case 'football':
      url = 'https://v3.football.api-sports.io/fixtures';
      params = { league: 39, season };
      break;
    case 'basketball':
      url = 'https://v3.basketball.api-sports.io/games';
      params = { league: 12, season };
      break;
    default:
      return res.status(400).json({ 
        error: 'Sport not supported for fixtures',
        supported: ['baseball', 'football', 'basketball']
      });
  }

  const result = await makeAPIRequest(url, params, { 'x-apisports-key': API_KEY }, `${sport} fixtures`);
  
  if (!result.success) {
    return res.status(result.status).json({
      error: 'Failed to fetch fixtures',
      message: result.error,
      sport,
      season
    });
  }

  res.json({
    data: result.data,
    sport,
    season,
    timestamp: new Date().toISOString()
  });
});

router.get('/:sport/players', async (req, res) => {
  const { sport } = req.params;
  const season = req.query.season || '2024';
  const team = req.query.team;
  
  if (!API_KEY) {
    return res.status(500).json({
      error: 'API configuration error',
      message: 'Sports API key not configured'
    });
  }

  let url, params;
  switch (sport.toLowerCase()) {
    case 'baseball':
      url = 'https://v1.baseball.api-sports.io/players';
      params = { season };
      if (team) params.team = team;
      break;
    case 'football':
      url = 'https://v3.football.api-sports.io/players';
      params = { league: 39, season };
      if (team) params.team = team;
      break;
    case 'basketball':
      url = 'https://v3.basketball.api-sports.io/players';
      params = { league: 12, season };
      if (team) params.team = team;
      break;
    default:
      return res.status(400).json({ 
        error: 'Sport not supported for players',
        supported: ['baseball', 'football', 'basketball']
      });
  }

  const result = await makeAPIRequest(url, params, { 'x-apisports-key': API_KEY }, `${sport} players`);
  
  if (!result.success) {
    return res.status(result.status).json({
      error: 'Failed to fetch players',
      message: result.error,
      sport,
      season,
      team
    });
  }

  res.json({
    data: result.data,
    sport,
    season,
    team,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;