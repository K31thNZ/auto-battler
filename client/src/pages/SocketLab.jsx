import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, TYPE_COLORS } from '../store/gameStore';
import { api } from '../lib/api';
import ShardCrystal, { SHARD_CONFIG } from '../components/creatures/ShardCrystal';
import CreatureSprite from '../components/creatures/CreatureSprite';

const PURITY_ORDER  = ['Crude','Refined','Pure','Radiant','Primal'];
const PURITY_MULT   = { Crude:1.0, Refined:1.4, Pure:1.9, Radiant:2.6, Primal:3.5 };
const PURITY_COST   = { Crude:1, Refined:3, Pure:9, Radiant:27, Primal:81 };
const PURITY_COLOR  = { Crude:'#6b7280', Refined:'#10b981', Pure:'#3b82f6', Radiant:'#fbbf24', Primal:'#ec4899' };
const SLOTS_BY_TIER = { 1:0, 2:1, 3:2, 4:3, 5:4 };
const ALL_ELEMENTS  = Object.keys(SHARD_CONFIG);

// Hostility lookup (mirrors server)
const TYPE_WEAK_TO = {
  Fire:['Water'], Water:['Wind'], Wind:['Thunder'],
  Earth:['Water'], Thunder:['Wind'], Shadow:['Light'],
  Light:['Light'], Psychic:['Psychic'],
};
function isHostile(el, types) {
  return types.some(t => (TYPE_WEAK_TO[t]||[]).includes(el));
}
function isMatching(el, types) { return types.includes(el); }

function PurityBadge({ purity }) {
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${PURITY_COLOR[purity]}22`, color: PURITY_COLOR[purity], border: `1px solid ${PURITY_COLOR[purity]}44` }}>
      {purity} ×{PURITY_MULT[purity]}
    </span>
  );
}

function SocketSlot({ slot, socket, maxSlots, creature, onSocket, onUnsocket, onUpgrade, shardWallet, loading }) {
  const [showPicker, setShowPicker] = useState(false);
  const [socketType, setSocketType] = useState('amplify');
  const types = [creature.type1, creature.type2].filter(Boolean);
  const isOverflow = socket?.socket_type === 'resist-overflow';
  const isEmpty = !socket;
  const cfg = socket ? SHARD_CONFIG[socket.element] : null;

  if (isOverflow) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-3 flex items-center justify-center min-h-16 opacity-40">
        <span className="text-xs text-slate-500">Resist overflow</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isEmpty ? (
        <motion.button
          className="w-full rounded-xl border-2 border-dashed border-white/20 p-4 flex flex-col items-center gap-2 hover:border-purple-500/50 hover:bg-purple-900/10 transition-all"
          onClick={() => setShowPicker(v => !v)}
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-slate-500 text-lg">+</div>
          <span className="text-xs text-slate-500">Socket {slot}</span>
        </motion.button>
      ) : (
        <motion.div
          className="rounded-xl border p-3 flex flex-col items-center gap-2"
          style={{ borderColor: `${cfg.color}55`, background: `${cfg.color}0a` }}
          initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        >
          <ShardCrystal type={socket.element} size={44} animated tier={2} />
          <p className="text-xs font-bold" style={{ color: cfg.color }}>{socket.element}</p>
          <PurityBadge purity={socket.purity} />
          <p className="text-xs text-slate-400 text-center">{socket.socket_type === 'resist' ? '🛡 Resist' : '⚡ Amplify'}</p>
          <div className="flex gap-1 w-full">
            <button
              onClick={() => onUpgrade(slot)}
              disabled={loading || socket.purity === 'Primal'}
              className="flex-1 text-xs py-1 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-600/30 hover:bg-amber-600/40 disabled:opacity-30 transition-colors"
            >
              ↑ Upgrade
            </button>
            <button
              onClick={() => onUnsocket(slot)}
              disabled={loading}
              className="flex-1 text-xs py-1 rounded-lg bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/40 disabled:opacity-30 transition-colors"
            >
              × Remove
            </button>
          </div>
        </motion.div>
      )}

      {/* Shard picker */}
      <AnimatePresence>
        {showPicker && isEmpty && (
          <motion.div
            className="absolute z-30 top-full mt-2 left-0 right-0 glass rounded-xl p-3 border border-purple-500/30 shadow-xl"
            initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
          >
            {/* Socket type toggle */}
            <div className="flex gap-1 mb-3">
              {['amplify','resist'].map(t => (
                <button key={t} onClick={() => setSocketType(t)}
                  disabled={t === 'resist' && creature.tier < 3}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors disabled:opacity-30
                    ${socketType === t ? 'bg-purple-600/40 text-purple-300 border border-purple-500/50' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                  {t === 'amplify' ? '⚡ Amplify' : '🛡 Resist (T3+)'}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-500 mb-2">
              {socketType === 'resist' ? 'Select a hostile element to resist:' : 'Select element to socket:'}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {ALL_ELEMENTS.map(el => {
                const qty = shardWallet[el] || 0;
                const hostile = isHostile(el, types);
                const matching = isMatching(el, types);
                const showResist = socketType === 'resist' && !hostile;
                const disabled = qty < 1 || showResist;
                const cfg2 = SHARD_CONFIG[el];
                return (
                  <button key={el}
                    disabled={disabled || loading}
                    onClick={() => { onSocket(slot, el, socketType); setShowPicker(false); }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all
                      ${disabled ? 'opacity-25 cursor-not-allowed border-white/5 bg-transparent' : 'hover:scale-105 border-white/10 bg-white/3 hover:bg-white/8'}`}
                    title={`${el}: ${qty} available${matching ? ' (matching!)' : hostile ? ' (hostile — resist)' : ''}`}
                  >
                    <ShardCrystal type={el} size={28} animated={false} />
                    <span style={{ color: disabled ? '#4b5563' : cfg2.color }} className="font-medium leading-none">{el}</span>
                    <span className={qty > 0 ? 'text-slate-300' : 'text-slate-600'}>×{qty}</span>
                    {matching && !disabled && <span className="text-teal-400 text-xs">match</span>}
                    {hostile && !disabled && socketType==='resist' && <span className="text-amber-400 text-xs">resist</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowPicker(false)} className="w-full mt-2 text-xs text-slate-500 hover:text-slate-300 py-1">Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatDiff({ label, base, boosted, color }) {
  const diff = boosted - base;
  const pct = base > 0 ? Math.round((diff / base) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500 w-10 text-xs">{label}</span>
      <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100,(base/300)*100)}%`, background: color, opacity:0.4 }}/>
      </div>
      <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden -ml-3">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100,(boosted/300)*100)}%`, background: color }}/>
      </div>
      <span className="text-xs w-8 text-right" style={{ color }}>{boosted}</span>
      {diff > 0 && <span className="text-xs text-teal-400 w-12">+{pct}%</span>}
    </div>
  );
}

export default function SocketLab() {
  const { collection, loadCollection } = useGameStore();
  const [selected, setSelected] = useState(null);
  const [shardData, setShardData] = useState({ shards: [] });
  const [creatureDetail, setCreatureDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [mergingEl, setMergingEl] = useState('');
  const [mergePurity, setMergePurity] = useState('Refined');

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };

  useEffect(() => {
    loadCollection();
    api.getShards().then(d => setShardData(d)).catch(()=>{});
  }, []);

  const eligibleCreatures = collection.filter(pc => pc.tier >= 2);
  const shardWallet = Object.fromEntries((shardData.shards||[]).map(s => [s.element, s.quantity]));

  const loadDetail = useCallback(async (pcId) => {
    try {
      const d = await api.getSocketDetail(pcId);
      setCreatureDetail(d);
    } catch(e) { console.error(e); }
  }, []);

  const selectCreature = (pc) => {
    setSelected(pc);
    loadDetail(pc.id);
  };

  const handleSocket = async (slot, element, socketType) => {
    if (!selected) return;
    setLoading(true);
    try {
      await api.socketShard(selected.id, slot, element, socketType);
      await loadDetail(selected.id);
      await api.getShards().then(d => setShardData(d));
      showToast(`${element} shard socketed!`);
    } catch(e) { showToast(e.message, false); }
    finally { setLoading(false); }
  };

  const handleUnsocket = async (slot) => {
    if (!selected) return;
    setLoading(true);
    try {
      await api.unsocketShard(selected.id, slot);
      await loadDetail(selected.id);
      await api.getShards().then(d => setShardData(d));
      showToast('Shard removed — 1 crude shard refunded');
    } catch(e) { showToast(e.message, false); }
    finally { setLoading(false); }
  };

  const handleUpgrade = async (slot) => {
    if (!selected) return;
    setLoading(true);
    try {
      const r = await api.upgradeSocket(selected.id, slot);
      await loadDetail(selected.id);
      showToast(r.message);
    } catch(e) { showToast(e.message, false); }
    finally { setLoading(false); }
  };

  const handleMerge = async () => {
    if (!mergingEl || !mergePurity) return;
    setLoading(true);
    try {
      const r = await api.mergePurity(mergingEl, mergePurity);
      await api.getShards().then(d => setShardData(d));
      showToast(r.message);
    } catch(e) { showToast(e.message, false); }
    finally { setLoading(false); }
  };

  const cd = creatureDetail;
  const maxSlots = cd ? SLOTS_BY_TIER[cd.tier] || 0 : 0;

  // Build slot array
  const slotArray = cd ? Array.from({length: maxSlots}, (_, i) => {
    const slot = i + 1;
    const socket = cd.sockets?.find(s => s.slot === slot) || null;
    return { slot, socket };
  }) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-purple-300 mb-1">◈ Socket Lab</h1>
        <p className="text-slate-400 text-sm">Amplify creatures with elemental shards — Tier 2+ only</p>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-20,opacity:0}}
            className={`mb-4 p-3 rounded-xl border text-sm font-medium
              ${toast.ok ? 'bg-teal-900/40 border-teal-500/40 text-teal-300' : 'bg-red-900/40 border-red-500/40 text-red-300'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: creature picker ── */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select creature</h2>
          {eligibleCreatures.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center text-slate-500 text-sm">
              No Tier 2+ creatures. Evolve or capture more!
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {eligibleCreatures.map(pc => {
                const color = TYPE_COLORS[pc.type1] || '#7c3aed';
                const socketCount = pc.sockets?.length || 0;
                const maxS = SLOTS_BY_TIER[pc.tier] || 0;
                return (
                  <motion.button key={pc.id}
                    className={`w-full glass rounded-xl p-3 flex items-center gap-3 text-left transition-all border
                      ${selected?.id === pc.id ? 'border-purple-500/60 bg-purple-900/10' : 'border-white/5 hover:border-white/15'}`}
                    onClick={() => selectCreature(pc)}
                    whileHover={{ x: 2 }}
                  >
                    <CreatureSprite name={pc.creature_name} type1={pc.type1} size={40} animated={false} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{pc.creature_name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`type-${pc.type1} text-xs px-1.5 py-0.5 rounded-full border`}>{pc.type1}</span>
                        {pc.type2 && <span className={`type-${pc.type2} text-xs px-1.5 py-0.5 rounded-full border`}>{pc.type2}</span>}
                      </div>
                    </div>
                    {/* Socket pip display */}
                    <div className="flex gap-1">
                      {Array.from({length: maxS}).map((_, i) => {
                        const hasSocket = i < socketCount;
                        return <div key={i} className="w-2.5 h-2.5 rounded-full border"
                          style={{ background: hasSocket ? color : 'transparent', borderColor: hasSocket ? color : '#374151' }}/>;
                      })}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* ── Merge purity panel ── */}
          <div className="glass rounded-xl p-4 border border-amber-500/20 mt-4">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Merge shard purity</h2>
            <div className="space-y-2">
              <select value={mergingEl} onChange={e=>setMergingEl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-2">
                <option value="">Select element...</option>
                {ALL_ELEMENTS.map(el => <option key={el} value={el}>{el} ({shardWallet[el]||0} crude)</option>)}
              </select>
              <select value={mergePurity} onChange={e=>setMergePurity(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-2">
                {PURITY_ORDER.slice(1).map(p => (
                  <option key={p} value={p}>{p} — costs {PURITY_COST[p]} crude → ×{PURITY_MULT[p]}</option>
                ))}
              </select>
              {mergingEl && (
                <p className="text-xs text-slate-500">
                  You have {shardWallet[mergingEl]||0} {mergingEl} crude shards.
                  Need {PURITY_COST[mergePurity]} for 1× {mergePurity}.
                </p>
              )}
              <button onClick={handleMerge} disabled={!mergingEl || loading || (shardWallet[mergingEl]||0) < PURITY_COST[mergePurity]}
                className="w-full py-2 rounded-xl text-sm font-bold bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/40 disabled:opacity-30 transition-colors">
                ⚗️ Merge into {mergePurity}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: socket detail ── */}
        <div className="lg:col-span-2">
          {!cd ? (
            <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-slate-500 h-full min-h-64">
              <div className="text-4xl mb-3 opacity-40">◈</div>
              <p>Select a creature to begin socketing</p>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 space-y-6">
              {/* Creature header */}
              <div className="flex items-center gap-4">
                <CreatureSprite name={cd.creature_name} type1={cd.type1} size={72} animated />
                <div className="flex-1">
                  <h2 className="font-bold text-xl">{cd.creature_name}</h2>
                  <div className="flex gap-1 mt-1">
                    <span className={`type-${cd.type1} text-xs px-2 py-0.5 rounded-full border`}>{cd.type1}</span>
                    {cd.type2 && <span className={`type-${cd.type2} text-xs px-2 py-0.5 rounded-full border`}>{cd.type2}</span>}
                    <span className="text-xs text-slate-500 ml-1">Tier {cd.tier} · {maxSlots} socket{maxSlots !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                {cd.boostedStats?.resistances?.length > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Resists</p>
                    {cd.boostedStats.resistances.map(r => (
                      <span key={r.element} className={`type-${r.element} text-xs px-2 py-0.5 rounded-full border mr-1`}>
                        🛡 {r.element} −50%
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Stat comparison */}
              <div className="space-y-2 glass rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Stats — base → socketed</p>
                <StatDiff label="ATK" base={cd.atk} boosted={cd.boostedStats?.atk||cd.atk} color="#ef4444"/>
                <StatDiff label="DEF" base={cd.def} boosted={cd.boostedStats?.def||cd.def} color="#3b82f6"/>
                <StatDiff label="SPD" base={cd.spd} boosted={cd.boostedStats?.spd||cd.spd} color="#10b981"/>
                <StatDiff label="HP"  base={cd.max_hp} boosted={cd.boostedStats?.max_hp||cd.max_hp} color="#fbbf24"/>
              </div>

              {/* Socket slots */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                  Shard sockets ({cd.sockets?.filter(s=>s.socket_type!=='resist-overflow').length||0}/{maxSlots} filled)
                </p>
                {maxSlots === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    Tier 1 creatures cannot use sockets — evolve to Tier 2 first.
                  </div>
                ) : (
                  <div className={`grid gap-3 ${maxSlots <= 2 ? 'grid-cols-2' : maxSlots <= 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                    {slotArray.map(({ slot, socket }) => (
                      <SocketSlot key={slot}
                        slot={slot} socket={socket} maxSlots={maxSlots}
                        creature={cd} shardWallet={shardWallet}
                        onSocket={handleSocket} onUnsocket={handleUnsocket}
                        onUpgrade={handleUpgrade} loading={loading}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Socket guide for this creature */}
              <div className="glass rounded-xl p-3 text-xs space-y-1">
                <p className="text-slate-400 font-medium mb-1">Socket guide for {cd.creature_name}</p>
                {ALL_ELEMENTS.slice(0,6).map(el => {
                  const types = [cd.type1, cd.type2].filter(Boolean);
                  const match = isMatching(el, types);
                  const hostile = isHostile(el, types);
                  if (!match && !hostile) return null;
                  const cfg = SHARD_CONFIG[el];
                  return (
                    <div key={el} className="flex items-center gap-2">
                      <ShardCrystal type={el} size={16} animated={false} />
                      <span style={{ color: cfg.color }}>{el}</span>
                      <span className="text-slate-500">—</span>
                      <span className={match ? 'text-teal-400' : 'text-amber-400'}>
                        {match ? '⚡ Full amplify bonus' : '🛡 Can resist (Tier 3+)'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
