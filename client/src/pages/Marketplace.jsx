import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, TYPE_COLORS, RARITY_COLORS } from '../store/gameStore';
import { api } from '../lib/api';

const ALL_TYPES = ['Fire','Water','Wind','Earth','Thunder','Ice','Shadow','Light','Poison','Metal','Psychic','Nature'];

function ListingCard({ listing, onBuy, isMine, player }) {
  const [buying, setBuying] = useState(false);
  const primaryColor = TYPE_COLORS[listing.type1] || '#7c3aed';
  const rarityColor = RARITY_COLORS[listing.rarity] || '#6b7280';
  const canAfford = player?.shards >= listing.price;

  const handleBuy = async () => {
    setBuying(true);
    try { await onBuy(listing.id); }
    finally { setBuying(false); }
  };

  return (
    <motion.div
      className="glass rounded-xl overflow-hidden border-t-2 hover:-translate-y-1 transition-transform duration-200"
      style={{ borderTopColor: primaryColor }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="relative h-20 flex items-center justify-center"
        style={{ background: `radial-gradient(ellipse, ${primaryColor}22 0%, transparent 70%)` }}>
        <div className="text-5xl" style={{ filter: `drop-shadow(0 0 8px ${primaryColor}88)` }}>
          {getEmoji(listing.type1, listing.tier)}
        </div>
        <div className="absolute top-2 right-2">
          <span className="text-xs px-1.5 py-0.5 rounded font-bold"
            style={{ color: rarityColor, background: `${rarityColor}22`, border: `1px solid ${rarityColor}44` }}>
            {listing.rarity}
          </span>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-sm">{listing.creature_name}</h3>
          <span className="text-xs text-slate-500">Lv.{listing.level}</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          <span className={`type-${listing.type1} text-xs px-1.5 py-0.5 rounded-full border`}>{listing.type1}</span>
          {listing.type2 && <span className={`type-${listing.type2} text-xs px-1.5 py-0.5 rounded-full border`}>{listing.type2}</span>}
        </div>
        <div className="grid grid-cols-2 gap-x-2 text-xs text-slate-400">
          <span>ATK {listing.atk}</span><span>DEF {listing.def}</span>
          <span>SPD {listing.spd}</span><span>HP {listing.max_hp}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-amber-400 font-bold">💎 {listing.price}</span>
          <span className="text-xs text-slate-600 truncate max-w-20">
            {listing.seller_name || listing.seller_wallet?.slice(0,8)}
          </span>
        </div>
        {!isMine && (
          <button
            onClick={handleBuy}
            disabled={buying || !canAfford}
            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all
              ${canAfford
                ? 'bg-purple-600/30 text-purple-300 border border-purple-600/50 hover:bg-purple-600/50'
                : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'}`}
          >
            {buying ? '...' : canAfford ? 'Buy' : 'Not enough 💎'}
          </button>
        )}
        {isMine && (
          <div className="text-xs text-center text-slate-500 py-1">Your listing</div>
        )}
      </div>
    </motion.div>
  );
}

function getEmoji(type1, tier) {
  if (tier >= 4) return ['🌋','🌊','⛈️','🌑','🌟'][tier - 4] || '🌟';
  const e = { Fire:'🔥', Water:'💧', Wind:'🌀', Earth:'⛰️', Thunder:'⚡', Ice:'❄️', Shadow:'👾', Light:'✨', Poison:'☠️', Metal:'⚙️', Psychic:'🔮', Nature:'🌿' };
  return e[type1] || '🐾';
}

export default function Marketplace() {
  const { player, collection, loadCollection, refreshPlayer } = useGameStore();
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({ type: '', rarity: '', minPrice: '', maxPrice: '', search: '' });
  const [toast, setToast] = useState(null);
  const [showListModal, setShowListModal] = useState(false);
  const [listingPc, setListingPc] = useState(null);
  const [listPrice, setListPrice] = useState('');
  const [loading, setLoading] = useState(true);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getListings(filters);
      setListings(data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadListings(); loadCollection(); }, []);
  useEffect(() => { loadListings(); }, [filters]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBuy = async (listingId) => {
    try {
      const result = await api.buyListing(listingId);
      showToast(`✅ Purchased ${result.creatureName}!`);
      await Promise.all([loadListings(), loadCollection(), refreshPlayer()]);
    } catch (err) {
      showToast(err.message, false);
    }
  };

  const handleList = async () => {
    if (!listingPc || !listPrice || Number(listPrice) <= 0) return;
    try {
      await api.listCreature(listingPc.id, Number(listPrice));
      showToast(`Listed ${listingPc.creature_name} for ${listPrice} 💎`);
      setShowListModal(false);
      setListingPc(null);
      setListPrice('');
      await Promise.all([loadListings(), loadCollection()]);
    } catch (err) {
      showToast(err.message, false);
    }
  };

  const myListingIds = new Set(listings.filter(l => l.seller_id === player?.id).map(l => l.id));
  // Unlisted collection items
  const listedPcIds = new Set(listings.map(l => l.player_creature_id));
  const unlistedCollection = collection.filter(pc => !listedPcIds.has(pc.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-purple-300 mb-1">💎 Trade Hub</h1>
          <p className="text-slate-400">Buy and sell creatures with other trainers</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-amber-400 font-bold">💎 {player?.shards?.toLocaleString()} Shards</span>
          <button
            onClick={() => setShowListModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:bg-purple-600/50 transition-colors text-sm font-bold"
          >
            + List Creature
          </button>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className={`mb-4 p-3 rounded-xl border text-sm ${toast.ok ? 'bg-teal-900/40 border-teal-500/40 text-teal-300' : 'bg-red-900/40 border-red-500/40 text-red-300'}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-6 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search creature..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-1.5 w-36"
        />
        <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
          className="bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-1.5">
          <option value="">All Types</option>
          {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.rarity} onChange={e => setFilters(f => ({ ...f, rarity: e.target.value }))}
          className="bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-1.5">
          <option value="">All Rarities</option>
          {['Common','Rare','Legendary','Apex'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <input type="number" placeholder="Min 💎" value={filters.minPrice}
          onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
          className="bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-1.5 w-24" />
        <input type="number" placeholder="Max 💎" value={filters.maxPrice}
          onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
          className="bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-1.5 w-24" />
        <button onClick={() => setFilters({ type: '', rarity: '', minPrice: '', maxPrice: '', search: '' })}
          className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10">
          Clear
        </button>
        <span className="ml-auto text-xs text-slate-500">{listings.length} listings</span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-purple-400 animate-pulse">Loading marketplace...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-4xl mb-3">🏪</p>
          <p>No listings found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {listings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onBuy={handleBuy}
              isMine={myListingIds.has(listing.id)}
              player={player}
            />
          ))}
        </div>
      )}

      {/* List creature modal */}
      <AnimatePresence>
        {showListModal && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowListModal(false)}
          >
            <motion.div
              className="glass rounded-2xl p-6 max-w-md w-full mx-4 border border-purple-500/30"
              initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="font-display text-xl text-purple-300 mb-4">List a Creature</h2>
              <div className="mb-4 max-h-48 overflow-y-auto space-y-1">
                {unlistedCollection.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No creatures available to list</p>
                ) : unlistedCollection.map(pc => (
                  <button
                    key={pc.id}
                    onClick={() => setListingPc(pc)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors
                      ${listingPc?.id === pc.id ? 'bg-purple-600/30 border border-purple-500/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                  >
                    <span className="text-xl">{pc.type1 === 'Fire' ? '🔥' : pc.type1 === 'Water' ? '💧' : '✨'}</span>
                    <span className="font-medium">{pc.creature_name}</span>
                    <span className="text-slate-500 ml-auto">Lv.{pc.level}</span>
                  </button>
                ))}
              </div>
              {listingPc && (
                <div className="mb-4">
                  <label className="text-sm text-slate-400 mb-1 block">Price (Shards)</label>
                  <input
                    type="number"
                    value={listPrice}
                    onChange={e => setListPrice(e.target.value)}
                    placeholder="Enter price..."
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
                    min="1"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowListModal(false)}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleList}
                  disabled={!listingPc || !listPrice}
                  className="flex-1 py-2 rounded-lg font-bold text-sm bg-purple-600/40 text-purple-300 border border-purple-500/50 hover:bg-purple-600/60 disabled:opacity-40 transition-colors"
                >
                  List for 💎 {listPrice || '—'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
