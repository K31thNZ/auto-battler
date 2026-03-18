const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// Routes
const { router: authRouter } = require('./routes/auth');
const creaturesRouter = require('./routes/creatures');
const battleRouter = require('./routes/battle');
const marketplaceRouter = require('./routes/marketplace');

app.use('/api/auth', authRouter);
app.use('/api/creatures', creaturesRouter);
app.use('/api/battle', battleRouter);
app.use('/api/marketplace', marketplaceRouter);

// Player profile endpoint
const db = require('./db');
const { authMiddleware } = require('./routes/auth');

app.get('/api/profile', authMiddleware, (req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.user.playerId);
  const achievements = db.prepare('SELECT achievement_key, unlocked_at FROM achievements WHERE player_id = ?').all(player.id);
  const creatureCount = db.prepare('SELECT COUNT(*) as cnt FROM player_creatures WHERE player_id = ?').get(player.id);
  const battles = db.prepare(`
    SELECT * FROM battles WHERE player_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(player.id);

  res.json({
    ...player,
    achievements,
    creature_count: creatureCount.cnt,
    battle_history: battles.map(b => ({
      ...b,
      player_team: JSON.parse(b.player_team || '[]'),
      enemy_team: JSON.parse(b.enemy_team || '[]'),
    }))
  });
});

app.listen(PORT, () => {
  console.log(`🎮 Illuvara server running on http://localhost:${PORT}`);
});
