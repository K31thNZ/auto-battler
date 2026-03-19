# Primal Shards 🌟

> A blockchain-inspired creature collector, auto-battler, and RPG built with React + Node.js + SQLite.

## Features

- 🎯 **Capture** — Explore 5 elemental zones and catch 25 unique creatures
- ⚔️ **Battle** — Auto-battle system with type matchups, synergies, and status effects
- 🔬 **Fuse** — Merge 3 identical tier-3 creatures into legendary forms
- 💎 **Trade** — Buy and sell creatures in the open marketplace
- 👤 **Profile** — Track achievements, battle history, and stats

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18 + Vite, Tailwind CSS, Framer Motion, Zustand |
| Backend   | Node.js + Express |
| Database  | SQLite via better-sqlite3 |
| Auth      | JWT (simulated wallet) |

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Seed the database

```bash
npm run seed
```

### 3. Run the game

```bash
npm run dev
```

- **Frontend** → http://localhost:5173
- **Backend API** → http://localhost:3001

## Environment Variables

Create a `.env` file in the root (optional):

```
PORT=3001
JWT_SECRET=your-secret-key
```

## Project Structure

```
illuvara/
├── server/
│   ├── index.js          # Express entry point
│   ├── db.js             # SQLite schema & connection
│   ├── creatures.js      # All 25 creature definitions
│   ├── combat.js         # Battle engine
│   ├── seed.js           # Database seeder
│   └── routes/
│       ├── auth.js       # Wallet connect, JWT
│       ├── creatures.js  # Collection, capture, evolve, merge
│       ├── battle.js     # Battle system
│       └── marketplace.js
├── client/
│   └── src/
│       ├── pages/        # Landing, Wilderness, Collection, Battle, MergeLab, Marketplace, Profile
│       ├── components/   # CreatureCard, Nav, UI components
│       ├── store/        # Zustand global state
│       └── lib/          # API helper
└── package.json          # Root scripts (dev, seed, install:all)
```

## Game Mechanics

### Combat Engine
- Initiative: SPD + d20 roll determines action order
- Energy builds each turn (floor(SPD/8)); at 100 energy → signature skill fires
- Type matchups: 1.5× strong, 0.5× weak, 1× neutral
- Status effects: burn (5% HP/turn), stun (skip), paralyze (40% skip), silence (no skills)

### Type Chart
| Attacker | Strong vs | Weak vs |
|----------|-----------|---------|
| Fire | Wind | Water |
| Water | Fire, Thunder | Wind |
| Wind | Earth | Thunder |
| Thunder | Water | Wind |
| Shadow | Psychic | Light |
| Light | Shadow | — |
| Psychic | Shadow | — |

### Team Synergies
| Synergy | Types | Bonus |
|---------|-------|-------|
| Firestorm | Fire + Wind | +20% ATK, Burn on skills |
| Tidal Wall | Water + Earth | +25% DEF, +3 HP regen |
| Void Pact | Shadow + Psychic | +30% ATK, Silence on skills |
| Storm Surge | Thunder + Wind | +15 SPD, 2× energy |
| Radiant Shield | Light + Earth | +20 shield at start |

### Evolution Tiers
- Tier 1 → Tier 2 at Level 10
- Tier 2 → Tier 3 (branch choice) at Level 25
- Tier 3 × 3 (identical) → Legendary (Merge Lab)

## Creatures (25 total)

| Tier | Rarity | Examples |
|------|--------|---------|
| 1 | Common | Emberpup, Aquafin, Galesprout, Stoneback |
| 2 | Common | Infernog, Torrentail, Cyclomane, Ramrock |
| 3 | Rare | Blazehorn, Cinderfox, Tidalwyrm, Zephyrax |
| 4 | Legendary | Infernus Rex, Abyssalord, Stormbinder, Voidmind |
| 5 | Apex | Primordius (All-element) |

## API Endpoints

```
POST /api/auth/connect      Connect/register wallet
GET  /api/auth/me           Current player
GET  /api/creatures/all     All master creatures
GET  /api/creatures/collection  Player's creatures
POST /api/creatures/team    Set active team
POST /api/creatures/capture Catch creature in zone
POST /api/creatures/evolve  Evolve creature
POST /api/creatures/merge   Merge 3 → legendary
POST /api/battle/start      Run a battle
GET  /api/battle/history    Last 10 battles
GET  /api/marketplace       Browse listings
POST /api/marketplace/buy/:id  Purchase listing
POST /api/marketplace/list  List creature for sale
GET  /api/profile           Full player profile
```
