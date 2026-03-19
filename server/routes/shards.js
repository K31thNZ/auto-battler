const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authMiddleware } = require('./auth');

// ─── Yield calculation ────────────────────────────────────────────────────────
const TIER_YIELD    = { 1: 8, 2: 20, 3: 55, 4: 150, 5: 400 };
const RARITY_BONUS  = { Common: 1.0, Rare: 1.3, Legendary: 1.8, Apex: 3.0 };

function calcYield(tier, rarity) {
  const base     = TIER_YIELD[tier]   || 8;
  const mult     = RARITY_BONUS[rarity] || 1.0;
  const variance = 0.85 + Math.random() * 0.30;
  return Math.max(1, Math.round(base * mult * variance));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addShards(playerId, element, quantity, reason, creatureName, creatureTier) {
  db.prepare(`
    INSERT INTO elemental_shards (player_id, element, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(player_id, element) DO UPDATE SET quantity = quantity + excluded.quantity
  `).run(playerId, element, quantity);
  db.prepare(`
    INSERT INTO shard_transactions (player_id, element, quantity, reason, creature_name, creature_tier)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(playerId, element, quantity, reason, creatureName || null, creatureTier || null);
}

function deductShards(playerId, element, quantity, reason) {
  db.prepare('UPDATE elemental_shards SET quantity = quantity - ? WHERE player_id = ? AND element = ?')
    .run(quantity, playerId, element);
  db.prepare('INSERT INTO shard_transactions (player_id, element, quantity, reason) VALUES (?, ?, ?, ?)')
    .run(playerId, element, -quantity, reason);
}

// ─── GET /shards — wallet + transaction history ───────────────────────────────
router.get('/', authMiddleware, (req, res) => {
  // Return only base element shards (not purity keys like "Fire_Refined")
  const shards = db.prepare(`
    SELECT element, quantity FROM elemental_shards
    WHERE player_id = ? AND element NOT LIKE '%\\_%' ESCAPE '\\'
    ORDER BY quantity DESC
  `).all(req.user.playerId);

  // Purity wallet: rows like "Fire_Refined", "Water_Pure" etc.
  const purityShards = db.prepare(`
    SELECT element, quantity FROM elemental_shards
    WHERE player_id = ? AND element LIKE '%\\_%' ESCAPE '\\'
    ORDER BY element
  `).all(req.user.playerId);

  const history = db.prepare(`
    SELECT * FROM shard_transactions
    WHERE player_id = ? ORDER BY created_at DESC LIMIT 30
  `).all(req.user.playerId);

  res.json({ shards, purityShards, history });
});

// ─── POST /shards/release — burn creature into shards ─────────────────────────
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

  const primaryYield   = calcYield(pc.tier, pc.rarity);
  const secondaryYield = pc.type2 ? Math.max(1, Math.round(primaryYield * 0.4)) : 0;

  db.transaction(() => {
    // Delete the creature and its sockets
    db.prepare('DELETE FROM creature_sockets WHERE player_creature_id = ?').run(pc.id);
    db.prepare('DELETE FROM player_creatures WHERE id = ?').run(pc.id);

    addShards(req.user.playerId, pc.type1, primaryYield, 'release', pc.creature_name, pc.tier);
    if (pc.type2 && secondaryYield > 0) {
      addShards(req.user.playerId, pc.type2, secondaryYield, 'release', pc.creature_name, pc.tier);
    }

    db.prepare('INSERT OR IGNORE INTO achievements (player_id, achievement_key) VALUES (?, ?)')
      .run(req.user.playerId, 'first_release');
  })();

  // Return updated wallet
  const shards = db.prepare(`
    SELECT element, quantity FROM elemental_shards
    WHERE player_id = ? AND element NOT LIKE '%\\_%' ESCAPE '\\'
    ORDER BY quantity DESC
  `).all(req.user.playerId);

  res.json({
    success: true,
    creature:       pc.creature_name,
    primaryType:    pc.type1,  primaryYield,
    secondaryType:  pc.type2 || null, secondaryYield: pc.type2 ? secondaryYield : 0,
    shards,
    message: pc.type2
      ? `${pc.creature_name} released — gained ${primaryYield} ${pc.type1} + ${secondaryYield} ${pc.type2} shards`
      : `${pc.creature_name} released — gained ${primaryYield} ${pc.type1} shards`,
  });
});

// ─── POST /shards/spend — deduct shards (for future crafting etc.) ────────────
router.post('/spend', authMiddleware, (req, res) => {
  const { element, quantity, reason } = req.body;
  if (!element || !quantity || quantity <= 0) return res.status(400).json({ error: 'Invalid spend request' });

  const wallet = db.prepare('SELECT quantity FROM elemental_shards WHERE player_id = ? AND element = ?')
    .get(req.user.playerId, element);
  if (!wallet || wallet.quantity < quantity) {
    return res.status(400).json({ error: `Not enough ${element} shards (have ${wallet?.quantity || 0}, need ${quantity})` });
  }

  deductShards(req.user.playerId, element, quantity, reason || 'spend');
  const updated = db.prepare('SELECT quantity FROM elemental_shards WHERE player_id = ? AND element = ?')
    .get(req.user.playerId, element);

  res.json({ success: true, element, remaining: updated.quantity });
});

module.exports = router;
