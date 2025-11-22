const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Note: In a production environment like Render, you should set GOOGLE_APPLICATION_CREDENTIALS 
// or initialize with a service account object from environment variables.
// For now, we'll try default initialization which works if the environment is set up correctly.
try {
  admin.initializeApp();
} catch (error) {
  console.warn('Firebase Admin initialization failed. Ensure credentials are set if using Firebase features.', error.message);
}

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Discord OAuth configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1397459015679741962';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '_6Z7j28KciuVegQYlw3mJ7voAp3JL-v1';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3002/auth/discord/callback';

// Helper function to make Discord API requests
async function makeDiscordRequest(url, token) {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Discord API Error:', error.response?.data || error.message);
    throw new Error('Failed to fetch data from Discord API');
  }
}

// Middleware to verify Firebase ID Token
async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Routes

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Auth: Login redirect
app.get('/auth/discord', (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
  res.redirect(url);
});

// Auth: Callback
app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: DISCORD_REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    const refreshToken = tokenResponse.data.refresh_token;

    // Get user information
    const user = await makeDiscordRequest('https://discord.com/api/users/@me', accessToken);

    // Check authorization (Bot Owner)
    const authorizedUserId = '1252556134703693909';
    if (user.id !== authorizedUserId) {
      return res.status(403).send('Unauthorized access. Only the bot owner can access this dashboard.');
    }

    // Get user's guilds
    const guilds = await makeDiscordRequest('https://discord.com/api/users/@me/guilds', accessToken);

    // Create custom token for Firebase Authentication
    // Note: This requires the service account to have Token Creator permissions
    const customToken = await admin.auth().createCustomToken(user.id, {
      discordAccessToken: accessToken,
      discordRefreshToken: refreshToken,
      user: user,
      guilds: guilds
    });

    // In a real app, you'd redirect back to the frontend with the token
    // For now, we'll return JSON as the original function did, but this might need adjustment for browser flow
    // If accessed via browser, we should probably redirect to index.html with the token in query param or fragment
    // But to match the original function behavior:
    res.json({ customToken, user, guilds });

  } catch (error) {
    console.error('OAuth Error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

// API: Get User Guilds
app.get('/api/guilds', verifyAuth, async (req, res) => {
  try {
    // The discordAccessToken is in the custom claims of the verified ID token
    const discordAccessToken = req.user.discordAccessToken;
    if (!discordAccessToken) {
      return res.status(401).json({ error: 'No Discord access token found in claims' });
    }

    const guilds = await makeDiscordRequest('https://discord.com/api/users/@me/guilds', discordAccessToken);
    res.json(guilds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch guilds' });
  }
});

// API: Get Guild Channels
app.get('/api/channels/:guildId', verifyAuth, async (req, res) => {
  const { guildId } = req.params;
  try {
    const discordAccessToken = req.user.discordAccessToken;
    if (!discordAccessToken) {
      return res.status(401).json({ error: 'No Discord access token found in claims' });
    }

    const channels = await makeDiscordRequest(`https://discord.com/api/guilds/${guildId}/channels`, discordAccessToken);
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// API: Update Settings
app.post('/api/settings', verifyAuth, async (req, res) => {
  const { guildId, settings } = req.body;

  if (!guildId || !settings) {
    return res.status(400).json({ error: 'Missing guild ID or settings' });
  }

  try {
    console.log(`Updating settings for guild ${guildId}:`, settings);

    // Save to Firestore
    await admin.firestore().collection('guildSettings').doc(guildId).set(settings, { merge: true });

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Nexus Bot Dashboard server running on http://localhost:${PORT}`);
});
