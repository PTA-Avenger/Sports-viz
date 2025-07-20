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
    console.log(`Making API request for ${sport}:`, {
      url,
      params,
      headers: Object.keys(headers)
    });
    
    const response = await axios.get(url, {
      params,
      headers,
      timeout: 10000
    });
    
    console.log(`API response for ${sport}:`, {
      status: response.status,
      dataType: typeof response.data,
      hasResponse: !!response.data.response,
      responseLength: Array.isArray(response.data.response) ? response.data.response.length : 'not array',
      firstItem: Array.isArray(response.data.response) && response.data.response.length > 0 ? response.data.response[0] : 'none'
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

// Unified data fetchers with consistent API endpoints and mock fallbacks
async function fetchBasketballData(season = '2024') {
  // Fixed Basketball API domain - using correct API-Sports domain
  const seasonsToTry = [season, '2024', '2023', '2022', '2021'];
  
  for (const trySeason of seasonsToTry) {
    // Try standings first, then teams as fallback
    let result = await makeAPIRequest(
      'https://v3.basketball.api-sports.io/standings',
      { league: 12, season: trySeason }, // NBA league
      { 'x-apisports-key': API_KEY },
      'Basketball Standings'
    );
    
    if (!result.success || result.data.length === 0) {
      // Fallback to teams
      result = await makeAPIRequest(
        'https://v3.basketball.api-sports.io/teams',
        { league: 12, season: trySeason },
        { 'x-apisports-key': API_KEY },
        'Basketball Teams'
      );
    }
    
    if (result.success && result.data.length > 0) {
      console.log(`Basketball data found for season ${trySeason}`);
      return result.data;
    }
  }
  
  // If all APIs fail, return mock data for demonstration
  console.log('Basketball APIs failed, returning mock data');
  return [
    {
      team: { name: "Lakers", city: "Los Angeles" },
      ppg: 118.2,
      rpg: 44.8,
      apg: 28.1,
      pie: 0.567,
      wins: 47,
      losses: 35,
      rank: 1
    },
    {
      team: { name: "Warriors", city: "Golden State" },
      ppg: 115.9,
      rpg: 43.2,
      apg: 29.8,
      pie: 0.534,
      wins: 44,
      losses: 38,
      rank: 2
    },
    {
      team: { name: "Celtics", city: "Boston" },
      ppg: 120.6,
      rpg: 46.3,
      apg: 26.9,
      pie: 0.598,
      wins: 57,
      losses: 25,
      rank: 3
    },
    {
      team: { name: "Nuggets", city: "Denver" },
      ppg: 114.7,
      rpg: 44.1,
      apg: 27.5,
      pie: 0.545,
      wins: 50,
      losses: 32,
      rank: 4
    },
    {
      team: { name: "Heat", city: "Miami" },
      ppg: 110.5,
      rpg: 42.9,
      apg: 25.3,
      pie: 0.512,
      wins: 44,
      losses: 38,
      rank: 5
    }
  ];
}

async function fetchBaseballData(season = '2024') {
  // Try multiple seasons starting with the requested one
  const seasonsToTry = [season, '2024', '2023', '2022'];
  
  for (const trySeason of seasonsToTry) {
    // Try standings first, then teams as fallback
    let result = await makeAPIRequest(
      'https://v1.baseball.api-sports.io/standings',
      { league: 1, season: trySeason }, // MLB league
      { 'x-apisports-key': API_KEY },
      'Baseball Standings'
    );
    
    if (!result.success || result.data.length === 0) {
      // Fallback to teams
      result = await makeAPIRequest(
        'https://v1.baseball.api-sports.io/teams',
        { league: 1, season: trySeason },
        { 'x-apisports-key': API_KEY },
        'Baseball Teams'
      );
    }
    
    if (result.success && result.data.length > 0) {
      console.log(`Baseball data found for season ${trySeason}`);
      return result.data;
    }
  }
  
  // If all APIs fail, return mock data for demonstration
  console.log('Baseball APIs failed, returning mock data');
  return [
    {
      team: { name: "Yankees", city: "New York" },
      batting: { 
        ops: 0.789, 
        avg: 0.267, 
        hr: 254, 
        runs: 795, 
        rbi: 756 
      },
      pitching: { 
        era: 3.89, 
        wins: 99,
        strikeouts: 1543,
        whip: 1.28
      },
      wins: 99,
      losses: 63,
      rank: 1
    },
    {
      team: { name: "Dodgers", city: "Los Angeles" },
      batting: { 
        ops: 0.751, 
        avg: 0.258, 
        hr: 233, 
        runs: 758, 
        rbi: 721 
      },
      pitching: { 
        era: 4.02, 
        wins: 100,
        strikeouts: 1456,
        whip: 1.31
      },
      wins: 100,
      losses: 62,
      rank: 2
    },
    {
      team: { name: "Braves", city: "Atlanta" },
      batting: { 
        ops: 0.778, 
        avg: 0.271, 
        hr: 307, 
        runs: 947, 
        rbi: 908 
      },
      pitching: { 
        era: 4.64, 
        wins: 104,
        strikeouts: 1552,
        whip: 1.35
      },
      wins: 104,
      losses: 58,
      rank: 3
    },
    {
      team: { name: "Astros", city: "Houston" },
      batting: { 
        ops: 0.765, 
        avg: 0.263, 
        hr: 214, 
        runs: 794, 
        rbi: 763 
      },
      pitching: { 
        era: 3.72, 
        wins: 90,
        strikeouts: 1434,
        whip: 1.25
      },
      wins: 90,
      losses: 72,
      rank: 4
    },
    {
      team: { name: "Rangers", city: "Texas" },
      batting: { 
        ops: 0.748, 
        avg: 0.267, 
        hr: 230, 
        runs: 808, 
        rbi: 773 
      },
      pitching: { 
        era: 4.22, 
        wins: 90,
        strikeouts: 1387,
        whip: 1.33
      },
      wins: 90,
      losses: 72,
      rank: 5
    }
  ];
}

async function fetchF1Data(season = '2024') {
  const f1APIs = [
    // Try Ergast API first (most reliable when working)
    {
      url: `http://ergast.com/api/f1/${season}/constructorStandings.json`,
      name: 'Ergast Constructor Standings'
    },
    // Try alternative season if current fails
    {
      url: `http://ergast.com/api/f1/2024/constructorStandings.json`,
      name: 'Ergast 2024 Constructor Standings'
    },
    {
      url: `http://ergast.com/api/f1/2023/constructorStandings.json`,
      name: 'Ergast 2023 Constructor Standings'
    },
    // OpenF1 API as backup
    {
      url: 'https://api.openf1.org/v1/constructors?session_key=latest',
      name: 'OpenF1 Constructors'
    }
  ];

  for (const api of f1APIs) {
    try {
      console.log(`Trying F1 API: ${api.url}`);
      
      const response = await axios.get(api.url, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Sports-Viz-App/1.0'
        }
      });
      
      console.log(`F1 API response received: {
        url: '${api.url}',
        status: ${response.status},
        dataKeys: ${Object.keys(response.data || {})}
      }`);

      let processedData = [];
      
      // Process Ergast API response
      if (api.name.includes('Ergast') && response.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings) {
        const standings = response.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
        processedData = standings.map((item, index) => ({
          position: item.position,
          constructorId: item.Constructor.constructorId,
          Constructor: {
            constructorId: item.Constructor.constructorId,
            name: item.Constructor.name,
            nationality: item.Constructor.nationality
          },
          points: parseFloat(item.points),
          wins: item.wins ? parseInt(item.wins) : 0,
          lap_times_avg: 78.5 + (index * 0.3), // Mock lap time data
          top_speed: 340 + (Math.random() * 15) // Mock top speed data
        }));
        
        console.log(`F1 Ergast data found: ${processedData.length} constructors`);
        if (processedData.length > 0) return processedData;
      }
      
      // Process OpenF1 API response
      else if (api.name.includes('OpenF1') && Array.isArray(response.data)) {
        processedData = response.data.slice(0, 10).map((item, index) => ({
          position: (index + 1).toString(),
          constructorId: item.team_name?.toLowerCase().replace(/\s+/g, '_') || `team_${index + 1}`,
          Constructor: {
            constructorId: item.team_name?.toLowerCase().replace(/\s+/g, '_') || `team_${index + 1}`,
            name: item.team_name || `Team ${index + 1}`,
            nationality: item.country_code || 'Unknown'
          },
          points: Math.floor(Math.random() * 600) + 100, // Mock points
          wins: Math.floor(Math.random() * 15), // Mock wins
          lap_times_avg: 78.2 + (index * 0.4),
          top_speed: 338 + (Math.random() * 20)
        }));
        
        console.log(`F1 OpenF1 data found: ${processedData.length} items`);
        if (processedData.length > 0) return processedData;
      }
      
    } catch (error) {
      console.log(`F1 API ${api.url} failed: ${error.message}`);
      continue;
    }
  }

  // If all F1 APIs fail, return comprehensive mock data
  console.log('All F1 APIs failed, returning mock data');
  return [
    {
      position: "1",
      constructorId: "red_bull",
      Constructor: {
        constructorId: "red_bull",
        name: "Red Bull Racing",
        nationality: "Austrian"
      },
      points: 860,
      wins: 21,
      lap_times_avg: 78.234,
      top_speed: 347.5
    },
    {
      position: "2",
      constructorId: "mercedes",
      Constructor: {
        constructorId: "mercedes",
        name: "Mercedes",
        nationality: "German"
      },
      points: 409,
      wins: 8,
      lap_times_avg: 78.891,
      top_speed: 344.2
    },
    {
      position: "3",
      constructorId: "ferrari",
      Constructor: {
        constructorId: "ferrari",
        name: "Ferrari",
        nationality: "Italian"
      },
      points: 406,
      wins: 5,
      lap_times_avg: 78.567,
      top_speed: 345.8
    },
    {
      position: "4",
      constructorId: "mclaren",
      Constructor: {
        constructorId: "mclaren",
        name: "McLaren",
        nationality: "British"
      },
      points: 302,
      wins: 2,
      lap_times_avg: 79.123,
      top_speed: 342.1
    },
    {
      position: "5",
      constructorId: "aston_martin",
      Constructor: {
        constructorId: "aston_martin",
        name: "Aston Martin",
        nationality: "British"
      },
      points: 280,
      wins: 1,
      lap_times_avg: 79.445,
      top_speed: 340.9
    }
  ];
}

async function fetchFootballData(season = '2024') {
  // Try multiple seasons - European football seasons run differently
  const seasonsToTry = [season, '2024', '2023', '2022'];
  
  for (const trySeason of seasonsToTry) {
    // Try standings first, then teams as fallback
    let result = await makeAPIRequest(
      'https://v3.football.api-sports.io/standings',
      { league: 39, season: trySeason }, // Premier League
      { 'x-apisports-key': API_KEY },
      'Football Standings'
    );
    
    if (!result.success || result.data.length === 0) {
      // Fallback to teams
      result = await makeAPIRequest(
        'https://v3.football.api-sports.io/teams',
        { league: 39, season: trySeason },
        { 'x-apisports-key': API_KEY },
        'Football Teams'
      );
    }
    
    if (result.success && result.data.length > 0) {
      console.log(`Football data found for season ${trySeason}`);
      return result.data;
    }
  }
  
  // If all APIs fail, return mock data for demonstration
  console.log('Football APIs failed, returning mock data');
  return [
    {
      team: { name: "Manchester City", city: "Manchester" },
      goals: { for: 89, against: 31 },
      assists: 67,
      xg: 92.3,
      wins: 28,
      draws: 7,
      losses: 3,
      points: 91,
      rank: 1
    },
    {
      team: { name: "Arsenal", city: "London" },
      goals: { for: 91, against: 29 },
      assists: 71,
      xg: 88.7,
      wins: 28,
      draws: 5,
      losses: 5,
      points: 89,
      rank: 2
    },
    {
      team: { name: "Manchester United", city: "Manchester" },
      goals: { for: 57, against: 58 },
      assists: 45,
      xg: 62.1,
      wins: 23,
      draws: 6,
      losses: 9,
      points: 75,
      rank: 3
    },
    {
      team: { name: "Newcastle", city: "Newcastle" },
      goals: { for: 68, against: 56 },
      assists: 52,
      xg: 71.4,
      wins: 19,
      draws: 14,
      losses: 5,
      points: 71,
      rank: 4
    },
    {
      team: { name: "Liverpool", city: "Liverpool" },
      goals: { for: 75, against: 47 },
      assists: 59,
      xg: 78.9,
      wins: 19,
      draws: 10,
      losses: 9,
      points: 67,
      rank: 5
    }
  ];
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

    console.log(`Fetching data for sport: ${sport}, season: ${season}`);

    switch (sport.toLowerCase()) {
      case 'basketball':
        console.log('Calling fetchBasketballData...');
        data = await fetchBasketballData(season);
        break;
      case 'baseball':
        console.log('Calling fetchBaseballData...');
        data = await fetchBaseballData(season);
        break;
      case 'f1':
        console.log('Calling fetchF1Data...');
        data = await fetchF1Data(season);
        break;
      case 'football':
        console.log('Calling fetchFootballData...');
        data = await fetchFootballData(season);
        break;
      default:
        return res.status(404).json({ 
          error: 'Sport not supported',
          supported: ['basketball', 'baseball', 'f1', 'football']
        });
    }

    console.log(`Data fetched for ${sport} ${season}:`, {
      dataType: typeof data,
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : 'not array',
      firstItem: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : 'none'
    });

    // Save to cache if we have data (including mock data)
    if (data && data.length > 0) {
      try {
        ensureCacheDir(); // Ensure directory exists before writing
        fs.writeFileSync(cacheFile, JSON.stringify(data), 'utf8');
        console.log(`Cache updated for ${sport} ${season} with ${data.length} items`);
      } catch (e) {
        console.warn('Cache write error:', e.message);
      }
    } else {
      console.log(`No data to cache for ${sport} ${season}, maybe fetch team-specific data one by one for each league then create new tables to store said data then fetch it from those tables and use the api's to update the data once a day or whatever is the most economical/efficient way,obviously only update for the current season`);
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