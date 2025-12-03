import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';
import { sequelize } from './src/models/index.js';
import apiRoutes from './src/api/routes.js';
import authRoutes, { authMiddleware } from './src/api/auth.js';
import models from './src/models/index.js';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Auth routes
app.use('/auth', authRoutes);

// API routes
app.use('/api', authMiddleware, apiRoutes);

const functionRouter = express.Router();

functionRouter.post('/generateLiveKitToken', authMiddleware, async (req, res) => {
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

    const user = await models.User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const canPublish = user.rank !== 'Vagrant';

    const effectiveParticipantName = participantName || user.callsign || 'Unknown';

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      console.error('Missing LiveKit credentials in .env');
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

    res.json({ data: { tokens, livekitUrl } });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

functionRouter.post('/commsAssistant', authMiddleware, async (req, res) => {
  try {
    const { action, data } = req.body;

    switch (action) {
      case 'summarize_logs':
        return res.json({
          data: {
            summary: 'Comms traffic is stable. No hostile intent detected.',
            key_points: [
              'Traffic on primary net within expected volume.',
              'No distress calls or escalation keywords found.',
              'Recommend maintaining current net discipline.',
            ],
          },
        });
      case 'suggest_nets':
        return res.json({
          data: {
            recommended_net_code: 'NOMAD-44',
            reason: 'Channel isolation available and encryption keys validated.',
          },
        });
      case 'ask_comms': {
        const question = data?.query || 'Standing by.';
        return res.json({
          data: {
            answer: `Copy. ${question} Logged and routed to ops for follow-up.`,
          },
        });
      }
      default:
        return res.status(400).json({ error: 'Unsupported action' });
    }
  } catch (error) {
    console.error('Comms assistant error:', error);
    res.status(500).json({ error: error.message });
  }
});

functionRouter.post('/inferTacticalStatus', authMiddleware, async (req, res) => {
  try {
    const { report, userRank } = req.body;
    const normalizedReport = (report || '').toLowerCase();

    const isHostile = normalizedReport.includes('engaged') || normalizedReport.includes('hostile');
    const color = isHostile ? 'Red' : 'Amber';

    const result = {
      color,
      status: isHostile ? 'Contact Reported' : 'Monitoring',
      location: 'Unknown Sector',
      summary: report || 'Awaiting telemetry update.',
      acknowledged_by: userRank || 'Unknown',
    };

    return res.json({ data: result });
  } catch (error) {
    console.error('Tactical status error:', error);
    res.status(500).json({ error: error.message });
  }
});

functionRouter.post('/silenceUser', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await models.User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = 'SILENCED';
    await user.save();

    return res.json({ data: { userId: user.id, role: user.role } });
  } catch (error) {
    console.error('Silence user error:', error);
    res.status(500).json({ error: error.message });
  }
});

functionRouter.post('/dischargeUser', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await models.User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.rank = 'Discharged';
    await user.save();

    return res.json({ data: { userId: user.id, rank: user.rank } });
  } catch (error) {
    console.error('Discharge user error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use('/functions', functionRouter);

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
