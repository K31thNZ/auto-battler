import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, TYPE_COLORS } from '../store/gameStore';
import { api } from '../lib/api';
import CreatureSprite from '../components/creatures/CreatureSprite';

const DIFFICULTIES = [
  { key: 'easy',      label: 'Easy',      color: '#22c55e', desc: 'Tier 1–2 enemies' },
  { key: 'medium',    label: 'Medium',    color: '#f97316', desc: 'Tier 2–3 enemies' },
  { key: 'hard',      label: 'Hard',      color: '#ef4444', desc: 'Tier 3–4 enemies' },
  { key: 'legendary', label: 'Legendary', color: '#fbbf24', desc: 'Tier 4–5 enemies' },
];

function StatusIcon({ type }) {
  const icons = { burn: '🔥', stun: '💫', paralyze: '⚡', silence: '🔇' };
  return <span title={type}>{icons[type] || '❓'}</span>;
}

function CombatantPanel({ combatant, side }) {
  if (!combatant) return (
    <div className="glass rounded-xl p-3 opacity-30 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
      <span>—</span>
    </div>
  );
  const hpPct    = Math.max(0, Math.min(100, (combatant.hp / combatant.maxHp) * 100));
  const energyPct = Math.min(100, combatant.energy || 0);
  const hpColor  = hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f97316' : '#ef4444';
  const typeColor = TYPE_COLORS[combatant.type1] || '#7c3aed';
  const isDead   = combatant.hp <= 0;

  return (
    <div className={`glass rounded-xl p-3 border-t-2 transition-all duration-300 ${isDead ? 'opacity-40' : ''}`}
      style={{ borderTopColor: typeColor }}>
      <div className="flex items-center gap-2 mb-2">
        <CreatureSprite
          name={combatant.name}
          type1={combatant.type1}
          type2={combatant.type2}
          tier={combatant.tier || 1}
          size={40}
          animation={isDead ? 'faint' : 'idle'}
          fainted={isDead}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm truncate">{combatant.name}</span>
            <div className="flex gap-1">
              {(combatant.statusEffects || []).map((e, i) => (
                <StatusIcon key={i} type={e.type} />
              ))}
            </div>
          </div>
          <div className="flex gap-1 mt-0.5">
            <span className={`type-${combatant.type1} text-xs px-1.5 py-0.5 rounded-full border`}>{combatant.type1}</span>
            {combatant.type2 && <span className={`type-${combatant.type2} text-xs px-1.5 py-0.5 rounded-full border`}>{combatant.type2}</span>}
          </div>
        </div>
      </div>
      {/* HP */}
      <div className="mb-1">
        <div className="flex justify-between text-xs text-slate-400 mb-0.5">
          <span>HP</span><span>{combatant.hp}/{combatant.maxHp}</span>
        </div>
        <div className="bg-white/10 rounded-full h-2 overflow-hidden">
          <div className="h-full rounded-full hp-bar" style={{ width: `${hpPct}%`, background: hpColor }} />
        </div>
      </div>
      {/* Energy */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-0.5">
          <span>Energy</span><span>{Math.round(energyPct)}/100</span>
        </div>
        <div className="bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div className="h-full rounded-full energy-bar" style={{ width: `${energyPct}%`, background: '#7c3aed' }} />
        </div>
      </div>
      {combatant.shield > 0 && (
        <div className="mt-1 text-xs text-blue-300">🛡 {combatant.shield}</div>
      )}
    </div>
  );
}

export default function Battle() {
  const { collection, loadCollection, refreshPlayer, player } = useGameStore();
  const [difficulty, setDifficulty]     = useState('medium');
  const [battleState, setBattleState]   = useState(null);
  const [isRunning, setIsRunning]       = useState(false);
  const [currentLog, setCurrentLog]     = useState([]);
  const [displayTeams, setDisplayTeams] = useState(null);
  const [synergies, setSynergies]       = useState(null);
  const [showHealing, setShowHealing]   = useState(false);
  const [speed, setSpeed]               = useState(600);
  const logRef   = useRef(null);
  const animRef  = useRef(null);
  const speedRef = useRef(600);

  useEffect(() => { loadCollection(); }, []);

  const team = collection.filter(c => c.in_team).sort((a, b) => a.team_slot - b.team_slot);
  const hasInjured = collection.some(pc => (pc.current_hp ?? pc.max_hp) < pc.max_hp);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [currentLog]);

  const startBattle = async () => {
    if (!team.length) return;
    setIsRunning(true);
    setBattleState(null);
    setCurrentLog([]);
    setDisplayTeams(null);
    setShowHealing(false);

    try {
      const result = await api.startBattle(difficulty);
      setBattleState(result);
      setSynergies(result.synergies);
      let i = 0;
      const animate = () => {
        if (i >= result.log.length) {
          setDisplayTeams({ playerTeam: result.finalState.playerTeam, enemyTeam: result.finalState.enemyTeam });
          setIsRunning(false);
          refreshPlayer();
          loadCollection();
          return;
        }
        const entry = result.log[i];
        setCurrentLog(prev => [...prev, entry]);
        if (entry.hpSnapshot) setDisplayTeams(entry.hpSnapshot);
        i++;
        animRef.current = setTimeout(animate, speedRef.current);
      };
      animate();
    } catch (err) {
      setIsRunning(false);
      setCurrentLog([{ msg: `Error: ${err.message}`, type: 'error' }]);
    }
  };

  const skipAnimation = () => {
    if (animRef.current) clearTimeout(animRef.current);
    if (battleState) {
      setCurrentLog(battleState.log);
      setDisplayTeams({ playerTeam: battleState.finalState.playerTeam, enemyTeam: battleState.finalState.enemyTeam });
      setIsRunning(false);
      refreshPlayer();
      loadCollection();
    }
  };

  const handleSpeedChange = (val) => { setSpeed(val); speedRef.current = val; };

  const logColor = {
    attack: 'text-slate-300', skill: 'text-amber-300', faint: 'text-red-400',
    status: 'text-purple-300', synergy: 'text-teal-300', shield: 'text-blue-300', error: 'text-red-500'
  };

  const handleHealed = async () => {
    await loadCollection();
    await refreshPlayer();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-purple-300 mb-1">⚔️ Battle Arena</h1>
          <p className="text-slate-400">Assemble your team and conquer the arena</p>
        </div>
        <button
          onClick={() => setShowHealing(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all
            ${hasInjured
              ? 'bg-green-900/30 border-green-500/40 text-green-300 hover:bg-green-900/50 animate-pulse-glow'
              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
        >
          🏥 {hasInjured ? 'Heal Creatures' : 'Healing Station'}
        </button>
      </div>

      {/* Healing station */}
      <AnimatePresence>
        {showHealing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="glass rounded-xl p-4 border border-teal-500/30">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-teal-300 text-sm">✚ Quick Heal</p>
                <button onClick={() => setShowHealing(false)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {collection.filter(pc => (pc.current_hp ?? pc.max_hp) < pc.max_hp).map(pc => (
                  <div key={pc.id} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1 text-xs">
                    <CreatureSprite name={pc.creature_name} type1={pc.type1} size={20} animated={false}/>
                    <span>{pc.creature_name}</span>
                    <span className="text-red-400">{pc.current_hp}/{pc.max_hp}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const injured = collection.filter(pc => (pc.current_hp ?? pc.max_hp) < pc.max_hp);
                    if (!injured.length) return;
                    try {
                      await api.healCreatures(injured.map(pc => pc.id), false);
                      await handleHealed();
                      setShowHealing(false);
                    } catch(e) { console.error(e); }
                  }}
                  className="flex-1 py-2 rounded-xl text-sm font-bold bg-teal-700/30 border border-teal-600/50 text-teal-300 hover:bg-teal-700/50 transition-colors"
                >
                  🛏 Rest & Heal All (Free)
                </button>
                <a href="/infirmary"
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Full Infirmary →
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Difficulty */}
      <div className="glass rounded-xl p-4 mb-5">
        <p className="text-sm text-slate-400 mb-3">Difficulty:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIFFICULTIES.map(d => (
            <button key={d.key} onClick={() => setDifficulty(d.key)}
              className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all ${difficulty === d.key ? 'ring-2' : 'opacity-60 hover:opacity-80'}`}
              style={{ borderColor: `${d.color}66`, background: difficulty === d.key ? `${d.color}22` : 'transparent', color: d.color, boxShadow: difficulty === d.key ? `0 0 15px ${d.color}33` : 'none' }}>
              <div>{d.label}</div>
              <div className="text-xs opacity-70 font-normal">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {team.length === 0 && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 mb-5 text-red-300 text-sm">
          ⚠️ No team selected! Go to <strong>Collection</strong> and add up to 3 creatures to your team.
        </div>
      )}

      {/* Battle grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Player team */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider">Your Team</h2>
          {team.length > 0 ? team.map(pc => {
            const disp = displayTeams?.playerTeam?.find(c => c.id === pc.id);
            const c = disp
              ? { ...pc, name: pc.creature_name, hp: disp.hp, maxHp: disp.maxHp, energy: disp.energy, shield: disp.shield || 0, statusEffects: disp.statusEffects || [] }
              : { ...pc, name: pc.creature_name, hp: pc.current_hp || pc.max_hp, maxHp: pc.max_hp, energy: 0, shield: 0, statusEffects: [] };
            return <CombatantPanel key={pc.id} combatant={c} side="player" />;
          }) : <div className="glass rounded-xl p-6 text-center text-slate-500 text-sm">No team set</div>}

          {synergies?.player?.length > 0 && (
            <div className="glass rounded-xl p-3 space-y-1">
              <p className="text-xs text-teal-400 font-bold">Active Synergies:</p>
              {synergies.player.map(s => (
                <div key={s.name} className="text-xs text-teal-300 bg-teal-900/20 rounded px-2 py-1">
                  ⚡ <strong>{s.name}</strong> — {s.description}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Log + controls */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={startBattle} disabled={isRunning || !team.length}
              className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#0d9488)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
              {isRunning ? '⚔️ Battling...' : '⚔️ Start Battle'}
            </button>
            {isRunning && (
              <button onClick={skipAnimation} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-slate-300 hover:bg-white/20">
                Skip »
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Speed:</span>
            {[1200, 600, 200].map(s => (
              <button key={s} onClick={() => handleSpeedChange(s)}
                className={`px-2 py-1 rounded ${speed === s ? 'bg-purple-600/30 text-purple-300' : 'bg-white/5 hover:bg-white/10'}`}>
                {s === 1200 ? 'Slow' : s === 600 ? 'Normal' : 'Fast'}
              </button>
            ))}
          </div>

          <div ref={logRef} className="glass rounded-xl p-3 h-64 overflow-y-auto combat-log space-y-0.5 text-xs">
            {currentLog.length === 0
              ? <p className="text-slate-600 text-center mt-8">Battle log will appear here...</p>
              : currentLog.map((entry, i) => (
                  <p key={i} className={`${logColor[entry.type] || 'text-slate-400'} py-0.5 border-b border-white/5`}>
                    {entry.msg}
                  </p>
                ))}
          </div>

          {/* Result card */}
          {battleState && !isRunning && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`rounded-xl p-4 text-center border
                ${battleState.result === 'win' ? 'bg-teal-900/40 border-teal-500/40' : 'bg-red-900/40 border-red-500/40'}`}
            >
              <div className="text-3xl mb-1">{battleState.result === 'win' ? '🏆' : '💀'}</div>
              <p className={`font-bold text-lg ${battleState.result === 'win' ? 'text-teal-300' : 'text-red-300'}`}>
                {battleState.result === 'win' ? 'Victory!' : 'Defeated!'}
              </p>
              <div className="text-sm text-slate-400 mt-1 space-y-0.5">
                <p>+{battleState.xpGained} XP per creature</p>
                {battleState.shardsGained > 0 && <p className="text-amber-400">+{battleState.shardsGained} 💎 Shards</p>}
                {battleState.lootCreature && <p className="text-purple-300">🎁 Found: <strong>{battleState.lootCreature.name}</strong>!</p>}
              </div>
              {hasInjured && (
                <button
                  onClick={() => setShowHealing(true)}
                  className="mt-3 w-full py-2 rounded-lg bg-green-800/30 border border-green-600/40 text-green-300 text-sm font-bold hover:bg-green-800/50 transition-colors"
                >
                  🏥 Heal your creatures
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Enemy team */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">Enemy Team</h2>
          {battleState ? battleState.enemyTeam.map(et => {
            const disp = displayTeams?.enemyTeam?.find(c => c.id === et.id);
            const c = disp
              ? { ...et, hp: disp.hp, maxHp: disp.maxHp, energy: disp.energy, shield: disp.shield || 0, statusEffects: disp.statusEffects || [] }
              : { ...et, hp: et.base_hp || 100, maxHp: et.base_hp || 100, energy: 0, shield: 0, statusEffects: [] };
            return <CombatantPanel key={et.id} combatant={c} side="enemy" />;
          }) : (
            <div className="glass rounded-xl p-6 text-center text-slate-500 text-sm">Enemy team revealed when battle starts</div>
          )}

          {synergies?.enemy?.length > 0 && (
            <div className="glass rounded-xl p-3 space-y-1">
              <p className="text-xs text-red-400 font-bold">Enemy Synergies:</p>
              {synergies.enemy.map(s => (
                <div key={s.name} className="text-xs text-red-300 bg-red-900/20 rounded px-2 py-1">
                  ⚡ <strong>{s.name}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
