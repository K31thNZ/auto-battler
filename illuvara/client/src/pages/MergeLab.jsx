import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, TYPE_COLORS } from '../store/gameStore';
import { api } from '../lib/api';

const LEGENDARY_MAP = {
  13: { name: 'Infernus Rex', emoji: '🌋', types: ['Fire','Earth','Wind'] },
  14: { name: 'Infernus Rex', emoji: '🌋', types: ['Fire','Earth','Wind'] },
  15: { name: 'Abyssalord',   emoji: '🌊', types: ['Water','Earth','Wind'] },
  16: { name: 'Abyssalord',   emoji: '🌊', types: ['Water','Earth','Wind'] },
  17: { name: 'Stormbinder',  emoji: '⛈️', types: ['Wind','Thunder','Ice'] },
  19: { name: 'Voidmind',     emoji: '🌑', types: ['Psychic','Shadow','Light'] },
};

function MergeGroup({ group, allCreatures, onMerge }) {
  const [confirming, setConfirming] = useState(false);
  const [merging, setMerging] = useState(false);
  const creatureDef = allCreatures.find(c => c.id === group[0].creature_id);
  const legendaryInfo = LEGENDARY_MAP[group[0].creature_id];
  const primaryColor = TYPE_COLORS[creatureDef?.type1] || '#7c3aed';

  const handleMerge = async () => {
    setMerging(true);
    try {
      await onMerge(group.map(pc => pc.id));
    } finally {
      setMerging(false);
      setConfirming(false);
    }
  };

  return (
    <motion.div
      className="glass rounded-2xl p-5 border"
      style={{ borderColor: `${primaryColor}44` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="text-4xl" style={{ filter: `drop-shadow(0 0 10px ${primaryColor})` }}>
          {legendaryInfo?.emoji || '⚗️'}
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Fusion Available</p>
          <h3 className="font-bold text-base">{group[0].creature_name}</h3>
          <p className="text-xs text-slate-500">×{group.length} — merge to create</p>
        </div>
      </div>

      {/* 3 creature cards collapsing into 1 */}
      <div className="flex items-center gap-2 mb-4">
        {group.map((pc, i) => (
          <div key={pc.id} className="flex-1">
            <div className="glass rounded-lg p-2 text-center border"
              style={{ borderColor: `${primaryColor}33` }}>
              <div className="text-2xl mb-1">
                {creatureDef?.type1 === 'Fire' ? '🔥' : creatureDef?.type1 === 'Water' ? '💧' : creatureDef?.type1 === 'Wind' ? '🌀' : '✨'}
              </div>
              <p className="text-xs text-slate-400">Lv.{pc.level}</p>
            </div>
          </div>
        ))}
        <div className="text-purple-400 text-xl mx-1">→</div>
        <div className="flex-1">
          <div className="rounded-lg p-2 text-center border glow-gold"
            style={{ background: `${primaryColor}22`, borderColor: '#fbbf24' }}>
            <div className="text-2xl mb-1">{legendaryInfo?.emoji || '⭐'}</div>
            <p className="text-xs text-amber-300 font-bold">{legendaryInfo?.name || 'Legendary'}</p>
          </div>
        </div>
      </div>

      {legendaryInfo && (
        <div className="flex gap-1 mb-4">
          {legendaryInfo.types.map(t => (
            <span key={t} className={`type-${t} text-xs px-2 py-0.5 rounded-full border`}>{t}</span>
          ))}
        </div>
      )}

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="w-full py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(124,58,237,0.2))',
            border: '1px solid rgba(251,191,36,0.4)',
            color: '#fbbf24',
          }}
        >
          🔬 Fuse into Legendary
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-red-300 text-center">⚠️ This will consume all 3 creatures permanently!</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMerge}
              disabled={merging}
              className="flex-1 py-2 rounded-lg font-bold text-sm transition-all"
              style={{ background: 'linear-gradient(135deg,#fbbf24,#f97316)', color: '#0a0f1e' }}
            >
              {merging ? '⚗️ Fusing...' : '✅ Confirm Fuse'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function MergeLab() {
  const { collection, loadCollection } = useGameStore();
  const [allCreatures, setAllCreatures] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function init() {
      await loadCollection();
      const c = await api.getAllCreatures();
      setAllCreatures(c);
    }
    init();
  }, []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // Group tier-3 creatures by creature_id (need 3 identical)
  const tier3 = collection.filter(pc => pc.tier === 3);
  const grouped = {};
  for (const pc of tier3) {
    if (!grouped[pc.creature_id]) grouped[pc.creature_id] = [];
    grouped[pc.creature_id].push(pc);
  }
  const mergeGroups = Object.values(grouped).filter(g => g.length >= 3).map(g => g.slice(0, 3));

  const handleMerge = async (ids) => {
    try {
      const result = await api.mergeCreatures(ids);
      showToast(`🌟 ${result.legendary.creature_name} created!`);
      await loadCollection();
    } catch (err) {
      showToast(err.message, false);
    }
  };

  // All possible fusions display
  const allFusions = [
    { name: 'Infernus Rex', emoji: '🌋', types: ['Fire','Earth','Wind'], needs: 'Blazehorn or Cinderfox ×3', tier: 4 },
    { name: 'Abyssalord',   emoji: '🌊', types: ['Water','Earth','Wind'], needs: 'Tidalwyrm or Mistshade ×3', tier: 4 },
    { name: 'Stormbinder',  emoji: '⛈️', types: ['Wind','Thunder','Ice'], needs: 'Zephyrax ×3', tier: 4 },
    { name: 'Voidmind',     emoji: '🌑', types: ['Psychic','Shadow','Light'], needs: 'Psyclaw ×3', tier: 4 },
    { name: 'Primordius',   emoji: '🌟', types: ['All'], needs: 'Legendary ×3 (future)', tier: 5 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-purple-300 mb-1">🔬 Fusion Lab</h1>
        <p className="text-slate-400">Merge three identical Tier-3 creatures into a Legendary</p>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className={`mb-5 p-3 rounded-xl border text-sm ${toast.ok ? 'bg-teal-900/40 border-teal-500/40 text-teal-300' : 'bg-red-900/40 border-red-500/40 text-red-300'}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Available merges */}
      {mergeGroups.length > 0 ? (
        <div className="mb-10">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4">Ready to Fuse</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {mergeGroups.map((group, i) => (
              <MergeGroup key={i} group={group} allCreatures={allCreatures} onMerge={handleMerge} />
            ))}
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-8 text-center mb-10">
          <div className="text-5xl mb-3">⚗️</div>
          <p className="text-slate-400 font-medium mb-1">No fusions available yet</p>
          <p className="text-slate-600 text-sm">
            Capture and evolve creatures to Tier 3, then collect 3 of the same kind to fuse.
          </p>
        </div>
      )}

      {/* All possible fusions */}
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">All Possible Fusions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allFusions.map((f) => {
          const unlocked = collection.some(pc => {
            const cd = allCreatures.find(c => c.id === pc.creature_id);
            return cd?.name === f.name;
          });
          return (
            <div key={f.name}
              className={`glass rounded-xl p-4 border transition-all ${unlocked ? 'border-amber-500/40 glow-gold' : 'border-white/5 opacity-50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{unlocked ? f.emoji : '🔒'}</span>
                <div>
                  <p className="font-bold text-sm">{f.name}</p>
                  <p className="text-xs text-slate-500">Tier {f.tier}</p>
                </div>
                {unlocked && <span className="ml-auto text-xs text-amber-300 bg-amber-900/30 px-2 py-0.5 rounded-full">Owned</span>}
              </div>
              <div className="flex gap-1 mb-1">
                {f.types.map(t => (
                  <span key={t} className={`type-${t} text-xs px-1.5 py-0.5 rounded-full border`}>{t}</span>
                ))}
              </div>
              <p className="text-xs text-slate-500">Requires: {f.needs}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
