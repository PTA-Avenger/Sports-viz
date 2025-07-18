// src/routes/api.js

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Load environment variables
require('dotenv').config();

const API_KEY = process.env.SPORTS_API_KEY || 'YOUR_FALLBACK_API_KEY';

// 🏀 Fetch basketball data
async function fetchBasketballData() {
  const response = await axios.get('https://v3.basketball.api-sports.io/games?season=2024', {
    headers: { 'x-apisports-key': API_KEY }
  });
  return response.data;
}

// ⚾ Fetch baseball data
async function fetchBaseballData() {
  const response = await axios.get('https://v1.baseball.api-sports.io/games?season=2024', {
    headers: { 'x-apisports-key': API_KEY }
  });
  return response.data;
}

async function fetchF1Data() {
  const response = await axios.get('https://ergast.com/api/f1/current/constructorStandings.json');
  const standings = response.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
  return standings;
}


// Main route handler
router.get('/data/:sport', async (req, res) => {
  const { sport } = req.params;
  console.log(`Incoming request for: ${sport}`);

  try {
    let data;
    switch (sport) {
      case 'basketball':
        data = await fetchBasketballData();
        break;
      case 'baseball':
        data = await fetchBaseballData();
        break;
      case 'f1':
        data = await fetchF1Data();
        break;
      default:
        return res.status(404).json({ error: 'Sport not supported' });
    }

    res.json(data);
  } catch (err) {
    console.error(`❌ Failed to fetch ${sport} data:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
