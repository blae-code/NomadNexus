import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';
import { sequelize } from './src/models/index.js';
import apiRoutes from './src/api/routes.js';
import authRoutes, { authMiddleware } from './src/api/auth.js';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Auth routes
app.use('/auth', authRoutes);

// API routes
app.use('/api', authMiddleware, apiRoutes);


import models from './src/models/index.js';
const User = models.User;

// ... (rest of the imports)

// ... (express app setup)

// Endpoint: Generate LiveKit Token
app.post('/functions/generateLiveKitToken', authMiddleware, async (req, res) => {
  try {
    const { roomNames, roomName, participantName } = req.body;
    
    let rooms = [];
    if (roomNames && Array.isArray(roomNames)) {
        rooms = roomNames;
    } else if (roomName) {
        rooms = [roomName];
    } else {
         return res.status(400).json({ error: 'Missing roomNames or roomName' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const canPublish = user.rank !== 'Vagrant';

    const effectiveParticipantName = participantName || user.callsign || 'Unknown';
    
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
        console.error("Missing LiveKit credentials in .env");
        return res.status(500).json({ error: 'Server misconfigured: Missing LiveKit credentials' });
    }

    const tokens = {};

    for (const room of rooms) {
        const at = new AccessToken(apiKey, apiSecret, {
            identity: effectiveParticipantName,
            name: effectiveParticipantName,
        });

        at.addGrant({ roomJoin: true, room: room, canPublish, canSubscribe: true });
        tokens[room] = await at.toJwt();
    }

    res.json({ tokens, livekitUrl });

  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ... (rest of the file)


app.post('/functions/commsAssistant', authMiddleware, async (req, res) => {
  res.json({ result: 'This is a mocked LLM response from commsAssistant.' });
});

app.post('/functions/inferTacticalStatus', authMiddleware, async (req, res) => {
  res.json({ status: 'Combat Alert' });
});

// Start Server
sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`
    🚀 Local Backend Server running at http://localhost:${port}
    
    Endpoints:
    - /auth/login
    - /auth/register
    - POST /functions/generateLiveKitToken
    - /api/* for all models
  
    Make sure your .env file has:
    - LIVEKIT_API_KEY
    - LIVEKIT_API_SECRET
    - LIVEKIT_URL
    - JWT_SECRET
    `);
  });
});