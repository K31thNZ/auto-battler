import { TYPE_COLORS, RARITY_COLORS, TIER_NAMES, XP_NEEDED } from '../../store/gameStore';

function TypeBadge({ type }) {
  if (!type) return null;
  return (
    <span className={`type-${type} text-xs px-2 py-0.5 rounded-full border font-medium`}>
      {type}
    </span>
  );
}

function StatBar({ label, value, max = 220, color = '#7c3aed' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500 w-8 shrink-0">{label}</span>
      <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full stat-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-slate-400 w-6 text-right">{value}</span>
    </div>
  );
}

export default function CreatureCard({
  creature, playerCreature, selected, onSelect, onEvolve, onTeamToggle, compact = false, showTeamBtn = false
}) {
  const name = creature?.name || playerCreature?.creature_name;
  const type1 = creature?.type1 || playerCreature?.type1;
  const type2 = creature?.type2 || playerCreature?.type2;
  const tier = creature?.tier || playerCreature?.tier;
  const rarity = creature?.rarity || playerCreature?.rarity;
  const atk = playerCreature?.atk || creature?.base_atk;
  const def = playerCreature?.def || creature?.base_def;
  const spd = playerCreature?.spd || creature?.base_spd;
  const hp = playerCreature?.max_hp || creature?.base_hp;
  const level = playerCreature?.level || 1;
  const xp = playerCreature?.xp || 0;
  const xpNeeded = XP_NEEDED(level);
  const xpPct = Math.min(100, Math.round((xp / xpNeeded) * 100));
  const inTeam = playerCreature?.in_team;
  const primaryColor = TYPE_COLORS[type1] || '#7c3aed';
  const rarityColor = RARITY_COLORS[rarity] || '#6b7280';
  const canEvolve = playerCreature && (
    (tier === 1 && level >= 10) ||
    (tier === 2 && level >= 25)
  ) && (creature?.evolves_to_a || playerCreature?.evolves_to_a);

  return (
    <div
      className={`glass rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 rarity-${rarity}
        ${selected ? 'ring-2 ring-purple-500 glow-purple' : ''}
        ${inTeam ? 'ring-1 ring-teal-500' : ''}
        border-t-4`}
      style={{ borderTopColor: primaryColor }}
      onClick={() => onSelect?.({ creature, playerCreature })}
    >
      {/* Creature visual */}
      <div className="relative h-24 flex items-center justify-center overflow-hidden"
        style={{ background: `radial-gradient(ellipse at center, ${primaryColor}22 0%, transparent 70%)` }}>
        <div className="text-6xl select-none" style={{ filter: `drop-shadow(0 0 12px ${primaryColor}88)` }}>
          {getCreatureEmoji(name, type1, tier)}
        </div>
        {tier >= 4 && (
          <div className="absolute inset-0 legendary-shimmer pointer-events-none" />
        )}
        <div className="absolute top-1 right-1">
          <span className="text-xs px-1.5 py-0.5 rounded font-bold"
            style={{ color: rarityColor, background: `${rarityColor}22`, border: `1px solid ${rarityColor}44` }}>
            {TIER_NAMES[tier] || `T${tier}`}
          </span>
        </div>
        {inTeam && (
          <div className="absolute top-1 left-1 text-xs bg-teal-500/30 text-teal-300 border border-teal-500/50 px-1.5 py-0.5 rounded">
            Team
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-bold text-sm leading-tight">{name}</h3>
          {playerCreature && <span className="text-xs text-slate-500 shrink-0">Lv.{level}</span>}
        </div>

        <div className="flex gap-1 flex-wrap">
          <TypeBadge type={type1} />
          {type2 && <TypeBadge type={type2} />}
        </div>

        {!compact && (
          <div className="space-y-1">
            <StatBar label="ATK" value={atk} color="#ef4444" />
            <StatBar label="DEF" value={def} color="#3b82f6" />
            <StatBar label="SPD" value={spd} color="#10b981" />
            <StatBar label="HP"  value={hp}  color="#fbbf24" max={400} />
          </div>
        )}

        {playerCreature && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-0.5">
              <span>XP</span><span>{xp}/{xpNeeded}</span>
            </div>
            <div className="bg-white/10 rounded-full h-1 overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full xp-bar" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        )}

        <div className="flex gap-1 flex-wrap pt-1">
          {showTeamBtn && playerCreature && onTeamToggle && (
            <button
              className={`flex-1 text-xs py-1 px-2 rounded-lg font-medium transition-colors
                ${inTeam
                  ? 'bg-teal-600/30 text-teal-300 border border-teal-600/50 hover:bg-red-600/20 hover:text-red-300'
                  : 'bg-purple-600/30 text-purple-300 border border-purple-600/50 hover:bg-purple-600/50'
                }`}
              onClick={(e) => { e.stopPropagation(); onTeamToggle(playerCreature); }}
            >
              {inTeam ? '– Remove' : '+ Team'}
            </button>
          )}
          {canEvolve && onEvolve && (
            <button
              className="flex-1 text-xs py-1 px-2 rounded-lg font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/40 transition-colors"
              onClick={(e) => { e.stopPropagation(); onEvolve(playerCreature); }}
            >
              ✨ Evolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getCreatureEmoji(name, type1, tier) {
  const emojiMap = {
    Emberpup: '🔥', Aquafin: '🐟', Galesprout: '🌿', Stoneback: '🪨',
    Voltkit: '⚡', Frostling: '❄️', Shadowpup: '👾', Glimlet: '✨',
    Infernog: '🐺', Torrentail: '🐉', Cyclomane: '🌀', Ramrock: '🗿',
    Blazehorn: '🦬', Cinderfox: '🦊', Tidalwyrm: '🐉', Mistshade: '👻',
    Zephyrax: '🦅', Poisonmaw: '🌺', Psyclaw: '🔮', Ironfang: '⚙️',
    'Infernus Rex': '🌋', Abyssalord: '🌊', Stormbinder: '⛈️', Voidmind: '🌑',
    Primordius: '🌟',
  };
  if (emojiMap[name]) return emojiMap[name];
  const typeEmoji = { Fire:'🔥', Water:'💧', Wind:'💨', Earth:'⛰️', Thunder:'⚡', Ice:'🧊', Shadow:'🌑', Light:'☀️', Poison:'☠️', Metal:'⚙️', Psychic:'🔮', Nature:'🌿' };
  return typeEmoji[type1] || '🐾';
}
