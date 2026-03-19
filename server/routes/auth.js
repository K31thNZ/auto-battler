const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const { CREATURES } = require('../creatures');

const JWT_SECRET = process.env.JWT_SECRET || 'illuvara-secret-key-2024';

// Connect wallet (login/register)
router.post('/connect', (req, res) => {
  try {
    let { wallet_address } = req.body;
    if (!wallet_address) {
      // Generate random wallet address
      const hex = [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      wallet_address = `0x${hex}`;
    }

    let player = db.prepare('SELECT * FROM players WHERE wallet_address = ?').get(wallet_address);
    let isNew = false;

    if (!player) {
      isNew = true;
      db.prepare('INSERT INTO players (wallet_address, shards) VALUES (?, 500)').run(wallet_address);
      player = db.prepare('SELECT * FROM players WHERE wallet_address = ?').get(wallet_address);

      // Give starter creatures
      const starterIds = [1, 2, 3]; // Emberpup, Aquafin, Galesprout
      const insertPC = db.prepare(`
        INSERT INTO player_creatures (player_id, creature_id, level, xp, atk, def, spd, max_hp, current_hp, in_team, team_slot)
        VALUES (?, ?, 1, 0, ?, ?, ?, ?, ?, 1, ?)
      `);
      for (let i = 0; i < starterIds.length; i++) {
        const c = CREATURES.find(c => c.id === starterIds[i]);
        insertPC.run(player.id, c.id, c.base_atk, c.base_def, c.base_spd, c.base_hp, c.base_hp, i + 1);
      }
    }

    const token = jwt.sign({ playerId: player.id, wallet: wallet_address }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      player: {
        id: player.id,
        wallet_address: player.wallet_address,
        username: player.username,
        shards: player.shards,
        battles_won: player.battles_won,
        battles_lost: player.battles_lost,
        created_at: player.created_at
      },
      isNew
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Middleware to verify token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Get current player
router.get('/me', authMiddleware, (req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.user.playerId);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  const achievements = db.prepare('SELECT achievement_key, unlocked_at FROM achievements WHERE player_id = ?').all(player.id);
  res.json({ ...player, achievements });
});

module.exports = { router, authMiddleware };
