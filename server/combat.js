const { applyAllSockets } = require('./socketEngine');
// Type matchup table
const TYPE_MATCHUPS = {
  Fire:    { strong: ['Wind'],           weak: ['Water'] },
  Water:   { strong: ['Fire', 'Thunder'],weak: ['Wind'] },
  Wind:    { strong: ['Earth'],          weak: ['Thunder'] },
  Earth:   { strong: ['Wind'],           weak: ['Water'] },
  Thunder: { strong: ['Water'],          weak: ['Wind'] },
  Shadow:  { strong: ['Psychic'],        weak: ['Light'],   resist: ['Shadow'] },
  Light:   { strong: ['Shadow'],         weak: ['Light'] },
  Psychic: { strong: ['Shadow'],         weak: ['Psychic'], resist: ['Psychic'] },
  Ice:     { strong: [],                 weak: [] },
  Poison:  { strong: [],                 weak: [] },
  Metal:   { strong: [],                 weak: [] },
  Nature:  { strong: [],                 weak: [] },
};

function getTypeMultiplier(attackerTypes, defenderTypes) {
  let best = 1.0;
  for (const atkType of attackerTypes) {
    const table = TYPE_MATCHUPS[atkType] || { strong: [], weak: [] };
    for (const defType of defenderTypes) {
      if (table.strong && table.strong.includes(defType)) best = Math.max(best, 1.5);
      if (table.weak && table.weak.includes(defType)) best = Math.min(best, best < 1.5 ? 0.5 : best);
      if (table.resist && table.resist.includes(defType)) best = Math.max(best, 0.75);
    }
  }
  return best;
}

const SYNERGIES = [
  {
    name: 'Firestorm', types: ['Fire', 'Wind'], minCount: 2,
    effect: (team) => team.filter(c => c.type1 === 'Fire' || c.type2 === 'Fire' || c.type1 === 'Wind' || c.type2 === 'Wind').forEach(c => { c.atk = Math.floor(c.atk * 1.2); }),
    description: '+20% ATK, Burn on skill hits', statusOnSkill: 'burn'
  },
  {
    name: 'Tidal Wall', types: ['Water', 'Earth'], minCount: 2,
    effect: (team) => team.filter(c => c.type1 === 'Water' || c.type2 === 'Water' || c.type1 === 'Earth' || c.type2 === 'Earth').forEach(c => { c.def = Math.floor(c.def * 1.25); c.hpRegen = 3; }),
    description: '+25% DEF, +3 HP regen/turn', statusOnSkill: null
  },
  {
    name: 'Void Pact', types: ['Shadow', 'Psychic'], minCount: 2,
    effect: (team) => team.filter(c => c.type1 === 'Shadow' || c.type2 === 'Shadow' || c.type1 === 'Psychic' || c.type2 === 'Psychic').forEach(c => { c.atk = Math.floor(c.atk * 1.3); }),
    description: '+30% ATK, Silence on skill hits', statusOnSkill: 'silence'
  },
  {
    name: 'Storm Surge', types: ['Thunder', 'Wind'], minCount: 2,
    effect: (team) => team.filter(c => c.type1 === 'Thunder' || c.type2 === 'Thunder' || c.type1 === 'Wind' || c.type2 === 'Wind').forEach(c => { c.spd += 15; c.energyGainMult = 2; }),
    description: '+15 SPD, double energy gain', statusOnSkill: null
  },
  {
    name: 'Radiant Shield', types: ['Light', 'Earth'], minCount: 2,
    effect: (team) => team.filter(c => c.type1 === 'Light' || c.type2 === 'Light' || c.type1 === 'Earth' || c.type2 === 'Earth').forEach(c => { c.shield = (c.shield || 0) + 20; }),
    description: '+20 HP absorb shield at battle start', statusOnSkill: null
  },
];

function checkSynergies(team) {
  const active = [];
  for (const synergy of SYNERGIES) {
    const count = team.filter(c => synergy.types.some(t => c.type1 === t || c.type2 === t)).length;
    if (count >= synergy.minCount) {
      synergy.effect(team);
      active.push({ name: synergy.name, description: synergy.description, statusOnSkill: synergy.statusOnSkill });
    }
  }
  return active;
}

function initCombatant(pc, side) {
  const types = [pc.type1, pc.type2].filter(Boolean);
  // Apply socket bonuses if present
  const sockets = pc.sockets || [];
  const boosted = sockets.length > 0 ? applyAllSockets(pc, sockets) : null;
  const resistances = boosted ? boosted.resistances : [];
  return {
    id: pc.id || pc.player_creature_id,
    name: pc.name || pc.creature_name,
    type1: pc.type1,
    type2: pc.type2 || null,
    types,
    atk: (boosted && boosted.atk) || pc.atk || pc.base_atk,
    def: (boosted && boosted.def) || pc.def || pc.base_def,
    spd: (boosted && boosted.spd) || pc.spd || pc.base_spd,
    maxHp: (boosted && boosted.max_hp) || pc.max_hp || pc.base_hp,
    hp: pc.current_hp || pc.max_hp || pc.base_hp,
    resistances,
    energy: 0,
    shield: 0,
    hpRegen: 0,
    energyGainMult: 1,
    statusEffects: [],
    side,
    skillName: pc.skill_name,
    skillMultiplier: pc.skill_multiplier || 2.0,
    skillStatusEffect: pc.skill_status_effect || null,
    tier: pc.tier || 1,
  };
}

function applyDamage(attacker, defender, damage, log) {
  let dmg = Math.max(1, Math.round(damage));
  if (defender.shield > 0) {
    const absorbed = Math.min(defender.shield, dmg);
    defender.shield -= absorbed;
    dmg -= absorbed;
    if (absorbed > 0) log.push({ type: 'shield', msg: `${defender.name} absorbs ${absorbed} dmg with shield!` });
  }
  defender.hp = Math.max(0, defender.hp - dmg);
  return dmg;
}

function runBattle(playerTeamData, enemyTeamData) {
  const log = [];
  const playerTeam = playerTeamData.map(c => initCombatant(c, 'player'));
  const enemyTeam = enemyTeamData.map(c => initCombatant(c, 'enemy'));

  // Apply socketed shard bonuses
  for (let i = 0; i < playerTeam.length; i++) {
    const sockets = playerTeamData[i].sockets || [];
    if (sockets.length > 0) applySocketBonuses(playerTeam[i], sockets);
  }

  // Apply synergies
  const playerSynergies = checkSynergies(playerTeam);
  const enemySynergies = checkSynergies(enemyTeam);

  if (playerSynergies.length) log.push({ type: 'synergy', msg: `⚡ Player synergies: ${playerSynergies.map(s => s.name).join(', ')}` });
  if (enemySynergies.length) log.push({ type: 'synergy', msg: `⚡ Enemy synergies: ${enemySynergies.map(s => s.name).join(', ')}` });

  const allSynergies = { player: playerSynergies, enemy: enemySynergies };
  const allCombatants = [...playerTeam, ...enemyTeam];

  let turn = 0;
  const maxTurns = 100;

  while (turn < maxTurns) {
    turn++;
    const alive = allCombatants.filter(c => c.hp > 0);
    if (!alive.some(c => c.side === 'player') || !alive.some(c => c.side === 'enemy')) break;

    // Sort by SPD + random
    const order = alive.map(c => ({ c, roll: c.spd + Math.floor(Math.random() * 20) })).sort((a, b) => b.roll - a.roll);

    for (const { c: attacker } of order) {
      if (attacker.hp <= 0) continue;

      const enemySide = attacker.side === 'player' ? enemyTeam : playerTeam;
      const targets = enemySide.filter(c => c.hp > 0);
      if (!targets.length) break;

      // HP regen
      if (attacker.hpRegen > 0) {
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.hpRegen);
      }

      // Status effects
      let skipTurn = false;
      const remainingEffects = [];
      for (const effect of attacker.statusEffects) {
        if (effect.type === 'burn') {
          const burnDmg = Math.floor(attacker.maxHp * 0.05);
          attacker.hp = Math.max(0, attacker.hp - burnDmg);
          log.push({ type: 'status', msg: `🔥 ${attacker.name} takes ${burnDmg} burn damage!` });
          if (effect.turns > 1) remainingEffects.push({ ...effect, turns: effect.turns - 1 });
        } else if (effect.type === 'stun') {
          skipTurn = true;
          log.push({ type: 'status', msg: `💫 ${attacker.name} is stunned and can't move!` });
          // stun lasts 1 turn
        } else if (effect.type === 'paralyze') {
          if (Math.random() < 0.4) {
            skipTurn = true;
            log.push({ type: 'status', msg: `⚡ ${attacker.name} is paralyzed!` });
          }
          if (effect.turns > 1) remainingEffects.push({ ...effect, turns: effect.turns - 1 });
        } else if (effect.type === 'silence') {
          if (effect.turns > 1) remainingEffects.push({ ...effect, turns: effect.turns - 1 });
        }
      }
      attacker.statusEffects = remainingEffects;
      if (attacker.hp <= 0) continue;
      if (skipTurn) continue;

      // Energy gain
      const energyGain = Math.floor(attacker.spd / 8) * (attacker.energyGainMult || 1);
      attacker.energy = Math.min(100, attacker.energy + energyGain);

      // Pick target (lowest HP)
      const target = targets.reduce((a, b) => a.hp < b.hp ? a : b);
      const isSilenced = attacker.statusEffects.some(e => e.type === 'silence');

      let baseDmg, isSkill = false, skillName = 'Basic Attack';
      if (attacker.energy >= 100 && !isSilenced) {
        // Signature skill
        isSkill = true;
        attacker.energy = 0;
        baseDmg = attacker.atk * (attacker.skillMultiplier || 2.0);
        skillName = attacker.skillName || 'Signature Skill';

        // Apply skill status effect
        const synergySide = attacker.side === 'player' ? allSynergies.player : allSynergies.enemy;
        let statusToApply = attacker.skillStatusEffect;
        if (!statusToApply && synergySide.length) {
          const synergyWithStatus = synergySide.find(s => s.statusOnSkill);
          if (synergyWithStatus) statusToApply = synergyWithStatus.statusOnSkill;
        }
        if (statusToApply) {
          target.statusEffects.push({ type: statusToApply, turns: 2 });
          log.push({ type: 'status', msg: `${target.name} is afflicted with ${statusToApply}!` });
        }
      } else {
        baseDmg = Math.max(1, attacker.atk * 0.7 - target.def * 0.3);
      }

      // Type multiplier
      let mult = getTypeMultiplier(attacker.types, target.types);
      // Apply target's socket resistances
      if (target.resistances && target.resistances.length > 0) {
        for (const res of target.resistances) {
          if (attacker.types.includes(res.element)) {
            mult *= (1 - res.pct);
          }
        }
      }
      const finalDmg = baseDmg * mult;
      const dealt = applyDamage(attacker, target, finalDmg, log);

      let multText = '';
      if (mult > 1) multText = ` ✨ Super effective! ×${mult}`;
      if (mult < 1) multText = ` 🛡️ Not very effective ×${mult}`;

      log.push({
        type: isSkill ? 'skill' : 'attack',
        attacker: attacker.name,
        target: target.name,
        damage: dealt,
        isSkill,
        skillName,
        multiplier: mult,
        msg: `${attacker.side === 'player' ? '🔵' : '🔴'} ${attacker.name} uses ${skillName} on ${target.name} for ${dealt} dmg!${multText}`,
        hpSnapshot: {
          playerTeam: playerTeam.map(c => ({ id: c.id, name: c.name, hp: c.hp, maxHp: c.maxHp, energy: c.energy, shield: c.shield, statusEffects: c.statusEffects })),
          enemyTeam: enemyTeam.map(c => ({ id: c.id, name: c.name, hp: c.hp, maxHp: c.maxHp, energy: c.energy, shield: c.shield, statusEffects: c.statusEffects }))
        }
      });

      if (target.hp <= 0) {
        log.push({ type: 'faint', msg: `💀 ${target.name} has fainted!` });
      }

      // Check end condition
      if (!playerTeam.some(c => c.hp > 0) || !enemyTeam.some(c => c.hp > 0)) break;
    }
  }

  const playerWon = playerTeam.some(c => c.hp > 0) && !enemyTeam.some(c => c.hp > 0);
  const result = playerWon ? 'win' : 'loss';

  return {
    result,
    log,
    finalState: {
      playerTeam: playerTeam.map(c => ({ id: c.id, name: c.name, hp: c.hp, maxHp: c.maxHp, energy: c.energy })),
      enemyTeam: enemyTeam.map(c => ({ id: c.id, name: c.name, hp: c.hp, maxHp: c.maxHp, energy: c.energy }))
    },
    synergies: allSynergies,
    turns: turn
  };
}

function generateEnemyTeam(difficulty, allCreatures) {
  const tierMap = { easy: [1, 2], medium: [2, 3], hard: [3, 4], legendary: [4, 5] };
  const tiers = tierMap[difficulty] || [1, 2];
  const pool = allCreatures.filter(c => tiers.includes(c.tier));
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

module.exports = { runBattle, generateEnemyTeam, getTypeMultiplier };

// ─── Apply socketed shard bonuses to a combatant ──────────────────────────────
function applySocketBonuses(combatant, sockets) {
  const { calcBoostStats, calcResistance, getCompatibility } = require('./lib/socketRules');
  const boostSockets  = sockets.filter(s => s.slot_type === 'boost');
  const resistSockets = sockets.filter(s => s.slot_type === 'resist');

  const appliedBoosts = [];
  for (const sock of boostSockets) {
    const pc = { type1: combatant.type1, type2: combatant.type2, atk: combatant.atk, def: combatant.def, spd: combatant.spd, max_hp: combatant.maxHp };
    const { boosts, compatibility } = calcBoostStats(pc, sock.element, sock.purity);
    for (const [stat, val] of Object.entries(boosts)) {
      if (stat === 'hp') { combatant.maxHp += val; combatant.hp += val; }
      else combatant[stat] = (combatant[stat] || 0) + val;
    }
    appliedBoosts.push({ element: sock.element, purity: sock.purity, compatibility, boosts });
  }

  const resistances = {};
  for (const sock of resistSockets) {
    resistances[sock.element] = calcResistance(sock.purity);
  }
  combatant.resistances = resistances;
  return { appliedBoosts, resistances };
}

module.exports.applySocketBonuses = applySocketBonuses;
