import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { api } from '../lib/api';
import CreatureCard from '../components/creatures/CreatureCard';

const ALL_TYPES = ['Fire','Water','Wind','Earth','Thunder','Ice','Shadow','Light','Poison','Metal','Psychic','Nature'];
const ALL_RARITIES = ['Common','Rare','Legendary','Apex'];

export default function Collection() {
  const { collection, loadCollection, updateTeam, player, refreshPlayer } = useGameStore();
  const [allCreatures, setAllCreatures] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [filterRarity, setFilterRarity] = useState('');
  const [evolveTarget, setEvolveTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadCollection();
      const creatures = await api.getAllCreatures();
      setAllCreatures(creatures);
      setLoading(false);
    }
    init();
  }, []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredCollection = collection.filter(pc => {
    if (filterType && pc.type1 !== filterType && pc.type2 !== filterType) return false;
    if (filterRarity && pc.rarity !== filterRarity) return false;
    return true;
  });

  const teamCreatures = collection.filter(c => c.in_team).sort((a, b) => a.team_slot - b.team_slot);

  const handleTeamToggle = async (pc) => {
    const currentTeam = collection.filter(c => c.in_team);
    let newTeam;
    if (pc.in_team) {
      newTeam = currentTeam.filter(c => c.id !== pc.id);
    } else {
      if (currentTeam.length >= 3) {
        showToast('Team is full! Remove a creature first.', false);
        return;
      }
      newTeam = [...currentTeam, pc];
    }
    const slots = newTeam.map((c, i) => ({ playerCreatureId: c.id, slot: i + 1 }));
    await updateTeam(slots);
    showToast(pc.in_team ? `${pc.creature_name} removed from team` : `${pc.creature_name} added to team`);
  };

  const handleEvolve = (pc) => {
    const creature = allCreatures.find(c => c.id === pc.creature_id);
    setEvolveTarget({ pc, creature });
  };

  const confirmEvolve = async (choiceA) => {
    try {
      const result = await api.evolveCreature(evolveTarget.pc.id, choiceA);
      showToast(`✨ Evolved into ${result.name}!`);
      setEvolveTarget(null);
      await loadCollection();
    } catch (err) {
      showToast(err.message, false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-purple-400 text-xl animate-pulse">Loading collection...</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-purple-300 mb-1">🐉 My Collection</h1>
          <p className="text-slate-400">{collection.length} creatures owned</p>
        </div>
        <div className="text-sm text-teal-400">
          Team: {teamCreatures.length}/3 — {teamCreatures.map(c => c.creature_name).join(', ') || 'none selected'}
        </div>
      </div>

      {/* Toast */}
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
        <span className="text-sm text-slate-400 mr-1">Filter:</span>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-1.5"
        >
          <option value="">All Types</option>
          {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterRarity}
          onChange={e => setFilterRarity(e.target.value)}
          className="bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-1.5"
        >
          <option value="">All Rarities</option>
          {ALL_RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {(filterType || filterRarity) && (
          <button onClick={() => { setFilterType(''); setFilterRarity(''); }}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10">
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-slate-500">{filteredCollection.length} shown</span>
      </div>

      {/* Collection grid */}
      {filteredCollection.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-4xl mb-4">🌑</p>
          <p>No creatures found. Go explore the Wilderness!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredCollection.map((pc, i) => {
            const creature = allCreatures.find(c => c.id === pc.creature_id);
            return (
              <motion.div
                key={pc.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <CreatureCard
                  creature={creature}
                  playerCreature={pc}
                  showTeamBtn
                  onTeamToggle={handleTeamToggle}
                  onEvolve={handleEvolve}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Evolve Modal */}
      <AnimatePresence>
        {evolveTarget && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEvolveTarget(null)}
          >
            <motion.div
              className="glass rounded-2xl p-6 max-w-md w-full mx-4 border border-amber-500/30"
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="font-display text-xl text-amber-300 mb-2">✨ Evolution Choice</h2>
              <p className="text-slate-400 text-sm mb-5">
                <strong className="text-white">{evolveTarget.pc.creature_name}</strong> is ready to evolve!
                Choose its evolutionary path:
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[true, false].map((isA) => {
                  const targetId = isA ? evolveTarget.creature?.evolves_to_a : evolveTarget.creature?.evolves_to_b;
                  if (!targetId) return null;
                  const targetCreature = allCreatures.find(c => c.id === targetId);
                  const typeColor = targetCreature?.type1 ? `#${({Fire:'ef4444',Water:'3b82f6',Wind:'10b981',Earth:'84cc16',Thunder:'eab308',Ice:'67e8f9',Shadow:'8b5cf6',Light:'fbbf24',Poison:'a855f7',Metal:'9ca3af',Psychic:'ec4899',Nature:'22c55e'})[targetCreature.type1] || '7c3aed'}` : '#7c3aed';
                  return (
                    <button
                      key={String(isA)}
                      onClick={() => confirmEvolve(isA)}
                      className="glass p-4 rounded-xl border hover:scale-105 transition-all text-left"
                      style={{ borderColor: `${typeColor}55` }}
                    >
                      <div className="text-3xl mb-2">✨</div>
                      <p className="font-bold text-sm" style={{ color: typeColor }}>
                        {targetCreature?.name || `Path ${isA ? 'A' : 'B'}`}
                      </p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {targetCreature?.type1 && (
                          <span className={`type-${targetCreature.type1} text-xs px-1.5 py-0.5 rounded-full border`}>
                            {targetCreature.type1}
                          </span>
                        )}
                        {targetCreature?.type2 && (
                          <span className={`type-${targetCreature.type2} text-xs px-1.5 py-0.5 rounded-full border`}>
                            {targetCreature.type2}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{targetCreature?.description?.slice(0, 50)}...</p>
                    </button>
                  );
                }).filter(Boolean)}
              </div>

              {!evolveTarget.creature?.evolves_to_b && (
                <button
                  onClick={() => confirmEvolve(true)}
                  className="w-full mt-4 py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold hover:bg-amber-500/30 transition-colors"
                >
                  ✨ Evolve Now
                </button>
              )}

              <button onClick={() => setEvolveTarget(null)}
                className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
