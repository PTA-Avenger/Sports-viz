const express = require('express');
const router = express.Router();
// --- Baseball Advanced & Fantasy Stats Endpoint ---
// GET /api/baseball/stats?team=ID&player=ID&season=YYYY
// ...existing code...
  const season = req.query.season || '2024';
  const team = req.query.team;
  const player = req.query.player;
  const API_BASE = 'https://v1.baseball.api-sports.io';
  if (!team && !player) {
    return res.status(400).json({ error: 'team or player parameter required' });
  }
  try {
    let stats = {};
    // Team stats
    if (team) {
      // Team statistics (may include advanced metrics if available)
      const teamStatsRes = await axios.get(`${API_BASE}/teams/statistics`, {
        params: { team, season, league: 1 },
        headers: { 'x-apisports-key': API_KEY },
        timeout: 10000
      });
      stats.team = teamStatsRes.data.response || {};
    }
    // Player stats
    if (player) {
      const playerStatsRes = await axios.get(`${API_BASE}/players`, {
        params: { player, season },
        headers: { 'x-apisports-key': API_KEY },
        timeout: 10000
      });
      stats.player = playerStatsRes.data.response || [];
    }
    // Fantasy/box stats (recent games)
    if (team) {
      const gamesRes = await axios.get(`${API_BASE}/games`, {
        params: { team, season },
        headers: { 'x-apisports-key': API_KEY },
        timeout: 10000
      });
      stats.games = gamesRes.data.response || [];
    }
    res.json(stats);
} catch (error) {
  res.status(500).json({ error: 'Failed to fetch baseball stats', message: error.message });
}
 const express = require('express');
const axios = require('axios');
const cors = require('cors');

// Load environment variables
require('dotenv').config();

const API_KEY = process.env.SPORTS_API_KEY;

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

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '../cache');
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in ms

function getCacheFile(sport, season) {
  return path.join(CACHE_DIR, `${sport}_${season}.json`);
}

async function fetchBasketballData(season = '2024') {
  try {
    const response = await axios.get('https://v3.basketball.api-sports.io/games', {
      params: { season },
      headers: { 'x-apisports-key': API_KEY },
      timeout: 10000
    });
    return response.data.response || [];
  } catch (error) {
    console.error('Basketball API error:', error.message);
    return [];
  }
}

async function fetchBaseballData(season = '2024') {
  try {
    const response = await axios.get('https://v1.baseball.api-sports.io/games', {
      params: { season },
      headers: { 'x-apisports-key': API_KEY },
      timeout: 10000
    });
    return response.data.response || [];
  } catch (error) {
    console.error('Baseball API error:', error.message);
    return [];
  }
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
  try {
    const response = await axios.get('https://v3.football.api-sports.io/teams/statistics', {
      params: { league: 39, season, team: 33 },
      headers: { 'x-apisports-key': API_KEY },
      timeout: 10000
    });
    return response.data.response || [];
  } catch (error) {
    console.error('Football API error:', error.message);
    return [];
  }
}

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    origin: req.headers.origin,
    corsEnabled: true
  });
});

// Main data route with caching
router.get('/data/:sport', async (req, res) => {
// --- Additional Endpoints for More Data ---
// Standings
router.get('/:sport/standings', async (req, res) => {
  const { sport } = req.params;
  const season = req.query.season || '2024';
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
    default:
      return res.status(400).json({ error: 'Sport not supported for standings.' });
  }
  try {
    const response = await axios.get(url, {
      params,
      headers: { 'x-apisports-key': API_KEY },
      timeout: 10000
    });
    res.json(response.data.response || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch standings', message: error.message });
  }
});

// Teams
router.get('/:sport/teams', async (req, res) => {
  const { sport } = req.params;
  const season = req.query.season || '2024';
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
    default:
      return res.status(400).json({ error: 'Sport not supported for teams.' });
  }
  try {
    const response = await axios.get(url, {
      params,
      headers: { 'x-apisports-key': API_KEY },
      timeout: 10000
    });
    res.json(response.data.response || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams', message: error.message });
  }
});

// Fixtures
router.get('/:sport/fixtures', async (req, res) => {
  const { sport } = req.params;
  const season = req.query.season || '2024';
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
    default:
      return res.status(400).json({ error: 'Sport not supported for fixtures.' });
  }
  try {
    const response = await axios.get(url, {
      params,
      headers: { 'x-apisports-key': API_KEY },
      timeout: 10000
    });
    res.json(response.data.response || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fixtures', message: error.message });
  }
});

// Players
router.get('/:sport/players', async (req, res) => {
  const { sport } = req.params;
  const season = req.query.season || '2024';
  let url, params;
  switch (sport.toLowerCase()) {
    case 'baseball':
      url = 'https://v1.baseball.api-sports.io/players';
      params = { team: req.query.team, season };
      break;
    case 'football':
      url = 'https://v3.football.api-sports.io/players';
      params = { team: req.query.team, league: 39, season };
      break;
    default:
      return res.status(400).json({ error: 'Sport not supported for players.' });
  }
  try {
    const response = await axios.get(url, {
      params,
      headers: { 'x-apisports-key': API_KEY },
      timeout: 10000
    });
    res.json(response.data.response || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch players', message: error.message });
  }
});
  const sport = req.params.sport;
  const season = req.query.season || '2024';

  if (!sport) {
    return res.status(400).json({ error: 'Sport parameter is required' });
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
      }
    } catch (e) {
      console.warn('Cache read error:', e.message);
    }
  }

  if (useCache && cachedData) {
    return res.json(cachedData);
  }

  try {
    let data = [];
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

    // Save to cache
    try {
      fs.writeFileSync(cacheFile, JSON.stringify(data), 'utf8');
    } catch (e) {
      console.warn('Cache write error:', e.message);
    }

    res.json(data);
  } catch (error) {
    console.error(`Error fetching ${sport} data:`, error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      sport: sport,
      message: error.message
    });
  }
});

module.exports = router;