import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, TYPE_COLORS } from '../store/gameStore';
import { api } from '../lib/api';

const DIFFICULTIES = [
  { key: 'easy',      label: 'Easy',      color: '#22c55e', desc: 'Tier 1–2 enemies' },
  { key: 'medium',    label: 'Medium',    color: '#f97316', desc: 'Tier 2–3 enemies' },
  { key: 'hard',      label: 'Hard',      color: '#ef4444', desc: 'Tier 3–4 enemies' },
  { key: 'legendary', label: 'Legendary', color: '#fbbf24', desc: 'Tier 4–5 enemies' },
];

function StatusIcon({ type }) {
  const icons = { burn: '🔥', stun: '💫', paralyze: '⚡', silence: '🔇' };
  return <span title={type} className="text-sm">{icons[type] || '❓'}</span>;
}

function CombatantPanel({ combatant, side }) {
  if (!combatant) return <div className="glass rounded-xl p-3 opacity-30 text-center text-sm text-slate-500">—</div>;
  const hpPct = Math.max(0, Math.min(100, (combatant.hp / combatant.maxHp) * 100));
  const energyPct = Math.min(100, combatant.energy || 0);
  const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f97316' : '#ef4444';
  const typeColor = TYPE_COLORS[combatant.type1] || '#7c3aed';
  const isDead = combatant.hp <= 0;

  return (
    <div className={`glass rounded-xl p-3 border-t-2 transition-all duration-300 ${isDead ? 'opacity-40 grayscale' : ''}`}
      style={{ borderTopColor: typeColor }}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-sm">{combatant.name}</span>
        <div className="flex gap-1">
          {(combatant.statusEffects || []).map((e, i) => <StatusIcon key={i} type={e.type} />)}
        </div>
      </div>
      <div className="flex gap-1 mb-2">
        <span className={`type-${combatant.type1} text-xs px-1.5 py-0.5 rounded-full border`}>{combatant.type1}</span>
        {combatant.type2 && <span className={`type-${combatant.type2} text-xs px-1.5 py-0.5 rounded-full border`}>{combatant.type2}</span>}
      </div>
      {/* HP bar */}
      <div className="mb-1">
        <div className="flex justify-between text-xs text-slate-400 mb-0.5">
          <span>HP</span><span>{combatant.hp}/{combatant.maxHp}</span>
        </div>
        <div className="bg-white/10 rounded-full h-2 overflow-hidden">
          <div className="h-full rounded-full hp-bar" style={{ width: `${hpPct}%`, background: hpColor }} />
        </div>
      </div>
      {/* Energy bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-0.5">
          <span>Energy</span><span>{Math.round(energyPct)}/100</span>
        </div>
        <div className="bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div className="h-full rounded-full energy-bar" style={{ width: `${energyPct}%`, background: '#7c3aed' }} />
        </div>
      </div>
      {combatant.shield > 0 && (
        <div className="mt-1 text-xs text-blue-300">🛡 Shield: {combatant.shield}</div>
      )}
    </div>
  );
}

export default function Battle() {
  const { collection, loadCollection, refreshPlayer } = useGameStore();
  const [difficulty, setDifficulty] = useState('medium');
  const [battleState, setBattleState] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentLog, setCurrentLog] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [displayTeams, setDisplayTeams] = useState(null);
  const [synergies, setSynergies] = useState(null);
  const logRef = useRef(null);
  const animRef = useRef(null);
  const speedRef = useRef(600);
  const [speed, setSpeed] = useState(600);

  useEffect(() => { loadCollection(); }, []);

  const team = collection.filter(c => c.in_team).sort((a, b) => a.team_slot - b.team_slot);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [currentLog]);

  const startBattle = async () => {
    if (team.length === 0) return;
    setIsRunning(true);
    setBattleState(null);
    setCurrentLog([]);
    setCurrentTurn(0);

    try {
      const result = await api.startBattle(difficulty);
      setBattleState(result);
      setSynergies(result.synergies);

      // Set initial display state
      const initDisplay = {
        playerTeam: result.playerTeam.map(t => ({
          ...t, hp: result.log.find(l => l.hpSnapshot)?.hpSnapshot?.playerTeam?.find(c => c.id === t.id) || { hp: 999, maxHp: 999, energy: 0, statusEffects: [] }
        })),
        enemyTeam: result.enemyTeam.map(t => ({
          ...t, hp: 999, maxHp: 999, energy: 0, statusEffects: []
        }))
      };

      // Animate log entries
      let i = 0;
      const animate = () => {
        if (i >= result.log.length) {
          setDisplayTeams({
            playerTeam: result.finalState.playerTeam,
            enemyTeam: result.finalState.enemyTeam
          });
          setIsRunning(false);
          refreshPlayer();
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
      setDisplayTeams({
        playerTeam: battleState.finalState.playerTeam,
        enemyTeam: battleState.finalState.enemyTeam
      });
      setIsRunning(false);
      refreshPlayer();
    }
  };

  const handleSpeedChange = (val) => {
    setSpeed(val);
    speedRef.current = val;
  };

  const logColor = {
    attack: 'text-slate-300', skill: 'text-amber-300', faint: 'text-red-400',
    status: 'text-purple-300', synergy: 'text-teal-300', shield: 'text-blue-300', error: 'text-red-500'
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-purple-300 mb-1">⚔️ Battle Arena</h1>
        <p className="text-slate-400">Your team fights automatically — strategy is in the preparation</p>
      </div>

      {/* Difficulty selector */}
      <div className="glass rounded-xl p-4 mb-5">
        <p className="text-sm text-slate-400 mb-3">Select Difficulty:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.key}
              onClick={() => setDifficulty(d.key)}
              className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all
                ${difficulty === d.key ? 'ring-2' : 'opacity-60 hover:opacity-80'}`}
              style={{
                borderColor: `${d.color}66`,
                background: difficulty === d.key ? `${d.color}22` : 'transparent',
                color: d.color,
                ringColor: d.color,
                boxShadow: difficulty === d.key ? `0 0 15px ${d.color}33` : 'none'
              }}
            >
              <div>{d.label}</div>
              <div className="text-xs opacity-70 font-normal">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Team warning */}
      {team.length === 0 && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 mb-5 text-red-300 text-sm">
          ⚠️ No team selected! Go to <strong>Collection</strong> and add up to 3 creatures to your team.
        </div>
      )}

      {/* Battle layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Player team */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider">Your Team</h2>
          {team.length > 0 ? team.map((pc, i) => {
            const disp = displayTeams?.playerTeam?.find(c => c.id === pc.id);
            const combatant = disp
              ? { ...pc, name: pc.creature_name, hp: disp.hp, maxHp: disp.maxHp, energy: disp.energy, shield: disp.shield || 0, statusEffects: disp.statusEffects || [] }
              : { ...pc, name: pc.creature_name, hp: pc.current_hp || pc.max_hp, maxHp: pc.max_hp, energy: 0, shield: 0, statusEffects: [] };
            return <CombatantPanel key={pc.id} combatant={combatant} side="player" />;
          }) : (
            <div className="glass rounded-xl p-6 text-center text-slate-500 text-sm">No team set</div>
          )}

          {/* Synergies */}
          {synergies?.player?.length > 0 && (
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-teal-400 font-bold mb-1">Active Synergies:</p>
              {synergies.player.map(s => (
                <div key={s.name} className="text-xs text-teal-300 bg-teal-900/20 rounded px-2 py-1 mb-1">
                  ⚡ <strong>{s.name}</strong> — {s.description}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Combat log + controls */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={startBattle}
              disabled={isRunning || team.length === 0}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#0d9488)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
            >
              {isRunning ? '⚔️ Battle in progress...' : '⚔️ Start Battle'}
            </button>
            {isRunning && (
              <button onClick={skipAnimation}
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-slate-300 hover:bg-white/20">
                Skip »
              </button>
            )}
          </div>

          {/* Speed control */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Speed:</span>
            {[1200, 600, 200].map(s => (
              <button key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-2 py-1 rounded ${speed === s ? 'bg-purple-600/30 text-purple-300' : 'bg-white/5 hover:bg-white/10'}`}>
                {s === 1200 ? 'Slow' : s === 600 ? 'Normal' : 'Fast'}
              </button>
            ))}
          </div>

          {/* Combat log */}
          <div
            ref={logRef}
            className="glass rounded-xl p-3 h-64 overflow-y-auto combat-log space-y-0.5 text-xs"
          >
            {currentLog.length === 0 ? (
              <p className="text-slate-600 text-center mt-8">Battle log will appear here...</p>
            ) : currentLog.map((entry, i) => (
              <p key={i} className={`${logColor[entry.type] || 'text-slate-400'} py-0.5 border-b border-white/5`}>
                {entry.msg}
              </p>
            ))}
          </div>

          {/* Result */}
          {battleState && !isRunning && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`rounded-xl p-4 text-center border
                ${battleState.result === 'win'
                  ? 'bg-teal-900/40 border-teal-500/40'
                  : 'bg-red-900/40 border-red-500/40'}`}
            >
              <div className="text-3xl mb-1">{battleState.result === 'win' ? '🏆' : '💀'}</div>
              <p className={`font-bold text-lg ${battleState.result === 'win' ? 'text-teal-300' : 'text-red-300'}`}>
                {battleState.result === 'win' ? 'Victory!' : 'Defeated!'}
              </p>
              <div className="text-sm text-slate-400 mt-1 space-y-0.5">
                <p>+{battleState.xpGained} XP per creature</p>
                {battleState.shardsGained > 0 && <p className="text-amber-400">+{battleState.shardsGained} 💎 Shards</p>}
                {battleState.lootCreature && (
                  <p className="text-purple-300">🎁 Found: <strong>{battleState.lootCreature.name}</strong>!</p>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Enemy team */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">Enemy Team</h2>
          {battleState ? (
            battleState.enemyTeam.map((et) => {
              const disp = displayTeams?.enemyTeam?.find(c => c.id === et.id);
              const combatant = disp
                ? { ...et, hp: disp.hp, maxHp: disp.maxHp, energy: disp.energy, shield: disp.shield || 0, statusEffects: disp.statusEffects || [] }
                : { ...et, hp: et.base_hp || 100, maxHp: et.base_hp || 100, energy: 0, shield: 0, statusEffects: [] };
              return <CombatantPanel key={et.id} combatant={combatant} side="enemy" />;
            })
          ) : (
            <div className="glass rounded-xl p-6 text-center text-slate-500 text-sm">
              Enemy team revealed when battle starts
            </div>
          )}

          {synergies?.enemy?.length > 0 && (
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-red-400 font-bold mb-1">Enemy Synergies:</p>
              {synergies.enemy.map(s => (
                <div key={s.name} className="text-xs text-red-300 bg-red-900/20 rounded px-2 py-1 mb-1">
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
