const express = require('express');
const router = express.Router();
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

// Basketball data fetcher
async function fetchBasketballData() {
  try {
    const response = await axios.get('https://v3.basketball.api-sports.io/games', {
      params: { season: '2024' },
      headers: { 'x-apisports-key': API_KEY },
      timeout: 10000
    });
    return response.data.response || [];
  } catch (error) {
    console.error('Basketball API error:', error.message);
    return [];
  }
}

// Baseball data fetcher
async function fetchBaseballData() {
  try {
    const response = await axios.get('https://v1.baseball.api-sports.io/games', {
      params: { season: '2024' },
      headers: { 'x-apisports-key': API_KEY },
      timeout: 10000
    });
    return response.data.response || [];
  } catch (error) {
    console.error('Baseball API error:', error.message);
    return [];
  }
}

// F1 data fetcher
async function fetchF1Data() {
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

// Football data fetcher
async function fetchFootballData() {
  try {
    const response = await axios.get('https://v3.football.api-sports.io/teams/statistics', {
      params: { league: 39, season: '2024', team: 33 },
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

// Main data route
router.get('/data/:sport', async (req, res) => {
  const sport = req.params.sport;
  
  if (!sport) {
    return res.status(400).json({ error: 'Sport parameter is required' });
  }
  
  console.log(`Fetching data for sport: ${sport} from origin: ${req.headers.origin}`);

  try {
    let data = [];
    
    switch (sport.toLowerCase()) {
      case 'basketball':
        data = await fetchBasketballData();
        break;
      case 'baseball':
        data = await fetchBaseballData();
        break;
      case 'f1':
        data = await fetchF1Data();
        break;
      case 'football':
        data = await fetchFootballData();
        break;
      default:
        return res.status(404).json({ 
          error: 'Sport not supported',
          supported: ['basketball', 'baseball', 'f1', 'football']
        });
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