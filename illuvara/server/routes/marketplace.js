const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('./auth');

// Get all listings
router.get('/', authMiddleware, (req, res) => {
  const { type, rarity, minPrice, maxPrice, search } = req.query;

  let query = `
    SELECT ml.*, pc.level, pc.atk, pc.def, pc.spd, pc.max_hp,
           c.name as creature_name, c.type1, c.type2, c.tier, c.rarity, c.description,
           p.wallet_address as seller_wallet, p.username as seller_name
    FROM marketplace_listings ml
    JOIN player_creatures pc ON ml.player_creature_id = pc.id
    JOIN creatures c ON pc.creature_id = c.id
    JOIN players p ON ml.seller_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (type) { query += ' AND (c.type1 = ? OR c.type2 = ?)'; params.push(type, type); }
  if (rarity) { query += ' AND c.rarity = ?'; params.push(rarity); }
  if (minPrice) { query += ' AND ml.price >= ?'; params.push(minPrice); }
  if (maxPrice) { query += ' AND ml.price <= ?'; params.push(maxPrice); }
  if (search) { query += ' AND c.name LIKE ?'; params.push(`%${search}%`); }

  query += ' ORDER BY ml.listed_at DESC LIMIT 50';

  const listings = db.prepare(query).all(...params);
  res.json(listings);
});

// Buy a listing
router.post('/buy/:listingId', authMiddleware, (req, res) => {
  const listing = db.prepare(`
    SELECT ml.*, pc.player_id as current_owner_id, c.name as creature_name
    FROM marketplace_listings ml
    JOIN player_creatures pc ON ml.player_creature_id = pc.id
    JOIN creatures c ON pc.creature_id = c.id
    WHERE ml.id = ?
  `).get(req.params.listingId);

  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.current_owner_id === req.user.playerId) return res.status(400).json({ error: "Can't buy your own listing" });

  const buyer = db.prepare('SELECT * FROM players WHERE id = ?').get(req.user.playerId);
  if (buyer.shards < listing.price) return res.status(400).json({ error: 'Not enough Shards' });

  // Transaction
  db.prepare('UPDATE players SET shards = shards - ? WHERE id = ?').run(listing.price, req.user.playerId);
  db.prepare('UPDATE players SET shards = shards + ? WHERE id = ?').run(listing.price, listing.seller_id);
  db.prepare('UPDATE player_creatures SET player_id = ?, in_team = 0, team_slot = NULL WHERE id = ?').run(req.user.playerId, listing.player_creature_id);
  db.prepare('DELETE FROM marketplace_listings WHERE id = ?').run(listing.id);

  const updatedPlayer = db.prepare('SELECT shards FROM players WHERE id = ?').get(req.user.playerId);
  res.json({ success: true, shards: updatedPlayer.shards, creatureName: listing.creature_name });
});

// List a creature
router.post('/list', authMiddleware, (req, res) => {
  const { playerCreatureId, price } = req.body;
  if (!playerCreatureId || !price || price <= 0) return res.status(400).json({ error: 'Invalid listing' });

  const pc = db.prepare('SELECT * FROM player_creatures WHERE id = ? AND player_id = ?').get(playerCreatureId, req.user.playerId);
  if (!pc) return res.status(404).json({ error: 'Creature not found' });

  // Remove from team if in team
  db.prepare('UPDATE player_creatures SET in_team = 0, team_slot = NULL WHERE id = ?').run(playerCreatureId);

  const result = db.prepare('INSERT INTO marketplace_listings (seller_id, player_creature_id, price) VALUES (?, ?, ?)').run(req.user.playerId, playerCreatureId, price);
  res.json({ success: true, listingId: result.lastInsertRowid });
});

// Delist a creature
router.delete('/list/:listingId', authMiddleware, (req, res) => {
  const listing = db.prepare('SELECT * FROM marketplace_listings WHERE id = ? AND seller_id = ?').get(req.params.listingId, req.user.playerId);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  db.prepare('DELETE FROM marketplace_listings WHERE id = ?').run(listing.id);
  res.json({ success: true });
});

module.exports = router;
