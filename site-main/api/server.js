/**
 * RobBob News API Server
 * Simple Express server for managing launcher news
 * 
 * Deploy this to your server (e.g., VPS, Heroku, Vercel)
 * URL: https://robbob.ru/api or separate domain
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const CONFIG = {
  // API Key for admin authentication
  // Change this to a secure random string!
  API_KEY: process.env.API_KEY || 'robbob-admin-secret-key-change-me',
  
  // Data file path
  DATA_FILE: path.join(__dirname, 'data', 'news.json')
};

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins (for launcher)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Accept']
}));

app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize news file if it doesn't exist
if (!fs.existsSync(CONFIG.DATA_FILE)) {
  const defaultNews = {
    news: [
      {
        id: crypto.randomUUID(),
        title: 'Добро пожаловать в RobBob!',
        emoji: 'rocket',
        content: 'Первый релиз RobBob Launcher с улучшенным сетевым режимом!',
        date: new Date().toISOString().split('T')[0],
        pinned: true,
        link: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };
  fs.writeFileSync(CONFIG.DATA_FILE, JSON.stringify(defaultNews, null, 2));
}

// Helper: Load news from file
function loadNews() {
  try {
    const data = fs.readFileSync(CONFIG.DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading news:', err);
    return { news: [] };
  }
}

// Helper: Save news to file
function saveNews(data) {
  try {
    fs.writeFileSync(CONFIG.DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving news:', err);
    return false;
  }
}

// Helper: Verify API key
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== CONFIG.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid API key' });
  }
  
  next();
}

// ============================================
// Public Routes (no auth required)
// ============================================

// GET /api/news - Get all news (for launcher)
app.get('/api/news', (req, res) => {
  const data = loadNews();
  
  // Sort: pinned first, then by date descending
  data.news.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.date) - new Date(a.date);
  });
  
  res.json(data);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Protected Routes (require API key)
// ============================================

// POST /api/auth/verify - Verify API key
app.post('/api/auth/verify', verifyApiKey, (req, res) => {
  res.json({ success: true, message: 'API key is valid' });
});

// POST /api/news - Create new news
app.post('/api/news', verifyApiKey, (req, res) => {
  const { title, content, emoji, link, pinned } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Bad Request', message: 'Title and content are required' });
  }
  
  const data = loadNews();
  
  const newNews = {
    id: crypto.randomUUID(),
    title: title.trim(),
    content: content.trim(),
    emoji: emoji || 'info',
    date: new Date().toISOString().split('T')[0],
    pinned: pinned || false,
    link: link || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data.news.unshift(newNews);
  
  if (saveNews(data)) {
    res.status(201).json(newNews);
  } else {
    res.status(500).json({ error: 'Server Error', message: 'Failed to save news' });
  }
});

// PUT /api/news/:id - Update news
app.put('/api/news/:id', verifyApiKey, (req, res) => {
  const { id } = req.params;
  const { title, content, emoji, link, pinned } = req.body;
  
  const data = loadNews();
  const index = data.news.findIndex(n => n.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'News not found' });
  }
  
  // Update fields
  if (title) data.news[index].title = title.trim();
  if (content) data.news[index].content = content.trim();
  if (emoji) data.news[index].emoji = emoji;
  if (link !== undefined) data.news[index].link = link || null;
  if (pinned !== undefined) data.news[index].pinned = pinned;
  data.news[index].updatedAt = new Date().toISOString();
  
  if (saveNews(data)) {
    res.json(data.news[index]);
  } else {
    res.status(500).json({ error: 'Server Error', message: 'Failed to update news' });
  }
});

// DELETE /api/news/:id - Delete news
app.delete('/api/news/:id', verifyApiKey, (req, res) => {
  const { id } = req.params;
  
  const data = loadNews();
  const index = data.news.findIndex(n => n.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'News not found' });
  }
  
  data.news.splice(index, 1);
  
  if (saveNews(data)) {
    res.json({ success: true, message: 'News deleted' });
  } else {
    res.status(500).json({ error: 'Server Error', message: 'Failed to delete news' });
  }
});

// PATCH /api/news/:id/pin - Toggle pin status
app.patch('/api/news/:id/pin', verifyApiKey, (req, res) => {
  const { id } = req.params;
  
  const data = loadNews();
  const index = data.news.findIndex(n => n.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'News not found' });
  }
  
  data.news[index].pinned = !data.news[index].pinned;
  data.news[index].updatedAt = new Date().toISOString();
  
  if (saveNews(data)) {
    res.json(data.news[index]);
  } else {
    res.status(500).json({ error: 'Server Error', message: 'Failed to update news' });
  }
});

// ============================================
// Roblox API Proxy (to bypass CORS)
// These endpoints proxy requests to Roblox API
// so the admin panel can fetch game info
// ============================================

const https = require('https');

// Helper function to fetch from external API
function fetchExternalAPI(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'RobBob-Admin-Panel/1.0',
        'Accept': 'application/json'
      }
    }, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response from Roblox API'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// GET /api/roblox/universe/:placeId - Get universe ID from place ID
app.get('/api/roblox/universe/:placeId', async (req, res) => {
  const { placeId } = req.params;
  
  // Validate placeId
  if (!placeId || !/^\d+$/.test(placeId)) {
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid place ID' });
  }
  
  try {
    const data = await fetchExternalAPI(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
    res.json(data);
  } catch (err) {
    console.error('Roblox universe API error:', err.message);
    res.status(500).json({ error: 'Proxy Error', message: 'Failed to fetch from Roblox API' });
  }
});

// GET /api/roblox/games/:universeId - Get game details
app.get('/api/roblox/games/:universeId', async (req, res) => {
  const { universeId } = req.params;
  
  // Validate universeId
  if (!universeId || !/^\d+$/.test(universeId)) {
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid universe ID' });
  }
  
  try {
    const data = await fetchExternalAPI(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
    res.json(data);
  } catch (err) {
    console.error('Roblox games API error:', err.message);
    res.status(500).json({ error: 'Proxy Error', message: 'Failed to fetch game details' });
  }
});

// GET /api/roblox/thumbnails/:universeId - Get game thumbnail
app.get('/api/roblox/thumbnails/:universeId', async (req, res) => {
  const { universeId } = req.params;
  
  // Validate universeId
  if (!universeId || !/^\d+$/.test(universeId)) {
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid universe ID' });
  }
  
  try {
    const data = await fetchExternalAPI(
      `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`
    );
    res.json(data);
  } catch (err) {
    console.error('Roblox thumbnails API error:', err.message);
    res.status(500).json({ error: 'Proxy Error', message: 'Failed to fetch thumbnail' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server Error', message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`RobBob News API running on port ${PORT}`);
  console.log(`API Key: ${CONFIG.API_KEY}`);
  console.log(`Data file: ${CONFIG.DATA_FILE}`);
});
