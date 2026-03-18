const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'illuvara.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT,
    shards INTEGER DEFAULT 500,
    battles_won INTEGER DEFAULT 0,
    battles_lost INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS creatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type1 TEXT NOT NULL,
    type2 TEXT,
    tier INTEGER NOT NULL,
    rarity TEXT NOT NULL,
    base_atk INTEGER NOT NULL,
    base_def INTEGER NOT NULL,
    base_spd INTEGER NOT NULL,
    base_hp INTEGER NOT NULL,
    skill_name TEXT,
    skill_description TEXT,
    skill_multiplier REAL DEFAULT 2.0,
    skill_status_effect TEXT,
    zone TEXT,
    evolves_from INTEGER,
    evolves_to_a INTEGER,
    evolves_to_b INTEGER,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS player_creatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    creature_id INTEGER NOT NULL,
    nickname TEXT,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    current_hp INTEGER,
    atk INTEGER,
    def INTEGER,
    spd INTEGER,
    max_hp INTEGER,
    in_team INTEGER DEFAULT 0,
    team_slot INTEGER,
    obtained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (creature_id) REFERENCES creatures(id)
  );

  CREATE TABLE IF NOT EXISTS battles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    result TEXT NOT NULL,
    player_team TEXT NOT NULL,
    enemy_team TEXT NOT NULL,
    xp_gained INTEGER DEFAULT 0,
    shards_gained INTEGER DEFAULT 0,
    battle_log TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id)
  );

  CREATE TABLE IF NOT EXISTS marketplace_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    player_creature_id INTEGER NOT NULL,
    price INTEGER NOT NULL,
    listed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES players(id),
    FOREIGN KEY (player_creature_id) REFERENCES player_creatures(id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    achievement_key TEXT NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, achievement_key),
    FOREIGN KEY (player_id) REFERENCES players(id)
  );
`);

module.exports = db;
