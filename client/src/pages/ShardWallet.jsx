import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { api } from '../lib/api';
import ShardCrystal, { SHARD_CONFIG } from '../components/creatures/ShardCrystal';
import CreatureSprite from '../components/creatures/CreatureSprite';

const TIER_YIELD_DISPLAY = { 1: '6–10', 2: '17–24', 3: '47–64', 4: '128–170', 5: '340–400+' };
const RARITY_COLORS = { Common: '#6b7280', Rare: '#3b82f6', Legendary: '#fbbf24', Apex: '#ec4899' };

function WalletCard({ element, quantity }) {
  const cfg = SHARD_CONFIG[element];
  if (!cfg) return null;
  return (
    <motion.div
      layout
      className="glass rounded-xl p-4 flex flex-col items-center gap-2 border"
      style={{ borderColor: `${cfg.color}44` }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.03, y: -2 }}
    >
      <ShardCrystal type={element} size={56} animated={quantity > 0} />
      <p className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.name}</p>
      <p className="text-xl font-black" style={{ color: cfg.color }}>{quantity.toLocaleString()}</p>
    </motion.div>
  );
}

function ReleaseConfirmModal({ pc, onConfirm, onCancel, loading }) {
  if (!pc) return null;
  const tier = pc.tier;
  const yieldRange = TIER_YIELD_DISPLAY[tier] || '?';
  const color1 = SHARD_CONFIG[pc.type1]?.color || '#7c3aed';
  const color2 = pc.type2 ? SHARD_CONFIG[pc.type2]?.color : null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <motion.div
        className="glass rounded-2xl p-6 max-w-sm w-full mx-4 border border-red-500/30"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Crystal preview */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative">
            <CreatureSprite name={pc.creature_name} type1={pc.type1} size={56} animated={false} />
            <div className="absolute -bottom-1 -right-1 text-lg">→</div>
          </div>
          <div className="flex gap-1">
            <ShardCrystal type={pc.type1} size={48} animated={false} />
            {pc.type2 && <ShardCrystal type={pc.type2} size={36} animated={false} />}
          </div>
        </div>

        <h2 className="font-display text-lg text-red-300 mb-1 text-center">Release creature?</h2>
        <p className="text-slate-400 text-sm text-center mb-4">
          <strong className="text-white">{pc.creature_name}</strong> will be permanently dissolved
          into elemental shard crystals. This cannot be undone.
        </p>

        <div className="glass rounded-xl p-3 mb-4 space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Estimated yield</p>
          <div className="flex items-center gap-2">
            <ShardCrystal type={pc.type1} size={24} animated={false} />
            <span className="text-sm font-bold" style={{ color: color1 }}>
              {yieldRange} {pc.type1} shards
            </span>
          </div>
          {pc.type2 && (
            <div className="flex items-center gap-2">
              <ShardCrystal type={pc.type2} size={24} animated={false} />
              <span className="text-sm" style={{ color: color2 }}>
                ~40% bonus {pc.type2} shards
              </span>
            </div>
          )}
          <p className="text-xs text-slate-600 mt-1">
            Tier {tier} · {pc.rarity} — {tier >= 3 ? 'High yield' : tier >= 2 ? 'Moderate yield' : 'Low yield'}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2 rounded-xl font-bold text-sm bg-red-600/30 border border-red-500/50 text-red-300 hover:bg-red-600/50 disabled:opacity-40 transition-colors">
            {loading ? '⚗️ Releasing...' : '🔥 Release & Distill'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ShardWallet() {
  const { collection, loadCollection, refreshPlayer } = useGameStore();
  const [shards, setShards] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);
  const [confirmPc, setConfirmPc] = useState(null);
  const [toast, setToast] = useState(null);
  const [justReleased, setJustReleased] = useState(null);
  const [tab, setTab] = useState('wallet'); // 'wallet' | 'release' | 'history'

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const loadShards = useCallback(async () => {
    try {
      const data = await api.getShards();
      setShards(data.shards);
      setHistory(data.history);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadShards(), loadCollection()]);
      setLoading(false);
    }
    init();
  }, []);

  const handleRelease = async () => {
    if (!confirmPc) return;
    setReleasing(true);
    try {
      const result = await api.releaseCreature(confirmPc.id);
      setJustReleased(result);
      showToast(result.message);
      setConfirmPc(null);
      await Promise.all([loadShards(), loadCollection(), refreshPlayer()]);
      setTimeout(() => setJustReleased(null), 3000);
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setReleasing(false);
    }
  };

  // All elements, ensure every type is shown even if 0
  const ALL_ELEMENTS = Object.keys(SHARD_CONFIG);
  const shardMap = Object.fromEntries(shards.map(s => [s.element, s.quantity]));
  const displayShards = ALL_ELEMENTS.map(el => ({ element: el, quantity: shardMap[el] || 0 }));
  const totalShards = displayShards.reduce((sum, s) => sum + s.quantity, 0);

  // Releasable: not in team
  const releasable = collection.filter(pc => !pc.in_team);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-purple-300 mb-1">
            ◈ Shard Wallet
          </h1>
          <p className="text-slate-400 text-sm">
            Release creatures to distill their primal energy into elemental shard crystals
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-purple-300">{totalShards.toLocaleString()}</p>
          <p className="text-xs text-slate-500">total shards</p>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className={`mb-4 p-3 rounded-xl border text-sm font-medium flex items-center gap-2
              ${toast.ok ? 'bg-teal-900/40 border-teal-500/40 text-teal-300' : 'bg-red-900/40 border-red-500/40 text-red-300'}`}
          >
            <span className="text-lg">{toast.ok ? '◈' : '⚠'}</span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
        {[['wallet','◈ My Shards'],['release','🔥 Release'],['history','📜 History']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-purple-600/40 text-purple-300' : 'text-slate-400 hover:text-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── WALLET TAB ── */}
      {tab === 'wallet' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-purple-400 animate-pulse">Loading shard wallet...</div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
                {displayShards.map(({ element, quantity }) => (
                  <WalletCard key={element} element={element} quantity={quantity} />
                ))}
              </div>

              {/* Yield reference table */}
              <div className="glass rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Shard yield guide</h3>
                <div className="space-y-1.5">
                  {[1,2,3,4,5].map(tier => (
                    <div key={tier} className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500 w-14">Tier {tier}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full bg-purple-500" style={{ width: `${tier * 20}%` }}/>
                      </div>
                      <span className="text-purple-300 font-bold w-24 text-right">{TIER_YIELD_DISPLAY[tier]} shards</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-3">
                  Dual-type creatures yield additional shards of their secondary element at ~40% rate. Legendary rarity adds a 1.8× bonus.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── RELEASE TAB ── */}
      {tab === 'release' && (
        <div>
          <div className="glass rounded-xl p-4 mb-5 border border-red-500/20">
            <p className="text-sm text-red-300 font-medium mb-1">⚠ Permanent action</p>
            <p className="text-xs text-slate-400">
              Releasing a creature destroys it permanently and distills its core energy into elemental shard crystals.
              Higher tier and rarer creatures yield significantly more shards. Creatures on your team cannot be released.
            </p>
          </div>

          {releasable.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-3xl mb-2">🐾</p>
              <p>No releasable creatures — all are on your team or your collection is empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {releasable.map(pc => {
                const color = SHARD_CONFIG[pc.type1]?.color || '#7c3aed';
                const hp = pc.current_hp ?? pc.max_hp;
                return (
                  <motion.div key={pc.id}
                    className="glass rounded-xl overflow-hidden border-t-2 cursor-pointer hover:-translate-y-1 transition-all"
                    style={{ borderTopColor: color }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setConfirmPc(pc)}
                  >
                    <div className="relative h-24 flex items-center justify-center"
                      style={{ background: `radial-gradient(ellipse, ${color}22 0%, transparent 70%)` }}>
                      <CreatureSprite name={pc.creature_name} type1={pc.type1} size={72} animated={false} />
                      <div className="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded font-bold"
                        style={{ color: RARITY_COLORS[pc.rarity], background: `${RARITY_COLORS[pc.rarity]}22`, border: `1px solid ${RARITY_COLORS[pc.rarity]}44` }}>
                        T{pc.tier}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-sm mb-1">{pc.creature_name}</p>
                      <div className="flex gap-1 mb-2">
                        <span className={`type-${pc.type1} text-xs px-1.5 py-0.5 rounded-full border`}>{pc.type1}</span>
                        {pc.type2 && <span className={`type-${pc.type2} text-xs px-1.5 py-0.5 rounded-full border`}>{pc.type2}</span>}
                      </div>
                      {/* Shard yield preview */}
                      <div className="flex items-center gap-1 mt-1">
                        <ShardCrystal type={pc.type1} size={18} animated={false} />
                        {pc.type2 && <ShardCrystal type={pc.type2} size={14} animated={false} />}
                        <span className="text-xs text-slate-400 ml-1">{TIER_YIELD_DISPLAY[pc.tier]} shards</span>
                      </div>
                      <button
                        className="w-full mt-2 py-1.5 rounded-lg text-xs font-bold bg-red-600/20 text-red-400 border border-red-600/40 hover:bg-red-600/40 transition-colors"
                        onClick={e => { e.stopPropagation(); setConfirmPc(pc); }}
                      >
                        Release
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="glass rounded-xl overflow-hidden">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-3xl mb-2">📜</p>
              <p>No shard transactions yet. Release a creature to begin.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {history.map(tx => {
                const cfg = SHARD_CONFIG[tx.element];
                const isGain = tx.quantity > 0;
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-4">
                    <ShardCrystal type={tx.element} size={28} animated={false} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">
                        {tx.creature_name ? `${tx.creature_name} released` : tx.reason}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tx.element} shard · {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${isGain ? 'text-teal-400' : 'text-red-400'}`}
                      style={{ color: isGain ? cfg?.color : '#ef4444' }}>
                      {isGain ? '+' : ''}{tx.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmPc && (
          <ReleaseConfirmModal
            pc={confirmPc}
            onConfirm={handleRelease}
            onCancel={() => setConfirmPc(null)}
            loading={releasing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
