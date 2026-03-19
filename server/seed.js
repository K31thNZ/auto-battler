const db = require('./db');
const { CREATURES } = require('./creatures');

console.log('🌱 Seeding Illuvara database...');

// Clear existing data
db.exec(`
  DELETE FROM marketplace_listings;
  DELETE FROM achievements;
  DELETE FROM battles;
  DELETE FROM player_creatures;
  DELETE FROM creatures;
  DELETE FROM players;
`);

// Insert all creatures
const insertCreature = db.prepare(`
  INSERT INTO creatures (id, name, type1, type2, tier, rarity, base_atk, base_def, base_spd, base_hp,
    skill_name, skill_description, skill_multiplier, skill_status_effect, zone,
    evolves_from, evolves_to_a, evolves_to_b, description)
  VALUES (@id, @name, @type1, @type2, @tier, @rarity, @base_atk, @base_def, @base_spd, @base_hp,
    @skill_name, @skill_description, @skill_multiplier, @skill_status_effect, @zone,
    @evolves_from, @evolves_to_a, @evolves_to_b, @description)
`);

const insertMany = db.transaction((creatures) => {
  for (const c of creatures) insertCreature.run(c);
});
insertMany(CREATURES);
console.log(`✅ Inserted ${CREATURES.length} creatures`);

// Create a demo NPC player for marketplace seeding
const demoWallet = '0xDEMO000000000000000000000000000000000001';
db.prepare(`INSERT INTO players (wallet_address, username, shards) VALUES (?, 'Wildlands Merchant', 9999)`).run(demoWallet);
const demoPlayer = db.prepare('SELECT id FROM players WHERE wallet_address = ?').get(demoWallet);

// Give demo player some creatures to list
const demoCreatureIds = [5, 6, 7, 8, 17, 18, 19, 20]; // Voltkit, Frostling, Shadowpup, Glimlet, Zephyrax, Poisonmaw, Psyclaw, Ironfang
const insertPC = db.prepare(`
  INSERT INTO player_creatures (player_id, creature_id, level, xp, atk, def, spd, max_hp, current_hp)
  VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?)
`);
const insertListing = db.prepare(`INSERT INTO marketplace_listings (seller_id, player_creature_id, price) VALUES (?, ?, ?)`);

const prices = { 1: 80, 2: 90, 3: 300, 4: 250, 5: 500, 6: 100 };

for (const cid of demoCreatureIds) {
  const creature = CREATURES.find(c => c.id === cid);
  const result = insertPC.run(demoPlayer.id, cid, 1, creature.base_atk, creature.base_def, creature.base_spd, creature.base_hp, creature.base_hp);
  const pcId = result.lastInsertRowid;
  const price = (prices[creature.tier] || 150) + Math.floor(Math.random() * 50);
  insertListing.run(demoPlayer.id, pcId, price);
}

console.log('✅ Seeded marketplace with demo listings');
console.log('🎮 Database ready! Run: npm run dev');
