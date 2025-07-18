require('dotenv').config();
const axios = require('axios');

async function fetchSportsData(sport, season = '2025') {
  const apiKey = process.env.API_KEY;
  let url, headers = {};

  switch (sport) {
    case 'baseball':
      url = `https://v3.football.api-sports.io/baseball/teams/statistics?league=1&season=${season}`;
      headers['x-rapidapi-key'] = apiKey;
      headers['x-rapidapi-host'] = 'v3.football.api-sports.io';
      break;

    case 'basketball':
      url = `https://v3.football.api-sports.io/basketball/teams/statistics?league=12&season=${season}`;
      headers['x-rapidapi-key'] = apiKey;
      headers['x-rapidapi-host'] = 'v3.football.api-sports.io';
      break;

    case 'football':
      url = `https://v3.football.api-sports.io/teams/statistics?league=39&season=${season}&team=33`;
      headers['x-rapidapi-key'] = apiKey;
      headers['x-rapidapi-host'] = 'v3.football.api-sports.io';
      break;

    case 'f1':
      url = `https://v1.formula-1.api-sports.io/standings`; // or standings or races
      headers['x-rapidapi-key'] = apiKey;
      headers['x-rapidapi-host'] = 'v1.formula-1.api-sports.io';
      break;
  }

  try {
    const res = await axios.get(url, { headers });
    return res.data.response;
  } catch (err) {
    console.error(`Error fetching ${sport} data:`, err.response?.data || err.message);
    return [];
  }
}

module.exports = { fetchSportsData };
