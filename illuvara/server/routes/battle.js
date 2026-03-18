const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('./auth');
const { runBattle, generateEnemyTeam } = require('../combat');
const { CREATURES } = require('../creatures');

// Start a battle
router.post('/start', authMiddleware, (req, res) => {
  const { difficulty = 'medium' } = req.body;

  // Get player's team
  const teamQuery = `
    SELECT pc.*, c.name as creature_name, c.type1, c.type2, c.tier, c.rarity,
           c.base_atk, c.base_def, c.base_spd, c.base_hp,
           c.skill_name, c.skill_multiplier, c.skill_status_effect
    FROM player_creatures pc
    JOIN creatures c ON pc.creature_id = c.id
    WHERE pc.player_id = ? AND pc.in_team = 1
    ORDER BY pc.team_slot
  `;
  const playerTeam = db.prepare(teamQuery).all(req.user.playerId);

  if (!playerTeam.length) return res.status(400).json({ error: 'No team selected. Go to your collection and select up to 3 creatures.' });

  // Generate enemy team
  const allCreatures = db.prepare('SELECT * FROM creatures').all();
  const enemyTeam = generateEnemyTeam(difficulty, allCreatures);

  // Run battle simulation
  const battleResult = runBattle(
    playerTeam.map(pc => ({
      id: pc.id,
      name: pc.creature_name,
      type1: pc.type1,
      type2: pc.type2,
      atk: pc.atk,
      def: pc.def,
      spd: pc.spd,
      max_hp: pc.max_hp,
      current_hp: pc.current_hp,
      skill_name: pc.skill_name,
      skill_multiplier: pc.skill_multiplier,
      skill_status_effect: pc.skill_status_effect,
      tier: pc.tier,
    })),
    enemyTeam.map(c => ({
      id: c.id,
      name: c.name,
      type1: c.type1,
      type2: c.type2,
      atk: c.base_atk,
      def: c.base_def,
      spd: c.base_spd,
      max_hp: c.base_hp,
      current_hp: c.base_hp,
      skill_name: c.skill_name,
      skill_multiplier: c.skill_multiplier,
      skill_status_effect: c.skill_status_effect,
      tier: c.tier,
    }))
  );

  const { result, log, finalState, synergies } = battleResult;

  // Calculate XP and rewards
  const difficultyXP = { easy: 20, medium: 40, hard: 70, legendary: 120 };
  const baseXP = difficultyXP[difficulty] || 40;
  const xpGained = result === 'win' ? baseXP : Math.floor(baseXP * 0.3);
  const shardsGained = result === 'win' ? Math.floor(Math.random() * 30) + 10 : 0;

  // Update player creatures XP and HP
  const updateXP = db.prepare('UPDATE player_creatures SET xp = xp + ?, current_hp = ? WHERE id = ? AND player_id = ?');
  const levelUp = db.prepare('UPDATE player_creatures SET level = level + 1, xp = 0 WHERE id = ? AND player_id = ?');

  for (const pc of playerTeam) {
    const finalCreature = finalState.playerTeam.find(c => c.id === pc.id);
    const newHp = finalCreature ? Math.max(1, finalCreature.hp) : 1;
    updateXP.run(xpGained, newHp, pc.id, req.user.playerId);

    // Check for level up
    const updated = db.prepare('SELECT * FROM player_creatures WHERE id = ?').get(pc.id);
    const xpNeeded = updated.level * 50;
    if (updated.xp >= xpNeeded) {
      levelUp.run(pc.id, req.user.playerId);
    }
  }

  // Update player stats
  if (result === 'win') {
    db.prepare('UPDATE players SET battles_won = battles_won + 1, shards = shards + ? WHERE id = ?').run(shardsGained, req.user.playerId);
  } else {
    db.prepare('UPDATE players SET battles_lost = battles_lost + 1 WHERE id = ?').run(req.user.playerId);
  }

  // Loot roll: 20% chance to find a creature on win
  let lootCreature = null;
  if (result === 'win' && Math.random() < 0.2) {
    const tier1Creatures = allCreatures.filter(c => c.tier === 1);
    lootCreature = tier1Creatures[Math.floor(Math.random() * tier1Creatures.length)];
    const insertPC = db.prepare(`
      INSERT INTO player_creatures (player_id, creature_id, level, xp, atk, def, spd, max_hp, current_hp)
      VALUES (?, ?, 1, 0, ?, ?, ?, ?, ?)
    `);
    insertPC.run(req.user.playerId, lootCreature.id, lootCreature.base_atk, lootCreature.base_def, lootCreature.base_spd, lootCreature.base_hp, lootCreature.base_hp);
  }

  // Save battle record
  const battleRecord = db.prepare(`
    INSERT INTO battles (player_id, difficulty, result, player_team, enemy_team, xp_gained, shards_gained, battle_log)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.playerId,
    difficulty,
    result,
    JSON.stringify(playerTeam.map(pc => ({ id: pc.creature_id, name: pc.creature_name }))),
    JSON.stringify(enemyTeam.map(c => ({ id: c.id, name: c.name }))),
    xpGained,
    shardsGained,
    JSON.stringify(log.slice(0, 50)) // Limit log size
  );

  // Achievement
  if (result === 'win') {
    const wins = db.prepare('SELECT battles_won FROM players WHERE id = ?').get(req.user.playerId);
    if (wins.battles_won === 1) {
      db.prepare('INSERT OR IGNORE INTO achievements (player_id, achievement_key) VALUES (?, ?)').run(req.user.playerId, 'first_win');
    }
  }

  res.json({
    result,
    log,
    finalState,
    synergies,
    playerTeam: playerTeam.map(pc => ({ id: pc.id, name: pc.creature_name, type1: pc.type1, type2: pc.type2 })),
    enemyTeam: enemyTeam.map(c => ({ id: c.id, name: c.name, type1: c.type1, type2: c.type2 })),
    xpGained,
    shardsGained,
    lootCreature,
    battleId: battleRecord.lastInsertRowid
  });
});

// Get battle history
router.get('/history', authMiddleware, (req, res) => {
  const battles = db.prepare(`
    SELECT * FROM battles WHERE player_id = ?
    ORDER BY created_at DESC LIMIT 10
  `).all(req.user.playerId);

  res.json(battles.map(b => ({
    ...b,
    player_team: JSON.parse(b.player_team),
    enemy_team: JSON.parse(b.enemy_team),
  })));
});

module.exports = router;
