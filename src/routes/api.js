const express = require('express');
const { fetchSportsData } = require('../models/dataFetcher');
const pool = require('../db');
const router = express.Router();

router.get('/data/:sport', async (req, res) => {
  const { sport } = req.params;

  try {
    const result = await fetchSportsData(sport);

    try {
      await pool.query(
        'INSERT INTO sports_data (sport, data) VALUES ($1, $2)',
        [sport, JSON.stringify(result)]
      );
    } catch (dbErr) {
      console.error(`❌ DB Insert failed for ${sport}:`, dbErr);
      // Optional: Still return result even if DB insert fails
    }

    res.json(result);
  } catch (apiErr) {
    console.error(`❌ Failed to fetch data for ${sport}:`, apiErr);
    res.status(500).json({
      error: 'Failed to fetch or save sports data.',
      details: apiErr.message,
    });
  }
});

module.exports = router;
