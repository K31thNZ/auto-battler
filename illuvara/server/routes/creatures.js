const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('./auth');
const { CREATURES } = require('../creatures');

// Get all master creatures
router.get('/all', (req, res) => {
  const creatures = db.prepare('SELECT * FROM creatures').all();
  res.json(creatures);
});

// Get player's collection
router.get('/collection', authMiddleware, (req, res) => {
  const collection = db.prepare(`
    SELECT pc.*, c.name as creature_name, c.type1, c.type2, c.tier, c.rarity,
           c.skill_name, c.skill_description, c.skill_multiplier, c.skill_status_effect,
           c.description, c.evolves_to_a, c.evolves_to_b, c.evolves_from
    FROM player_creatures pc
    JOIN creatures c ON pc.creature_id = c.id
    WHERE pc.player_id = ?
    ORDER BY pc.in_team DESC, c.tier DESC, pc.level DESC
  `).all(req.user.playerId);
  res.json(collection);
});

// Set team
router.post('/team', authMiddleware, (req, res) => {
  const { slots } = req.body; // [{playerCreatureId, slot}] max 3
  if (!slots || slots.length > 3) return res.status(400).json({ error: 'Max 3 team members' });

  // Clear all team slots for this player
  db.prepare('UPDATE player_creatures SET in_team = 0, team_slot = NULL WHERE player_id = ?').run(req.user.playerId);

  // Set new slots
  const update = db.prepare('UPDATE player_creatures SET in_team = 1, team_slot = ? WHERE id = ? AND player_id = ?');
  for (const { playerCreatureId, slot } of slots) {
    update.run(slot, playerCreatureId, req.user.playerId);
  }
  res.json({ success: true });
});

// Capture creature in zone
router.post('/capture', authMiddleware, (req, res) => {
  const { zone } = req.body;

  const zoneCreatures = {
    'Ashveil Crater': [1, 9, 13, 14],
    'Tidehaven Depths': [2, 10, 15, 16],
    'Stormspire Peak': [3, 11, 17, 5],
    'Umbral Rift': [7, 19, 24, 6],
    'Sunstone Plateau': [4, 12, 8, 20, 18],
  };

  const available = zoneCreatures[zone];
  if (!available) return res.status(400).json({ error: 'Invalid zone' });

  // Weight towards lower tiers
  const weights = available.map(id => {
    const c = CREATURES.find(cr => cr.id === id);
    return c ? (6 - c.tier) * 3 : 1;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;
  let chosenId = available[0];
  for (let i = 0; i < available.length; i++) {
    rand -= weights[i];
    if (rand <= 0) { chosenId = available[i]; break; }
  }

  const creature = CREATURES.find(c => c.id === chosenId);
  const rarityChance = { Common: 0.8, Rare: 0.4, Legendary: 0.1, Apex: 0.05 };
  const captureChance = rarityChance[creature.rarity] || 0.5;
  const caught = Math.random() < captureChance;

  if (!caught) {
    return res.json({ success: false, creature, message: `${creature.name} escaped!` });
  }

  // Add to collection
  const result = db.prepare(`
    INSERT INTO player_creatures (player_id, creature_id, level, xp, atk, def, spd, max_hp, current_hp)
    VALUES (?, ?, 1, 0, ?, ?, ?, ?, ?)
  `).run(req.user.playerId, creature.id, creature.base_atk, creature.base_def, creature.base_spd, creature.base_hp, creature.base_hp);

  // Check achievement
  const count = db.prepare('SELECT COUNT(*) as cnt FROM player_creatures WHERE player_id = ?').get(req.user.playerId);
  if (count.cnt === 1) {
    db.prepare('INSERT OR IGNORE INTO achievements (player_id, achievement_key) VALUES (?, ?)').run(req.user.playerId, 'first_capture');
  }
  if (count.cnt >= 10) {
    db.prepare('INSERT OR IGNORE INTO achievements (player_id, achievement_key) VALUES (?, ?)').run(req.user.playerId, 'collector_10');
  }

  const pc = db.prepare(`
    SELECT pc.*, c.name as creature_name, c.type1, c.type2, c.tier, c.rarity,
           c.skill_name, c.description, c.evolves_to_a, c.evolves_to_b
    FROM player_creatures pc
    JOIN creatures c ON pc.creature_id = c.id
    WHERE pc.id = ?
  `).get(result.lastInsertRowid);

  res.json({ success: true, creature: pc, message: `${creature.name} was captured!` });
});

// Evolve creature
router.post('/evolve', authMiddleware, (req, res) => {
  const { playerCreatureId, choiceA } = req.body; // choiceA: true = evolves_to_a, false = evolves_to_b

  const pc = db.prepare(`
    SELECT pc.*, c.tier, c.evolves_to_a, c.evolves_to_b
    FROM player_creatures pc JOIN creatures c ON pc.creature_id = c.id
    WHERE pc.id = ? AND pc.player_id = ?
  `).get(playerCreatureId, req.user.playerId);

  if (!pc) return res.status(404).json({ error: 'Creature not found' });

  const targetId = choiceA !== false ? pc.evolves_to_a : pc.evolves_to_b;
  if (!targetId) return res.status(400).json({ error: 'No evolution available' });

  // Check level requirement
  const tierLevelReq = { 2: 10, 3: 25 };
  const targetCreature = CREATURES.find(c => c.id === targetId);
  if (!targetCreature) return res.status(400).json({ error: 'Evolution target not found' });
  const reqLevel = tierLevelReq[targetCreature.tier] || 10;
  if (pc.level < reqLevel) return res.status(400).json({ error: `Must be level ${reqLevel} to evolve` });

  // Evolve: update creature_id and stats
  db.prepare(`
    UPDATE player_creatures SET
      creature_id = ?,
      atk = ?,
      def = ?,
      spd = ?,
      max_hp = ?,
      current_hp = ?,
      xp = 0
    WHERE id = ?
  `).run(targetCreature.id, targetCreature.base_atk + pc.level * 2, targetCreature.base_def + pc.level,
         targetCreature.base_spd + pc.level, targetCreature.base_hp + pc.level * 3,
         targetCreature.base_hp + pc.level * 3, playerCreatureId);

  res.json({ success: true, newCreatureId: targetCreature.id, name: targetCreature.name });
});

// Merge 3 identical tier-3 into legendary
router.post('/merge', authMiddleware, (req, res) => {
  const { playerCreatureIds } = req.body; // array of 3 pc ids
  if (!playerCreatureIds || playerCreatureIds.length !== 3) return res.status(400).json({ error: 'Need exactly 3 creatures' });

  const pcs = playerCreatureIds.map(id =>
    db.prepare('SELECT pc.*, c.tier, c.evolves_to_a FROM player_creatures pc JOIN creatures c ON pc.creature_id = c.id WHERE pc.id = ? AND pc.player_id = ?').get(id, req.user.playerId)
  );

  if (pcs.some(p => !p)) return res.status(404).json({ error: 'Creature not found' });
  if (!pcs.every(p => p.creature_id === pcs[0].creature_id)) return res.status(400).json({ error: 'All 3 must be the same creature' });
  if (pcs[0].tier !== 3) return res.status(400).json({ error: 'Can only merge tier-3 creatures' });

  const legendaryId = pcs[0].evolves_to_a;
  if (!legendaryId) return res.status(400).json({ error: 'No legendary fusion available' });

  const legendary = CREATURES.find(c => c.id === legendaryId);

  // Delete 2 of the 3 and transform the first
  db.prepare('DELETE FROM player_creatures WHERE id IN (?, ?)').run(playerCreatureIds[1], playerCreatureIds[2]);
  db.prepare(`
    UPDATE player_creatures SET creature_id = ?, level = 1, xp = 0,
    atk = ?, def = ?, spd = ?, max_hp = ?, current_hp = ?
    WHERE id = ?
  `).run(legendary.id, legendary.base_atk, legendary.base_def, legendary.base_spd, legendary.base_hp, legendary.base_hp, playerCreatureIds[0]);

  db.prepare('INSERT OR IGNORE INTO achievements (player_id, achievement_key) VALUES (?, ?)').run(req.user.playerId, 'first_merge');

  const result = db.prepare(`
    SELECT pc.*, c.name as creature_name, c.type1, c.type2, c.tier, c.rarity, c.description
    FROM player_creatures pc JOIN creatures c ON pc.creature_id = c.id
    WHERE pc.id = ?
  `).get(playerCreatureIds[0]);

  res.json({ success: true, legendary: result });
});

module.exports = router;
