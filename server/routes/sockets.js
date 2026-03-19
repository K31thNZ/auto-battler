const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authMiddleware } = require('./auth');
const {
  SLOTS_BY_TIER, PURITY_COST, PURITY_ORDER, PURITY_MULT,
  isHostile, isMatching, isAdjacent, calcSocketBonus, applyAllSockets,
} = require('../socketEngine');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCreatureWithSockets(playerId, pcId) {
  const pc = db.prepare(`
    SELECT pc.*, c.name as creature_name, c.type1, c.type2, c.tier, c.rarity,
           c.base_atk, c.base_def, c.base_spd, c.base_hp
    FROM player_creatures pc JOIN creatures c ON pc.creature_id = c.id
    WHERE pc.id = ? AND pc.player_id = ?
  `).get(pcId, playerId);
  if (!pc) return null;
  const sockets = db.prepare(
    'SELECT * FROM creature_sockets WHERE player_creature_id = ? ORDER BY slot'
  ).all(pcId);
  const boostedStats = applyAllSockets(pc, sockets);
  return { ...pc, sockets, boostedStats };
}

function shardWallet(playerId) {
  const rows = db.prepare(
    'SELECT element, quantity FROM elemental_shards WHERE player_id = ? ORDER BY element'
  ).all(playerId);
  return Object.fromEntries(rows.map(r => [r.element, r.quantity]));
}

function deductShard(playerId, element, amount, reason) {
  db.prepare('UPDATE elemental_shards SET quantity = quantity - ? WHERE player_id = ? AND element = ?')
    .run(amount, playerId, element);
  db.prepare('INSERT INTO shard_transactions (player_id, element, quantity, reason) VALUES (?, ?, ?, ?)')
    .run(playerId, element, -amount, reason);
}

function addShard(playerId, element, amount, reason) {
  db.prepare(`
    INSERT INTO elemental_shards (player_id, element, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(player_id, element) DO UPDATE SET quantity = quantity + excluded.quantity
  `).run(playerId, element, amount);
  db.prepare('INSERT INTO shard_transactions (player_id, element, quantity, reason) VALUES (?, ?, ?, ?)')
    .run(playerId, element, amount, reason);
}

// ─── GET /sockets/:pcId — creature socket state ───────────────────────────────
router.get('/:pcId', authMiddleware, (req, res) => {
  const result = getCreatureWithSockets(req.user.playerId, req.params.pcId);
  if (!result) return res.status(404).json({ error: 'Creature not found' });
  const wallet = shardWallet(req.user.playerId);
  res.json({ ...result, wallet });
});

// ─── GET /sockets — all socketed creatures ────────────────────────────────────
router.get('/', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT DISTINCT cs.player_creature_id
    FROM creature_sockets cs
    JOIN player_creatures pc ON cs.player_creature_id = pc.id
    WHERE pc.player_id = ?
  `).all(req.user.playerId);
  const creatures = rows.map(r => getCreatureWithSockets(req.user.playerId, r.player_creature_id)).filter(Boolean);
  res.json(creatures);
});

// ─── POST /sockets/socket — socket a shard ───────────────────────────────────
router.post('/socket', authMiddleware, (req, res) => {
  const { playerCreatureId, slot, element, socketType = 'amplify' } = req.body;

  const pc = db.prepare(`
    SELECT pc.*, c.type1, c.type2, c.tier
    FROM player_creatures pc JOIN creatures c ON pc.creature_id = c.id
    WHERE pc.id = ? AND pc.player_id = ?
  `).get(playerCreatureId, req.user.playerId);
  if (!pc) return res.status(404).json({ error: 'Creature not found' });

  const maxSlots = SLOTS_BY_TIER[pc.tier] || 0;
  if (maxSlots === 0) return res.status(400).json({ error: 'Tier 2+ required for sockets' });
  if (slot < 1 || slot > maxSlots) return res.status(400).json({ error: `Slot must be 1–${maxSlots}` });

  const types = [pc.type1, pc.type2].filter(Boolean);

  if (socketType === 'resist') {
    if (pc.tier < 3) return res.status(400).json({ error: 'Resistance sockets require Tier 3+' });
    if (!isHostile(element, types)) return res.status(400).json({ error: `${element} is not hostile to this creature` });
    if (slot + 1 > maxSlots) return res.status(400).json({ error: 'Resistance sockets need 2 consecutive free slots' });
    const occupied = db.prepare('SELECT slot FROM creature_sockets WHERE player_creature_id = ?')
      .all(playerCreatureId).map(r => r.slot);
    if (occupied.includes(slot) || occupied.includes(slot + 1)) {
      return res.status(400).json({ error: 'Both slots must be empty for a resistance socket' });
    }
  } else {
    const existing = db.prepare('SELECT id FROM creature_sockets WHERE player_creature_id = ? AND slot = ?')
      .get(playerCreatureId, slot);
    if (existing) return res.status(400).json({ error: 'Slot already occupied — remove existing shard first' });
  }

  const wallet = db.prepare('SELECT quantity FROM elemental_shards WHERE player_id = ? AND element = ?')
    .get(req.user.playerId, element);
  if (!wallet || wallet.quantity < 1) return res.status(400).json({ error: `No ${element} shards available` });

  db.transaction(() => {
    deductShard(req.user.playerId, element, 1, `socket-${socketType}`);
    db.prepare('INSERT INTO creature_sockets (player_creature_id, slot, element, purity, socket_type) VALUES (?, ?, ?, ?, ?)')
      .run(playerCreatureId, slot, element, 'Crude', socketType);
    if (socketType === 'resist') {
      db.prepare('INSERT INTO creature_sockets (player_creature_id, slot, element, purity, socket_type) VALUES (?, ?, ?, ?, ?)')
        .run(playerCreatureId, slot + 1, element, 'Crude', 'resist-overflow');
    }
  })();

  const updated = getCreatureWithSockets(req.user.playerId, playerCreatureId);
  const bonus   = calcSocketBonus({ element, purity: 'Crude', socket_type: socketType }, pc);
  res.json({ success: true, bonus, creature: updated });
});

// ─── POST /sockets/unsocket — remove a shard ─────────────────────────────────
router.post('/unsocket', authMiddleware, (req, res) => {
  const { playerCreatureId, slot } = req.body;

  const socket = db.prepare(`
    SELECT cs.* FROM creature_sockets cs
    JOIN player_creatures pc ON cs.player_creature_id = pc.id
    WHERE cs.player_creature_id = ? AND cs.slot = ? AND pc.player_id = ?
  `).get(playerCreatureId, slot, req.user.playerId);

  if (!socket) return res.status(404).json({ error: 'No shard in that slot' });
  if (socket.socket_type === 'resist-overflow') return res.status(400).json({ error: 'Remove the primary resist slot instead' });

  db.transaction(() => {
    db.prepare('DELETE FROM creature_sockets WHERE player_creature_id = ? AND slot = ?').run(playerCreatureId, slot);
    if (socket.socket_type === 'resist') {
      db.prepare('DELETE FROM creature_sockets WHERE player_creature_id = ? AND slot = ?').run(playerCreatureId, slot + 1);
    }
    // Refund 1 crude shard regardless of purity (removing always loses upgrades)
    addShard(req.user.playerId, socket.element, 1, 'unsocket-refund');
  })();

  const updated = getCreatureWithSockets(req.user.playerId, playerCreatureId);
  res.json({ success: true, refunded: socket.element, creature: updated });
});

// ─── POST /sockets/merge-purity — combine crude shards into higher purity ─────
router.post('/merge-purity', authMiddleware, (req, res) => {
  const { element, targetPurity } = req.body;
  const idx = PURITY_ORDER.indexOf(targetPurity);
  if (idx <= 0) return res.status(400).json({ error: 'Target purity must be Refined or higher' });

  const cost   = PURITY_COST[targetPurity];
  const pKey   = `${element}_${targetPurity}`;
  const wallet = db.prepare('SELECT quantity FROM elemental_shards WHERE player_id = ? AND element = ?')
    .get(req.user.playerId, element);

  if (!wallet || wallet.quantity < cost) {
    return res.status(400).json({
      error: `Need ${cost} crude ${element} shards (you have ${wallet?.quantity || 0})`,
    });
  }

  db.transaction(() => {
    deductShard(req.user.playerId, element, cost, `merge-into-${targetPurity}`);
    addShard(req.user.playerId, pKey, 1, `merge-created-${targetPurity}`);
  })();

  res.json({
    success: true, element, targetPurity, cost,
    remainingCrude: (wallet.quantity - cost),
    multiplier: PURITY_MULT[targetPurity],
    message: `${cost} ${element} shards → 1 ${targetPurity} ${element} shard (×${PURITY_MULT[targetPurity]})`,
  });
});

// ─── POST /sockets/upgrade-socket — upgrade a socketed shard's purity ─────────
router.post('/upgrade-socket', authMiddleware, (req, res) => {
  const { playerCreatureId, slot } = req.body;

  const socket = db.prepare(`
    SELECT cs.* FROM creature_sockets cs
    JOIN player_creatures pc ON cs.player_creature_id = pc.id
    WHERE cs.player_creature_id = ? AND cs.slot = ? AND pc.player_id = ?
  `).get(playerCreatureId, slot, req.user.playerId);

  if (!socket) return res.status(404).json({ error: 'No socket at that slot' });
  if (socket.socket_type === 'resist-overflow') return res.status(400).json({ error: 'Upgrade the primary slot' });

  const currentIdx  = PURITY_ORDER.indexOf(socket.purity);
  if (currentIdx >= PURITY_ORDER.length - 1) return res.status(400).json({ error: 'Already at maximum purity (Primal)' });

  const nextPurity = PURITY_ORDER[currentIdx + 1];
  const pKey       = `${socket.element}_${nextPurity}`;
  const pShard     = db.prepare('SELECT quantity FROM elemental_shards WHERE player_id = ? AND element = ?')
    .get(req.user.playerId, pKey);

  if (!pShard || pShard.quantity < 1) {
    return res.status(400).json({
      error: `Need 1× ${nextPurity} ${socket.element} shard. Merge ${PURITY_COST[nextPurity]} crude shards first.`,
    });
  }

  db.transaction(() => {
    db.prepare('UPDATE creature_sockets SET purity = ? WHERE id = ?').run(nextPurity, socket.id);
    if (socket.socket_type === 'resist') {
      db.prepare('UPDATE creature_sockets SET purity = ? WHERE player_creature_id = ? AND slot = ?')
        .run(nextPurity, playerCreatureId, socket.slot + 1);
    }
    deductShard(req.user.playerId, pKey, 1, `socket-upgrade-to-${nextPurity}`);
  })();

  const pc = db.prepare('SELECT pc.*, c.type1, c.type2 FROM player_creatures pc JOIN creatures c ON pc.creature_id = c.id WHERE pc.id = ?')
    .get(playerCreatureId);
  const bonus = calcSocketBonus({ ...socket, purity: nextPurity }, pc);

  res.json({
    success: true, newPurity: nextPurity,
    multiplier: PURITY_MULT[nextPurity], bonus,
    message: `Upgraded to ${nextPurity} — ×${PURITY_MULT[nextPurity]} power`,
  });
});

module.exports = router;
