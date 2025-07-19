// POST /ai/sentiment/:team
router.post('/sentiment/:team', async (req, res) => {
  const team = req.params.team;
  if (!team) {
    return res.status(400).json({ error: 'Team is required.' });
  }
  try {
    const prompt = `What is the public sentiment around ${team} in recent sports news and tweets?`;
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { parts: [ { text: prompt } ] }
        ]
      }
    );
    const sentiment = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No sentiment found.';
    res.json({ sentiment });
  } catch (error) {
    console.error('Gemini API error:', error.message);
    res.status(500).json({ error: 'Failed to get sentiment.' });
  }
});
// POST /ai/chat
router.post('/chat', async (req, res) => {
  const { question, context } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'User question is required.' });
  }
  try {
    const prompt = `You are a sports data analyst. Answer the user's question. If relevant, include a link to the appropriate graph or chart section.`;
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { parts: [ { text: prompt } ] },
          { parts: [ { text: `Question: ${question}` } ] },
          ...(context ? [{ parts: [ { text: `Context: ${JSON.stringify(context).slice(0, 12000)}` } ] }] : [])
        ]
      }
    );
    const answer = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer available.';
    res.json({ answer });
  } catch (error) {
    console.error('Gemini API error:', error.message);
    res.status(500).json({ error: 'Failed to get chat answer.' });
  }
});
// POST /ai/semantic
router.post('/semantic', async (req, res) => {
  const { query, data } = req.body;
  if (!query || !data) {
    return res.status(400).json({ error: 'Query and data are required.' });
  }
  try {
    const prompt = `Given this dataset, parse the following user query and return a JSON object with metric filters for chart rendering.\nQuery: ${query}`;
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { parts: [ { text: prompt } ] },
          { parts: [ { text: JSON.stringify(data).slice(0, 12000) } ] }
        ]
      }
    );
    let filters = {};
    const text = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    try {
      filters = JSON.parse(text);
    } catch {
      filters = text;
    }
    res.json({ filters, raw: text });
  } catch (error) {
    console.error('Gemini API error:', error.message);
    res.status(500).json({ error: 'Failed to get semantic search results.' });
  }
});
// POST /ai/explain/:sport
router.post('/explain/:sport', async (req, res) => {
  const sport = req.params.sport;
  const { anomaly } = req.body;
  if (!sport || !anomaly) {
    return res.status(400).json({ error: 'Sport and anomaly data are required.' });
  }
  try {
    const prompt = `Explain why this anomaly occurred: ${JSON.stringify(anomaly)}`;
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { parts: [ { text: prompt } ] }
        ]
      }
    );
    const explanation = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No explanation available.';
    res.json({ explanation });
  } catch (error) {
    console.error('Gemini API error:', error.message);
    res.status(500).json({ error: 'Failed to get anomaly explanation.' });
  }
});
// POST /ai/recommendations
router.post('/recommendations', async (req, res) => {
  const { selections } = req.body;
  if (!selections || !Array.isArray(selections)) {
    return res.status(400).json({ error: 'User selections are required.' });
  }
  try {
    const prompt = `Given this user's past selections, recommend 3 teams to follow.`;
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { parts: [ { text: prompt } ] },
          { parts: [ { text: JSON.stringify(selections).slice(0, 12000) } ] }
        ]
      }
    );
    let recommendations = [];
    const text = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    try {
      recommendations = JSON.parse(text);
    } catch {
      recommendations = text;
    }
    res.json({ recommendations, raw: text });
  } catch (error) {
    console.error('Gemini API error:', error.message);
    res.status(500).json({ error: 'Failed to get AI recommendations.' });
  }
});
// POST /ai/predict/:sport
router.post('/predict/:sport', async (req, res) => {
  const sport = req.params.sport;
  const data = req.body.data;
  if (!sport || !data) {
    return res.status(400).json({ error: 'Sport and data are required.' });
  }
  try {
    const prompt = `Predict the next game outcomes based on these historical stats.`;
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { parts: [ { text: prompt } ] },
          { parts: [ { text: JSON.stringify(data).slice(0, 12000) } ] }
        ]
      }
    );
    // Expecting Gemini to return a JSON array of predictions
    let predictions = [];
    const text = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    try {
      predictions = JSON.parse(text);
    } catch {
      predictions = [];
    }
    res.json({ predictions, raw: text });
  } catch (error) {
    console.error('Gemini API error:', error.message);
    res.status(500).json({ error: 'Failed to get AI predictions.' });
  }
});
const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// POST /ai/insights/:sport
router.post('/insights/:sport', async (req, res) => {
  const sport = req.params.sport;
  const data = req.body.data;
  if (!sport || !data) {
    return res.status(400).json({ error: 'Sport and data are required.' });
  }
  try {
    const prompt = `Summarize the top trends and standout performances for this ${sport} dataset.`;
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { parts: [ { text: prompt } ] },
          { parts: [ { text: JSON.stringify(data).slice(0, 12000) } ] }
        ]
      }
    );
    const summary = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary available.';
    res.json({ summary });
  } catch (error) {
    console.error('Gemini API error:', error.message);
    res.status(500).json({ error: 'Failed to get AI insights.' });
  }
});

module.exports = router;

// --- Personalized Dashboard Layout Recommendation ---
// Route: /ai/dashboard/recommend
// Output: Suggested dashboard layout for user focused on ERA and OPS
router.post('/dashboard/recommend', async (req, res) => {
  try {
    const prompt = `Suggest a dashboard layout for a user who views mostly ERA and OPS charts. Include layout sections, recommended widgets, and a brief rationale. Format as JSON.`;
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { parts: [ { text: prompt } ] }
        ]
      }
    );
    let layout = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    try {
      layout = JSON.parse(layout);
    } catch {
      // If not valid JSON, return as string
    }
    res.json({ layout });
  } catch (e) {
    console.error('Gemini API error:', e.message);
    res.status(500).json({ error: 'Failed to get dashboard layout recommendation.' });
  }
});

// --- Auto-Generated Reports ---
// Route: /ai/reports/:sport
// Output: Markdown file with performance summary for each team over last 3 games
const fs = require('fs');
const path = require('path');

router.post('/reports/:sport', async (req, res) => {
  const { sport } = req.params;
  const { data } = req.body; // expects array of teams with recent games
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid data array.' });
  }
  try {
    const prompt = `Write a performance summary for each ${sport} team over the last 3 games. Use the provided data. Format the output as Markdown with a section for each team.`;
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { parts: [ { text: prompt } ] },
          { parts: [ { text: JSON.stringify(data).slice(0, 12000) } ] }
        ]
      }
    );
    const markdown = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || '# No report generated.';
    // Save to file (for download)
    const filename = `report_${sport}_${Date.now()}.md`;
    const filePath = path.join(__dirname, '../../public', filename);
    fs.writeFileSync(filePath, markdown, 'utf8');
    // Return markdown and download link
    res.json({
      markdown,
      downloadUrl: `/${filename}`
    });
  } catch (e) {
    console.error('Gemini API error:', e.message);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});
