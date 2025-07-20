require('dotenv').config();
const axios = require('axios');

async function fetchSportsData(sport, season = '2024') {
  const apiKey = process.env.SPORTS_API_KEY;
  
  if (!apiKey && sport !== 'f1') {
    console.error('Sports API key not configured');
    return [];
  }

  let url, headers = {};

  switch (sport.toLowerCase()) {
    case 'baseball':
      url = `https://v1.baseball.api-sports.io/games`;
      headers['x-apisports-key'] = apiKey;
      break;

    case 'basketball':
      url = `https://v3.basketball.api-sports.io/games`;
      headers['x-apisports-key'] = apiKey;
      break;

    case 'football':
      url = `https://v3.football.api-sports.io/teams/statistics`;
      headers['x-apisports-key'] = apiKey;
      break;

    case 'f1':
      url = `https://ergast.com/api/f1/current/constructorStandings.json`;
      // F1 API doesn't require authentication
      break;

    default:
      console.error(`Unsupported sport: ${sport}`);
      return [];
  }

  try {
    const params = { season };
    
    // Add sport-specific parameters
    if (sport.toLowerCase() === 'football') {
      params.league = 39;
      params.team = 33; // Example team
    } else if (sport.toLowerCase() === 'baseball') {
      params.league = 1;
    } else if (sport.toLowerCase() === 'basketball') {
      params.league = 12;
    }

    const response = await axios.get(url, { 
      headers,
      params: sport.toLowerCase() === 'f1' ? {} : params,
      timeout: 10000
    });

    // Handle F1 API response format
    if (sport.toLowerCase() === 'f1') {
      return response.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
    }

    return response.data.response || response.data || [];
  } catch (err) {
    console.error(`Error fetching ${sport} data:`, {
      status: err.response?.status,
      message: err.message,
      data: err.response?.data
    });
    return [];
  }
}

module.exports = { fetchSportsData };
