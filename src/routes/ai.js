const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Rate limiting for AI endpoints (more restrictive)
const aiRateLimitMap = new Map();
const AI_RATE_LIMIT_WINDOW = 60000; // 1 minute
const AI_RATE_LIMIT_MAX_REQUESTS = 20; // Lower limit for AI endpoints

const aiRateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!aiRateLimitMap.has(clientIP)) {
    aiRateLimitMap.set(clientIP, { count: 1, resetTime: now + AI_RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = aiRateLimitMap.get(clientIP);
  
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + AI_RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (clientData.count >= AI_RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ 
      error: 'AI rate limit exceeded', 
      message: 'Too many AI requests. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
};

// Apply AI rate limiting to all routes
router.use(aiRateLimit);

// Middleware to check Gemini API key
const checkGeminiKey = (req, res, next) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'AI service unavailable',
      message: 'Gemini API key not configured'
    });
  }
  next();
};

// Apply Gemini key check to all routes
router.use(checkGeminiKey);

// Helper function for Gemini API calls with better error handling
async function callGeminiAPI(prompt, data = null, maxLength = 12000) {
  try {
    // Build the user message content
    let userContent = prompt;
    
    if (data) {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      userContent += '\n\nData:\n' + dataString.slice(0, maxLength);
    }

    const contents = [
      {
        role: 'user',
        parts: [{ text: userContent }]
      }
    ];

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      { contents },
      { timeout: 30000 } // 30 second timeout for AI requests
    );

    const result = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!result) {
      throw new Error('No response from Gemini API');
    }

    return { success: true, result };
  } catch (error) {
    console.error('Gemini API error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    return {
      success: false,
      error: error.message,
      status: error.response?.status || 500
    };
  }
}

// Input validation helpers
const validateSport = (sport) => {
  const validSports = ['baseball', 'basketball', 'football', 'f1'];
  return validSports.includes(sport.toLowerCase());
};

const validateTeam = (team) => {
  return team && typeof team === 'string' && team.trim().length > 0;
};

const validateData = (data) => {
  return data && (Array.isArray(data) || typeof data === 'object');
};

// POST /ai/insights/:sport
router.post('/insights/:sport', async (req, res) => {
  const sport = req.params.sport;
  const data = req.body.data;

  // Validation
  if (!validateSport(sport)) {
    return res.status(400).json({ 
      error: 'Invalid sport',
      validSports: ['baseball', 'basketball', 'football', 'f1']
    });
  }

  if (!validateData(data)) {
    return res.status(400).json({ 
      error: 'Invalid data format',
      message: 'Data must be an array or object'
    });
  }

  try {
    const prompt = `Analyze this ${sport} dataset and provide key insights, trends, and standout performances. Focus on actionable insights and interesting patterns. Keep the response concise and informative.`;
    
    const geminiResult = await callGeminiAPI(prompt, data);
    
    if (!geminiResult.success) {
      return res.status(geminiResult.status).json({
        error: 'Failed to generate insights',
        message: geminiResult.error
      });
    }

    res.json({ 
      summary: geminiResult.result,
      sport,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Insights generation error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate insights',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /ai/sentiment/:team
router.post('/sentiment/:team', async (req, res) => {
  const team = req.params.team;

  if (!validateTeam(team)) {
    return res.status(400).json({ 
      error: 'Invalid team name',
      message: 'Team name must be a non-empty string'
    });
  }

  try {
    const prompt = `Analyze the current public sentiment around the sports team "${team}" based on recent news, social media trends, and general public opinion. Provide a balanced assessment of positive and negative sentiments with specific examples where possible.`;
    
    const geminiResult = await callGeminiAPI(prompt);
    
    if (!geminiResult.success) {
      return res.status(geminiResult.status).json({
        error: 'Failed to analyze sentiment',
        message: geminiResult.error
      });
    }

    res.json({ 
      sentiment: geminiResult.result,
      team,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error.message);
    res.status(500).json({ 
      error: 'Failed to analyze sentiment',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /ai/chat
router.post('/chat', async (req, res) => {
  const { question, context } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Invalid question',
      message: 'Question must be a non-empty string'
    });
  }

  if (question.length > 1000) {
    return res.status(400).json({
      error: 'Question too long',
      message: 'Question must be less than 1000 characters'
    });
  }

  try {
    let prompt = `You are a knowledgeable sports data analyst. Answer the user's question about sports data, statistics, and trends. Provide accurate, helpful information and suggest relevant visualizations or charts when appropriate. If you don't have specific information, be honest about limitations.

User question: ${question}`;

    const geminiResult = await callGeminiAPI(prompt, context);
    
    if (!geminiResult.success) {
      return res.status(geminiResult.status).json({
        error: 'Failed to get chat response',
        message: geminiResult.error
      });
    }

    res.json({ 
      answer: geminiResult.result,
      question,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get chat response',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /ai/semantic
router.post('/semantic', async (req, res) => {
  const { query, data } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Invalid query',
      message: 'Query must be a non-empty string'
    });
  }

  if (!validateData(data)) {
    return res.status(400).json({ 
      error: 'Invalid data format',
      message: 'Data must be an array or object'
    });
  }

  try {
    const prompt = `Parse this user query and extract relevant filters for sports data visualization. Return a JSON object with filter criteria that can be used for chart rendering.

Query: "${query}"

Return format should be like:
{
  "sport": "baseball",
  "metric": "ERA",
  "team": "specific team name if mentioned",
  "season": "year if mentioned",
  "timeframe": "recent/all-time/specific period",
  "chartType": "suggested chart type"
}`;

    const geminiResult = await callGeminiAPI(prompt, data);
    
    if (!geminiResult.success) {
      return res.status(geminiResult.status).json({
        error: 'Failed to parse semantic query',
        message: geminiResult.error
      });
    }

    let filters = {};
    try {
      // Try to parse as JSON first
      const jsonMatch = geminiResult.result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        filters = JSON.parse(jsonMatch[0]);
      } else {
        filters = { raw: geminiResult.result };
      }
    } catch (parseError) {
      filters = { raw: geminiResult.result };
    }

    res.json({ 
      filters,
      query,
      raw: geminiResult.result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Semantic search error:', error.message);
    res.status(500).json({ 
      error: 'Failed to process semantic query',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /ai/explain/:sport
router.post('/explain/:sport', async (req, res) => {
  const sport = req.params.sport;
  const { anomaly } = req.body;

  if (!validateSport(sport)) {
    return res.status(400).json({ 
      error: 'Invalid sport',
      validSports: ['baseball', 'basketball', 'football', 'f1']
    });
  }

  if (!anomaly) {
    return res.status(400).json({ 
      error: 'Missing anomaly data',
      message: 'Anomaly data is required for explanation'
    });
  }

  try {
    const prompt = `Analyze this ${sport} data anomaly and provide a detailed explanation of possible causes, context, and implications. Consider factors like player performance, team dynamics, external conditions, and historical patterns.`;
    
    const geminiResult = await callGeminiAPI(prompt, anomaly);
    
    if (!geminiResult.success) {
      return res.status(geminiResult.status).json({
        error: 'Failed to explain anomaly',
        message: geminiResult.error
      });
    }

    res.json({ 
      explanation: geminiResult.result,
      sport,
      anomaly,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Anomaly explanation error:', error.message);
    res.status(500).json({ 
      error: 'Failed to explain anomaly',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /ai/recommendations
router.post('/recommendations', async (req, res) => {
  const { selections } = req.body;

  if (!selections || !Array.isArray(selections)) {
    return res.status(400).json({ 
      error: 'Invalid selections',
      message: 'Selections must be an array'
    });
  }

  if (selections.length === 0) {
    return res.status(400).json({
      error: 'Empty selections',
      message: 'At least one selection is required for recommendations'
    });
  }

  try {
    const prompt = `Based on these user preferences and past selections, recommend 3 sports teams they might be interested in following. Consider team performance, playing style, and similar characteristics. Provide brief explanations for each recommendation.

Format as JSON array:
[
  {
    "team": "Team Name",
    "sport": "sport type",
    "reason": "explanation for recommendation"
  }
]`;

    const geminiResult = await callGeminiAPI(prompt, selections);
    
    if (!geminiResult.success) {
      return res.status(geminiResult.status).json({
        error: 'Failed to generate recommendations',
        message: geminiResult.error
      });
    }

    let recommendations = [];
    try {
      const jsonMatch = geminiResult.result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        recommendations = [{ raw: geminiResult.result }];
      }
    } catch (parseError) {
      recommendations = [{ raw: geminiResult.result }];
    }

    res.json({ 
      recommendations,
      raw: geminiResult.result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recommendations error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /ai/predict/:sport
router.post('/predict/:sport', async (req, res) => {
  const sport = req.params.sport;
  const data = req.body.data;

  if (!validateSport(sport)) {
    return res.status(400).json({ 
      error: 'Invalid sport',
      validSports: ['baseball', 'basketball', 'football', 'f1']
    });
  }

  if (!validateData(data)) {
    return res.status(400).json({ 
      error: 'Invalid data format',
      message: 'Historical data must be provided'
    });
  }

  try {
    const prompt = `Based on these ${sport} historical statistics and recent performance data, predict likely outcomes for upcoming games. Consider team form, player statistics, head-to-head records, and other relevant factors. Provide confidence levels and reasoning.

Format predictions as JSON array:
[
  {
    "matchup": "Team A vs Team B",
    "prediction": "predicted winner",
    "confidence": "percentage",
    "reasoning": "brief explanation"
  }
]`;

    const geminiResult = await callGeminiAPI(prompt, data);
    
    if (!geminiResult.success) {
      return res.status(geminiResult.status).json({
        error: 'Failed to generate predictions',
        message: geminiResult.error
      });
    }

    let predictions = [];
    try {
      const jsonMatch = geminiResult.result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        predictions = JSON.parse(jsonMatch[0]);
      } else {
        predictions = [];
      }
    } catch (parseError) {
      predictions = [];
    }

    res.json({ 
      predictions,
      sport,
      raw: geminiResult.result,
      timestamp: new Date().toISOString(),
      disclaimer: 'Predictions are for entertainment purposes only and should not be used for betting or financial decisions.'
    });
  } catch (error) {
    console.error('Predictions error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate predictions',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /ai/dashboard/recommend - Personalized Dashboard Layout Recommendation
router.post('/dashboard/recommend', async (req, res) => {
  const { userPreferences } = req.body;

  try {
    let prompt = 'Suggest a personalized dashboard layout for a sports data visualization app. ';
    
    if (userPreferences && Object.keys(userPreferences).length > 0) {
      prompt += `Consider these user preferences: ${JSON.stringify(userPreferences)}. `;
    }
    
    prompt += `Recommend layout sections, widgets, and chart types. Format as JSON:
{
  "layout": {
    "sections": [
      {
        "name": "section name",
        "widgets": ["widget1", "widget2"],
        "position": "top/middle/bottom"
      }
    ]
  },
  "rationale": "explanation for recommendations"
}`;

    const geminiResult = await callGeminiAPI(prompt, userPreferences);
    
    if (!geminiResult.success) {
      return res.status(geminiResult.status).json({
        error: 'Failed to generate dashboard recommendation',
        message: geminiResult.error
      });
    }

    let layout = {};
    try {
      const jsonMatch = geminiResult.result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        layout = JSON.parse(jsonMatch[0]);
      } else {
        layout = { raw: geminiResult.result };
      }
    } catch (parseError) {
      layout = { raw: geminiResult.result };
    }

    res.json({ 
      layout,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard recommendation error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate dashboard recommendation',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /ai/reports/:sport - Auto-Generated Reports
router.post('/reports/:sport', async (req, res) => {
  const { sport } = req.params;
  const { data } = req.body;

  if (!validateSport(sport)) {
    return res.status(400).json({ 
      error: 'Invalid sport',
      validSports: ['baseball', 'basketball', 'football', 'f1']
    });
  }

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ 
      error: 'Invalid data',
      message: 'Data must be a non-empty array of team/game information'
    });
  }

  try {
    const prompt = `Generate a comprehensive ${sport} performance report based on the provided data. Write in Markdown format with sections for each team, key statistics, trends, and insights. Make it professional and informative.`;

    const geminiResult = await callGeminiAPI(prompt, data, 15000); // Larger limit for reports
    
    if (!geminiResult.success) {
      return res.status(geminiResult.status).json({
        error: 'Failed to generate report',
        message: geminiResult.error
      });
    }

    const markdown = geminiResult.result;
    
    // Save to file (for download)
    const filename = `report_${sport}_${Date.now()}.md`;
    const filePath = path.join(__dirname, '../../public', filename);
    
    // Ensure public directory exists
    const publicDir = path.dirname(filePath);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    try {
      fs.writeFileSync(filePath, markdown, 'utf8');
    } catch (writeError) {
      console.warn('Failed to save report file:', writeError.message);
    }

    res.json({
      markdown,
      sport,
      downloadUrl: fs.existsSync(filePath) ? `/${filename}` : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Report generation error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate report',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;