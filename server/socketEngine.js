// ─── Shard Socket Engine ──────────────────────────────────────────────────────
// Centralised stat calculation for socketed shards.
// Imported by routes and the combat engine.

const PURITY_MULT = { Crude: 1.0, Refined: 1.4, Pure: 1.9, Radiant: 2.6, Primal: 3.5 };
const PURITY_COST  = { Crude: 1,   Refined: 3,   Pure: 9,   Radiant: 27,  Primal: 81 };
const PURITY_ORDER = ['Crude','Refined','Pure','Radiant','Primal'];

// Slots unlocked per creature tier
const SLOTS_BY_TIER = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };

// Stat bonuses for matching/adjacent element sockets
const ELEMENT_STAT_MAP = {
  Fire:    { primary: 'atk', secondary: 'spd',  pctA: 0.20, pctB: 0.08 },
  Thunder: { primary: 'atk', secondary: 'spd',  pctA: 0.20, pctB: 0.08 },
  Water:   { primary: 'def', secondary: 'hp',   pctA: 0.12, pctB: 0.15 },
  Ice:     { primary: 'def', secondary: 'hp',   pctA: 0.12, pctB: 0.15 },
  Wind:    { primary: 'spd', secondary: 'atk',  pctA: 0.20, pctB: 0.08 },
  Nature:  { primary: 'spd', secondary: 'atk',  pctA: 0.20, pctB: 0.08 },
  Earth:   { primary: 'def', secondary: 'hp',   pctA: 0.22, pctB: 0.10 },
  Metal:   { primary: 'def', secondary: 'hp',   pctA: 0.22, pctB: 0.10 },
  Shadow:  { primary: 'atk', secondary: 'atk',  pctA: 0.15, pctB: 0.05 },
  Psychic: { primary: 'atk', secondary: 'atk',  pctA: 0.15, pctB: 0.05 },
  Light:   { primary: 'atk', secondary: 'def',  pctA: 0.10, pctB: 0.10 },
  Poison:  { primary: 'atk', secondary: 'hp',   pctA: 0.10, pctB: 0.10 },
};

// Type matchup table (who is hostile to whom — same as combat engine)
const TYPE_WEAK_TO = {
  Fire:    ['Water'],
  Water:   ['Wind'],
  Wind:    ['Thunder'],
  Earth:   ['Water'],
  Thunder: ['Wind'],
  Shadow:  ['Light'],
  Light:   ['Light'],
  Psychic: ['Psychic'],
  Ice:     [],
  Poison:  [],
  Metal:   [],
  Nature:  [],
};

function isHostile(socketElement, creatureTypes) {
  // socketElement is hostile if creatureTypes are weak to it
  return creatureTypes.some(t => (TYPE_WEAK_TO[t] || []).includes(socketElement));
}

function isMatching(socketElement, creatureTypes) {
  return creatureTypes.includes(socketElement);
}

// Adjacent = same stat family but different element
const STAT_FAMILY = {
  Fire: 'atk', Thunder: 'atk',
  Water: 'def', Ice: 'def',
  Wind: 'spd', Nature: 'spd',
  Earth: 'def', Metal: 'def',
  Shadow: 'atk', Psychic: 'atk',
  Light: 'balanced', Poison: 'balanced',
};

function isAdjacent(socketElement, creatureTypes) {
  const family = STAT_FAMILY[socketElement];
  return creatureTypes.some(t => STAT_FAMILY[t] === family && t !== socketElement);
}

/**
 * Calculate the full stat bonus from a single socket.
 * Returns { atkBonus, defBonus, spdBonus, hpBonus, resistance, socketType, description }
 */
function calcSocketBonus(socket, creature) {
  const { element, purity, socket_type } = socket;
  const mult = PURITY_MULT[purity] || 1.0;
  const types = [creature.type1, creature.type2].filter(Boolean);

  if (socket_type === 'resist') {
    return {
      atkBonus: 0, defBonus: 0, spdBonus: 0, hpBonus: 0,
      resistance: element,
      resistPct: 0.50,
      description: `Resists ${element} damage by 50%`,
    };
  }

  const mapping = ELEMENT_STAT_MAP[element];
  if (!mapping) return { atkBonus: 0, defBonus: 0, spdBonus: 0, hpBonus: 0 };

  let pctA = mapping.pctA;
  let pctB = mapping.pctB;

  if (isMatching(element, types)) {
    // Full bonus
  } else if (isAdjacent(element, types)) {
    pctA *= 0.55;
    pctB *= 0.55;
  } else {
    // Non-matching, non-hostile amplifier — minor balanced boost
    pctA = 0.05;
    pctB = 0.03;
  }

  pctA *= mult;
  pctB *= mult;

  const bonuses = { atkBonus: 0, defBonus: 0, spdBonus: 0, hpBonus: 0 };
  bonuses[`${mapping.primary}Bonus`] += pctA;
  bonuses[`${mapping.secondary}Bonus`] += pctB;

  const descPct = (v) => `+${Math.round(v * 100)}%`;
  const label = isMatching(element, types) ? 'Match' : isAdjacent(element, types) ? 'Affinity' : 'Off-type';
  return {
    ...bonuses,
    resistance: null,
    description: `${label}: ${descPct(pctA)} ${mapping.primary.toUpperCase()}, ${descPct(pctB)} ${mapping.secondary.toUpperCase()}`,
  };
}

/**
 * Apply all socket bonuses to a creature's base stats.
 * Returns { atk, def, spd, max_hp, resistances[] }
 */
function applyAllSockets(creature, sockets) {
  let atk = creature.atk || creature.base_atk;
  let def = creature.def || creature.base_def;
  let spd = creature.spd || creature.base_spd;
  let hp  = creature.max_hp || creature.base_hp;
  const resistances = [];

  for (const socket of sockets) {
    const bonus = calcSocketBonus(socket, creature);
    atk  = Math.round(atk  * (1 + (bonus.atkBonus || 0)));
    def  = Math.round(def  * (1 + (bonus.defBonus || 0)));
    spd  = Math.round(spd  * (1 + (bonus.spdBonus || 0)));
    hp   = Math.round(hp   * (1 + (bonus.hpBonus  || 0)));
    if (bonus.resistance) resistances.push({ element: bonus.resistance, pct: bonus.resistPct });
  }

  return { atk, def, spd, max_hp: hp, resistances };
}

module.exports = {
  PURITY_MULT, PURITY_COST, PURITY_ORDER, SLOTS_BY_TIER,
  ELEMENT_STAT_MAP, TYPE_WEAK_TO,
  isHostile, isMatching, isAdjacent,
  calcSocketBonus, applyAllSockets,
};
