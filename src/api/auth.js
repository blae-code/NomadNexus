import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import models from '../models/index.js';

const router = express.Router();
const User = models.User;

// Register
router.post('/register', async (req, res) => {
  const { full_name, callsign, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ full_name, callsign, password: hashedPassword });
    res.json({ id: user.id, callsign: user.callsign });
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { callsign, password } = req.body;
  const user = await User.findOne({ where: { callsign } });
  if (!user) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
  const token = jwt.sign({ id: user.id, callsign: user.callsign }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
  res.json({ token });
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  res.json(user);
});

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

export default router;