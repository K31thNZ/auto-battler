import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, TYPE_COLORS } from '../store/gameStore';
import { api } from '../lib/api';
import CreatureSprite from '../components/creatures/CreatureSprite';
import ShardCrystal from '../components/creatures/ShardCrystal';

const HEAL_COST_PER = 5; // shards per creature

function HpBar({ current, max }) {
  const pct = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
  const color = pct > 60 ? '#22c55e' : pct > 30 ? '#f97316' : '#ef4444';
  return (
    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }}/>
    </div>
  );
}

function CreatureHealCard({ pc, selected, onToggle, healing, justHealed }) {
  const hp     = pc.current_hp ?? pc.max_hp;
  const pct    = Math.round((hp / pc.max_hp) * 100);
  const hurt   = hp < pc.max_hp;
  const color  = TYPE_COLORS[pc.type1] || '#7c3aed';

  return (
    <motion.div
      layout
      onClick={() => hurt && onToggle(pc.id)}
      whileHover={hurt ? { scale: 1.02 } : {}}
      className={`glass rounded-xl overflow-hidden border-t-2 transition-all cursor-pointer
        ${selected ? 'ring-2 ring-teal-400' : ''}
        ${!hurt ? 'opacity-40' : ''}
        ${justHealed ? 'ring-2 ring-green-400' : ''}`}
      style={{ borderTopColor: color }}
    >
      <div className="relative h-24 flex items-center justify-center"
        style={{ background: `radial-gradient(ellipse, ${color}22 0%, transparent 70%)` }}>
        <CreatureSprite name={pc.creature_name} type1={pc.type1} size={72}
          animated={hurt && !healing} fainted={hp <= 0}/>

        {healing && selected && (
          <motion.div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="text-green-400 text-2xl animate-spin" style={{ animationDuration: '1s' }}>✚</span>
          </motion.div>
        )}
        {justHealed && (
          <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 1, scale: 0.5 }} animate={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.8 }}>
            <span className="text-green-400 font-black text-sm">FULL HP</span>
          </motion.div>
        )}

        <div className={`absolute top-1.5 right-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold
          ${!hurt ? 'bg-teal-500/30 text-teal-300' : 'bg-red-500/30 text-red-300'}`}>
          {!hurt ? '✓ Full' : `${pct}%`}
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="font-bold text-sm">{pc.creature_name}</span>
          <span className="text-xs text-slate-500">Lv.{pc.level}</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          <span className={`type-${pc.type1} text-xs px-1.5 py-0.5 rounded-full border`}>{pc.type1}</span>
          {pc.type2 && <span className={`type-${pc.type2} text-xs px-1.5 py-0.5 rounded-full border`}>{pc.type2}</span>}
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>HP</span>
            <span className={hurt ? 'text-red-400' : 'text-teal-400'}>{hp}/{pc.max_hp}</span>
          </div>
          <HpBar current={hp} max={pc.max_hp}/>
        </div>
        {hurt && (
          <p className="text-xs text-slate-600">
            {selected ? '✓ Selected for healing' : 'Click to select'}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function Infirmary() {
  const { collection, loadCollection, refreshPlayer, player } = useGameStore();
  const [selected, setSelected]       = useState(new Set());
  const [healing, setHealing]         = useState(false);
  const [justHealed, setJustHealed]   = useState(new Set());
  const [toast, setToast]             = useState(null);

  useEffect(() => { loadCollection(); }, []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const injured = collection.filter(pc => (pc.current_hp ?? pc.max_hp) < pc.max_hp);
  const healthy = collection.filter(pc => (pc.current_hp ?? pc.max_hp) >= pc.max_hp);

  const toggleSelect  = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const selectAll  = () => setSelected(new Set(injured.map(pc => pc.id)));
  const clearAll   = () => setSelected(new Set());

  const selectedCreatures  = injured.filter(pc => selected.has(pc.id));
  const shardCost          = selectedCreatures.length * HEAL_COST_PER;
  const canAffordShards    = (player?.shards ?? 0) >= shardCost;

  const doHeal = async (useShards) => {
    if (!selected.size) return;
    setHealing(true);
    try {
      const ids    = [...selected];
      const result = await api.healCreatures(ids, useShards);
      setJustHealed(new Set(result.healed ?? ids));
      showToast(result.message ?? `Healed ${ids.length} creatures`);
      setSelected(new Set());
      setTimeout(async () => {
        await loadCollection();
        await refreshPlayer();
        setJustHealed(new Set());
      }, 800);
    } catch (err) {
      showToast(err.message, false);
    } finally {
      setHealing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-teal-300 mb-1">✚ Infirmary</h1>
        <p className="text-slate-400 text-sm">Restore your creatures to full health after battle</p>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className={`mb-4 p-3 rounded-xl border text-sm font-medium
              ${toast.ok ? 'bg-teal-900/40 border-teal-500/40 text-teal-300'
                         : 'bg-red-900/40 border-red-500/40 text-red-300'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="glass rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
          <span className="text-slate-300">{injured.length} injured</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-500"/>
          <span className="text-slate-300">{healthy.length} healthy</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-amber-400 font-bold">💎 {player?.shards?.toLocaleString()}</span>
          {injured.length > 0 && (
            <>
              <button onClick={selectAll}
                className="text-xs px-2 py-1 rounded bg-teal-600/20 text-teal-400 border border-teal-600/40 hover:bg-teal-600/40 transition-colors">
                All
              </button>
              {selected.size > 0 && (
                <button onClick={clearAll}
                  className="text-xs px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-colors">
                  None
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* All healthy */}
      {injured.length === 0 && (
        <motion.div className="glass rounded-2xl p-16 text-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-5xl mb-4">💚</div>
          <p className="font-bold text-teal-300 text-lg mb-1">All creatures are healthy!</p>
          <p className="text-slate-500 text-sm">Battle hard, then come back here to recover.</p>
        </motion.div>
      )}

      {/* Injured grid */}
      {injured.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">
            Injured — {injured.length} creature{injured.length !== 1 ? 's' : ''}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-5">
            {injured.map(pc => (
              <CreatureHealCard key={pc.id} pc={pc}
                selected={selected.has(pc.id)} onToggle={toggleSelect}
                healing={healing} justHealed={justHealed.has(pc.id)}/>
            ))}
          </div>

          {/* Heal action panel */}
          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
                className="glass rounded-2xl p-5 border border-teal-500/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div>
                    <p className="font-bold text-teal-300">
                      {selected.size} creature{selected.size !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Instant heal: <strong className="text-amber-400">{shardCost} 💎</strong>
                      {!canAffordShards && <span className="text-red-400 ml-1">(not enough)</span>}
                    </p>
                  </div>
                  <div className="flex gap-2 sm:ml-auto flex-wrap">
                    <button onClick={() => doHeal(false)} disabled={healing}
                      className="px-4 py-2 rounded-xl font-bold text-sm bg-teal-700/30 border border-teal-600/50 text-teal-300 hover:bg-teal-700/50 disabled:opacity-40 transition-all">
                      {healing ? '🔄 Healing…' : '🛏 Rest & Heal (Free)'}
                    </button>
                    <button onClick={() => doHeal(true)} disabled={healing || !canAffordShards}
                      className="px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
                      style={{
                        background: canAffordShards ? 'linear-gradient(135deg,#d97706,#f59e0b)' : 'rgba(255,255,255,0.05)',
                        color: canAffordShards ? '#1c1917' : '#6b7280',
                        border: canAffordShards ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      }}>
                      ⚡ Instant ({shardCost} 💎)
                    </button>
                  </div>
                </div>

                {/* Selected previews */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {selectedCreatures.map(pc => (
                    <div key={pc.id} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1 text-xs">
                      <CreatureSprite name={pc.creature_name} type1={pc.type1} size={18} animated={false}/>
                      <span>{pc.creature_name}</span>
                      <span className="text-red-400">{pc.current_hp}/{pc.max_hp}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Healthy grid */}
      {healthy.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">
            Healthy — {healthy.length}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {healthy.map(pc => (
              <CreatureHealCard key={pc.id} pc={pc}
                selected={false} onToggle={() => {}}
                healing={false} justHealed={false}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
