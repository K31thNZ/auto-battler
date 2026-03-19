const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app    = express();
const PORT   = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({ origin: isProd ? '*' : ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// ─── Route registration ───────────────────────────────────────────────────────
const { router: authRouter, authMiddleware } = require('./routes/auth');
const creaturesRouter  = require('./routes/creatures');
const battleRouter     = require('./routes/battle');
const marketplaceRouter= require('./routes/marketplace');
const shardsRouter     = require('./routes/shards');
const socketsRouter    = require('./routes/sockets');

app.use('/api/auth',        authRouter);
app.use('/api/creatures',   creaturesRouter);
app.use('/api/battle',      battleRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/shards',      shardsRouter);
app.use('/api/sockets',     socketsRouter);

// ─── Profile endpoint ─────────────────────────────────────────────────────────
const db = require('./db');

app.get('/api/profile', authMiddleware, (req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.user.playerId);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const achievements  = db.prepare('SELECT achievement_key, unlocked_at FROM achievements WHERE player_id = ?').all(player.id);
  const creatureCount = db.prepare('SELECT COUNT(*) as cnt FROM player_creatures WHERE player_id = ?').get(player.id);
  const battles       = db.prepare('SELECT * FROM battles WHERE player_id = ? ORDER BY created_at DESC LIMIT 10').all(player.id);
  const shards        = db.prepare('SELECT element, quantity FROM elemental_shards WHERE player_id = ? ORDER BY quantity DESC').all(player.id);

  res.json({
    ...player,
    achievements,
    creature_count: creatureCount.cnt,
    elemental_shards: shards,
    battle_history: battles.map(b => ({
      ...b,
      player_team: JSON.parse(b.player_team || '[]'),
      enemy_team:  JSON.parse(b.enemy_team  || '[]'),
    })),
  });
});

// ─── Serve built frontend in production ───────────────────────────────────────
if (isProd) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// ─── Auto-seed on first run ───────────────────────────────────────────────────
function seedIfNeeded() {
  try {
    const { cnt } = db.prepare('SELECT COUNT(*) as cnt FROM creatures').get();
    if (cnt === 0) { console.log('🌱 Empty DB — seeding…'); require('./seed'); }
    else console.log(`✅ DB ready — ${cnt} creatures loaded`);
  } catch {
    console.log('🌱 Seeding fresh database…');
    try { require('./seed'); } catch (e) { console.error('Seed error:', e.message); }
  }
}
seedIfNeeded();

app.listen(PORT, () => console.log(`🎮 Illuvara on :${PORT} [${isProd ? 'prod' : 'dev'}]`));
