const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('./auth');

// Shard yield by tier — higher tier = more shards, rarer type bonus
const TIER_YIELD = { 1: 8, 2: 20, 3: 55, 4: 150, 5: 400 };
const RARITY_BONUS = { Common: 1.0, Rare: 1.3, Legendary: 1.8, Apex: 3.0 };

function calcShardYield(creature) {
  const base = TIER_YIELD[creature.tier] || 8;
  const bonus = RARITY_BONUS[creature.rarity] || 1.0;
  // slight variance ±15%
  const variance = 0.85 + Math.random() * 0.3;
  return Math.max(1, Math.round(base * bonus * variance));
}

function addShards(playerId, element, quantity, reason, creatureName, creatureTier) {
  db.prepare(`
    INSERT INTO elemental_shards (player_id, element, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(player_id, element) DO UPDATE SET quantity = quantity + excluded.quantity
  `).run(playerId, element, quantity);

  // Also populate purity wallet (all released shards start at purity 1)
  db.prepare(`
    INSERT INTO shard_purity_wallet (player_id, element, purity, quantity)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(player_id, element, purity) DO UPDATE SET quantity = quantity + excluded.quantity
  `).run(playerId, element, quantity);

  db.prepare(`
    INSERT INTO shard_transactions (player_id, element, quantity, reason, creature_name, creature_tier)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(playerId, element, quantity, reason, creatureName || null, creatureTier || null);
}

// Get player's shard wallet
router.get('/', authMiddleware, (req, res) => {
  const shards = db.prepare(`
    SELECT element, quantity FROM elemental_shards
    WHERE player_id = ? ORDER BY quantity DESC
  `).all(req.user.playerId);

  const history = db.prepare(`
    SELECT * FROM shard_transactions
    WHERE player_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(req.user.playerId);

  res.json({ shards, history });
});

// Release (burn) a creature — distill into elemental shards
router.post('/release', authMiddleware, (req, res) => {
  const { playerCreatureId } = req.body;
  if (!playerCreatureId) return res.status(400).json({ error: 'playerCreatureId required' });

  const pc = db.prepare(`
    SELECT pc.*, c.name as creature_name, c.type1, c.type2, c.tier, c.rarity
    FROM player_creatures pc
    JOIN creatures c ON pc.creature_id = c.id
    WHERE pc.id = ? AND pc.player_id = ?
  `).get(playerCreatureId, req.user.playerId);

  if (!pc) return res.status(404).json({ error: 'Creature not found' });
  if (pc.in_team) return res.status(400).json({ error: 'Remove this creature from your team before releasing it' });

  // Calculate yield for each type
  const primaryYield = calcShardYield({ tier: pc.tier, rarity: pc.rarity });
  // Dual-type creatures give a secondary shard at 40% yield
  const secondaryYield = pc.type2 ? Math.max(1, Math.round(primaryYield * 0.4)) : 0;

  const releaseTx = db.transaction(() => {
    // Remove creature
    db.prepare('DELETE FROM player_creatures WHERE id = ?').run(pc.id);

    // Add primary type shards
    addShards(req.user.playerId, pc.type1, primaryYield, 'release', pc.creature_name, pc.tier);

    // Add secondary type shards (dual-type bonus)
    if (pc.type2 && secondaryYield > 0) {
      addShards(req.user.playerId, pc.type2, secondaryYield, 'release', pc.creature_name, pc.tier);
    }

    // Achievement: first release
    db.prepare('INSERT OR IGNORE INTO achievements (player_id, achievement_key) VALUES (?, ?)').run(req.user.playerId, 'first_release');
  });

  releaseTx();

  // Return updated shard wallet
  const shards = db.prepare(`
    SELECT element, quantity FROM elemental_shards WHERE player_id = ? ORDER BY quantity DESC
  `).all(req.user.playerId);

  res.json({
    success: true,
    creature: pc.creature_name,
    primaryType: pc.type1, primaryYield,
    secondaryType: pc.type2 || null, secondaryYield: pc.type2 ? secondaryYield : 0,
    shards,
    message: pc.type2
      ? `${pc.creature_name} released — gained ${primaryYield} ${pc.type1} + ${secondaryYield} ${pc.type2} shards`
      : `${pc.creature_name} released — gained ${primaryYield} ${pc.type1} shards`,
  });
});

// Spend shards (placeholder for crafting / future use)
router.post('/spend', authMiddleware, (req, res) => {
  const { element, quantity, reason } = req.body;
  if (!element || !quantity || quantity <= 0) return res.status(400).json({ error: 'Invalid spend request' });

  const wallet = db.prepare('SELECT quantity FROM elemental_shards WHERE player_id = ? AND element = ?').get(req.user.playerId, element);
  if (!wallet || wallet.quantity < quantity) {
    return res.status(400).json({ error: `Not enough ${element} shards` });
  }

  db.prepare('UPDATE elemental_shards SET quantity = quantity - ? WHERE player_id = ? AND element = ?').run(quantity, req.user.playerId, element);
  db.prepare(`INSERT INTO shard_transactions (player_id, element, quantity, reason) VALUES (?, ?, ?, ?)`).run(req.user.playerId, element, -quantity, reason || 'spend');

  const updated = db.prepare('SELECT quantity FROM elemental_shards WHERE player_id = ? AND element = ?').get(req.user.playerId, element);
  res.json({ success: true, element, remaining: updated.quantity });
});

module.exports = router;
