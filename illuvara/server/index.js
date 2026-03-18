const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// In production Railway sets NODE_ENV=production and serves the built React app
app.use(cors({
  origin: isProd ? '*' : ['http://localhost:5173', 'http://localhost:3000']
}));
app.use(express.json());

// API Routes
const { router: authRouter } = require('./routes/auth');
const creaturesRouter = require('./routes/creatures');
const battleRouter = require('./routes/battle');
const marketplaceRouter = require('./routes/marketplace');

app.use('/api/auth', authRouter);
app.use('/api/creatures', creaturesRouter);
app.use('/api/battle', battleRouter);
app.use('/api/marketplace', marketplaceRouter);

// Profile endpoint
const db = require('./db');
const { authMiddleware } = require('./routes/auth');

app.get('/api/profile', authMiddleware, (req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.user.playerId);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  const achievements = db.prepare('SELECT achievement_key, unlocked_at FROM achievements WHERE player_id = ?').all(player.id);
  const creatureCount = db.prepare('SELECT COUNT(*) as cnt FROM player_creatures WHERE player_id = ?').get(player.id);
  const battles = db.prepare('SELECT * FROM battles WHERE player_id = ? ORDER BY created_at DESC LIMIT 10').all(player.id);

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

// Serve built React frontend in production
if (isProd) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  // React Router — send all non-API routes to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Auto-seed on first start if DB is empty
const seedIfNeeded = () => {
  try {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM creatures').get();
    if (count.cnt === 0) {
      console.log('🌱 Empty database detected, seeding...');
      require('./seed');
    } else {
      console.log(`✅ Database ready (${count.cnt} creatures loaded)`);
    }
  } catch (err) {
    console.log('🌱 Seeding database for first time...');
    try { require('./seed'); } catch (e) { console.error('Seed failed:', e.message); }
  }
};

seedIfNeeded();

app.listen(PORT, () => {
  console.log(`🎮 Illuvara running on port ${PORT} (${isProd ? 'production' : 'development'})`);
});
