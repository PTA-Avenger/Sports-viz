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
      headers['x-rapidapi-key'] = apiKey;
      headers['x-rapidapi-host'] = 'v1.baseball.api-sports.io';
      break;

    case 'basketball':
      url = `https://v1.basketball.api-sports.io/games`;
      headers['x-rapidapi-key'] = apiKey;
      headers['x-rapidapi-host'] = 'v1.basketball.api-sports.io';
      break;

    case 'football':
      url = `https://v3.football.api-sports.io/teams/statistics`;
      headers['x-rapidapi-key'] = apiKey;
      headers['x-rapidapi-host'] = 'v3.football.api-sports.io';
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

    console.log(`Fetching ${sport} data for season ${season}`);
    console.log(`URL: ${url}`);
    console.log(`Params:`, params);

    const response = await axios.get(url, {
      params,
      headers,
      timeout: 10000
    });

    if (response.data && response.data.response) {
      console.log(`Successfully fetched ${response.data.response.length} ${sport} records`);
      return response.data.response;
    }

    console.log(`No data found for ${sport} season ${season}`);
    return [];

  } catch (error) {
    console.error(`Error fetching ${sport} data:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return [];
  }
}

module.exports = { fetchSportsData };
