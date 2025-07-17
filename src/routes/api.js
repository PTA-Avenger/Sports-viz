const express = require('express');
const { fetchSportsData } = require('../models/dataFetcher');
const pool = require('../db');
const router = express.Router();

router.get('/data/:sport', async (req, res) => {
  const { sport } = req.params;
  const result = await fetchSportsData(sport);

  await pool.query(
    'INSERT INTO sports_data (sport, data) VALUES ($1, $2)',
    [sport, JSON.stringify(result)]
  );

  res.json(result);
});

module.exports = router;
