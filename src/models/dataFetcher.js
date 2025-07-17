require('dotenv').config();
const axios = require('axios');

async function fetchSportsData(sport, season = '2025') {
  const apiKey = process.env.API_KEY;
  let url, headers = {};

  switch (sport) {
    case 'baseball':
      url = `https://v3.football.api-sports.io/baseball/teams/statistics?league=1&season=${season}`;
      headers['x-apisports-key'] = apiKey;
      break;
    case 'basketball':
      url = `https://v3.football.api-sports.io/basketball/teams/statistics?league=12&season=${season}`;
      headers['x-apisports-key'] = apiKey;
      break;
    case 'football':
      url = `https://v3.football.api-sports.io/teams/statistics?league=39&season=${season}&team=33`;
      headers['x-apisports-key'] = apiKey;
      break;
    case 'f1':
      url = `http://ergast.com/api/f1/${season}/constructorStandings.json`;
      break;
  }

  try {
    const res = await axios.get(url, { headers });
    return sport === 'f1'
      ? res.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings
      : res.data.response;
  } catch (err) {
    console.error(err);
    return [];
  }
}

module.exports = { fetchSportsData };
