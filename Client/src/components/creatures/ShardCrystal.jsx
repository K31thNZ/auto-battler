const SHARD_CONFIG = {
  Fire: {
    name: 'Ember Shard', color: '#ef4444', glow: '#fbbf24',
    gradient: [['#fbbf24','0.9'],['#ef4444','0.85'],['#7c2d12','0.95']],
    dark: '#7c2d12', tip: '#991b1b', highlight: '#fbbf24',
    shape: 'tall-pointed',
  },
  Water: {
    name: 'Tide Shard', color: '#3b82f6', glow: '#38bdf8',
    gradient: [['#bae6fd','0.9'],['#3b82f6','0.85'],['#1e3a5f','0.95']],
    dark: '#1e3a5f', tip: '#1e40af', highlight: '#bae6fd',
    shape: 'wide-aqua',
  },
  Wind: {
    name: 'Gale Shard', color: '#10b981', glow: '#34d399',
    gradient: [['#a7f3d0','0.9'],['#10b981','0.85'],['#064e3b','0.95']],
    dark: '#064e3b', tip: '#065f46', highlight: '#6ee7b7',
    shape: 'slender',
  },
  Earth: {
    name: 'Terra Shard', color: '#84cc16', glow: '#bef264',
    gradient: [['#d9f99d','0.9'],['#84cc16','0.85'],['#365314','0.95']],
    dark: '#365314', tip: '#3f6212', highlight: '#bef264',
    shape: 'hexagonal',
  },
  Thunder: {
    name: 'Storm Shard', color: '#eab308', glow: '#fde047',
    gradient: [['#fef08a','0.9'],['#eab308','0.85'],['#713f12','0.95']],
    dark: '#713f12', tip: '#92400e', highlight: '#fef08a',
    shape: 'jagged',
  },
  Ice: {
    name: 'Frost Shard', color: '#67e8f9', glow: '#a5f3fc',
    gradient: [['#fff','0.95'],['#67e8f9','0.85'],['#164e63','0.95']],
    dark: '#164e63', tip: '#0e7490', highlight: '#fff',
    shape: 'snowflake',
  },
  Shadow: {
    name: 'Void Shard', color: '#8b5cf6', glow: '#a78bfa',
    gradient: [['#ddd6fe','0.9'],['#8b5cf6','0.85'],['#2e1065','0.95']],
    dark: '#2e1065', tip: '#4c1d95', highlight: '#ddd6fe',
    shape: 'hexagonal-flat',
  },
  Light: {
    name: 'Radiant Shard', color: '#fbbf24', glow: '#fff',
    gradient: [['#fff','0.95'],['#fbbf24','0.85'],['#92400e','0.9']],
    dark: '#92400e', tip: '#b45309', highlight: '#fff',
    shape: 'brilliant',
  },
  Poison: {
    name: 'Venom Shard', color: '#a855f7', glow: '#c084fc',
    gradient: [['#e9d5ff','0.9'],['#a855f7','0.85'],['#3b0764','0.95']],
    dark: '#3b0764', tip: '#581c87', highlight: '#d8b4fe',
    shape: 'droplet',
  },
  Metal: {
    name: 'Iron Shard', color: '#9ca3af', glow: '#e2e8f0',
    gradient: [['#f1f5f9','0.9'],['#9ca3af','0.85'],['#374151','0.95']],
    dark: '#374151', tip: '#1f2937', highlight: '#fff',
    shape: 'octagon',
  },
  Psychic: {
    name: 'Psyche Shard', color: '#ec4899', glow: '#f9a8d4',
    gradient: [['#fce7f3','0.9'],['#ec4899','0.85'],['#500724','0.95']],
    dark: '#500724', tip: '#831843', highlight: '#fce7f3',
    shape: 'rose-cut',
  },
  Nature: {
    name: 'Bloom Shard', color: '#22c55e', glow: '#86efac',
    gradient: [['#bbf7d0','0.9'],['#22c55e','0.85'],['#14532d','0.95']],
    dark: '#14532d', tip: '#166534', highlight: '#bbf7d0',
    shape: 'leaf',
  },
};

function CrystalShape({ cfg, size, tier = 1 }) {
  const id = `sg-${cfg.color.replace('#','')}`;
  const scale = size / 100;
  const glowRadius = 3 + tier;

  const shapes = {
    'tall-pointed': (
      <>
        <polygon points="0,-52 22,-18 18,28 0,44 -18,28 -22,-18" fill={`url(#${id})`} stroke={cfg.highlight} strokeWidth="0.8" strokeOpacity="0.7"/>
        <polygon points="-22,-18 0,-52 0,0 -18,28" fill={cfg.dark} opacity="0.35"/>
        <polygon points="0,-52 22,-18 4,-24 -4,-38" fill="#fff" opacity="0.25"/>
        <polygon points="0,-30 8,-10 4,16 0,24 -4,16 -8,-10" fill={cfg.highlight} opacity="0.2"/>
        <polygon points="12,-38 22,-18 14,-20" fill="#fff" opacity="0.4"/>
        <polygon points="-18,28 18,28 0,44" fill={cfg.tip} opacity="0.65"/>
      </>
    ),
    'wide-aqua': (
      <>
        <polygon points="0,-48 26,-12 20,30 0,46 -20,30 -26,-12" fill={`url(#${id})`} stroke={cfg.highlight} strokeWidth="0.8" strokeOpacity="0.6"/>
        <polygon points="-26,-12 0,-48 0,4 -20,30" fill={cfg.dark} opacity="0.3"/>
        <polygon points="0,-48 26,-12 6,-18 -4,-36" fill="#fff" opacity="0.28"/>
        <polygon points="0,-28 10,-6 6,18 0,28 -6,18 -10,-6" fill={cfg.highlight} opacity="0.2"/>
        <polygon points="14,-34 26,-12 16,-14" fill="#fff" opacity="0.45"/>
        <polygon points="-20,30 20,30 0,46" fill={cfg.tip} opacity="0.55"/>
      </>
    ),
    'slender': (
      <>
        <polygon points="0,-55 16,-14 12,32 0,48 -12,32 -16,-14" fill={`url(#${id})`} stroke={cfg.highlight} strokeWidth="0.8" strokeOpacity="0.6"/>
        <polygon points="-16,-14 0,-55 0,2 -12,32" fill={cfg.dark} opacity="0.32"/>
        <polygon points="0,-55 16,-14 4,-20 -2,-42" fill="#fff" opacity="0.28"/>
        <polygon points="0,-32 7,-8 4,18 0,28 -4,18 -7,-8" fill={cfg.highlight} opacity="0.22"/>
        <polygon points="9,-40 16,-14 10,-16" fill="#fff" opacity="0.42"/>
        <polygon points="-12,32 12,32 0,48" fill={cfg.tip} opacity="0.6"/>
      </>
    ),
    'hexagonal': (
      <>
        <polygon points="0,-46 26,-10 22,28 0,44 -22,28 -26,-10" fill={`url(#${id})`} stroke={cfg.highlight} strokeWidth="0.8" strokeOpacity="0.5"/>
        <polygon points="0,-46 26,-10 6,-16 -2,-36" fill="#fff" opacity="0.22"/>
        <polygon points="-26,-10 0,-46 0,4 -22,28" fill={cfg.dark} opacity="0.4"/>
        <line x1="-20" y1="0" x2="18" y2="4" stroke={cfg.highlight} strokeWidth="0.7" strokeOpacity="0.3"/>
        <line x1="-16" y1="10" x2="20" y2="14" stroke={cfg.highlight} strokeWidth="0.7" strokeOpacity="0.25"/>
        <polygon points="-22,28 22,28 0,44" fill={cfg.tip} opacity="0.65"/>
      </>
    ),
    'jagged': (
      <>
        <polygon points="0,-50 28,-10 22,26 8,44 -8,44 -22,26 -28,-10" fill={`url(#${id})`} stroke={cfg.highlight} strokeWidth="0.8" strokeOpacity="0.7"/>
        <polygon points="-28,-10 0,-50 0,6 -22,26" fill={cfg.dark} opacity="0.28"/>
        <polygon points="0,-50 28,-10 6,-16 -2,-38" fill="#fff" opacity="0.3"/>
        <polyline points="4,-42 8,-20 2,-14 10,10" fill="none" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.5"/>
        <polygon points="16,-36 28,-10 18,-12" fill="#fff" opacity="0.45"/>
        <polygon points="-22,26 -8,44 8,44 22,26 0,38" fill={cfg.tip} opacity="0.55"/>
      </>
    ),
    'snowflake': (
      <>
        <polygon points="0,-52 14,-20 26,0 14,26 0,44 -14,26 -26,0 -14,-20" fill={`url(#${id})`} stroke="#fff" strokeWidth="0.8" strokeOpacity="0.8"/>
        <polygon points="-26,0 -14,-20 0,-52 0,4 -14,26" fill={cfg.dark} opacity="0.25"/>
        <polygon points="0,-52 14,-20 2,-24 -2,-40" fill="#fff" opacity="0.45"/>
        <line x1="0" y1="-52" x2="0" y2="44" stroke="#fff" strokeWidth="0.8" strokeOpacity="0.18"/>
        <line x1="-26" y1="0" x2="26" y2="0" stroke="#fff" strokeWidth="0.8" strokeOpacity="0.18"/>
        <line x1="-14" y1="-20" x2="14" y2="26" stroke="#fff" strokeWidth="0.6" strokeOpacity="0.12"/>
        <line x1="14" y1="-20" x2="-14" y2="26" stroke="#fff" strokeWidth="0.6" strokeOpacity="0.12"/>
        <polygon points="-14,26 14,26 0,44" fill={cfg.tip} opacity="0.5"/>
      </>
    ),
    'hexagonal-flat': (
      <>
        <polygon points="0,-46 24,-16 24,18 0,40 -24,18 -24,-16" fill={`url(#${id})`} stroke={cfg.highlight} strokeWidth="0.8" strokeOpacity="0.5"/>
        <polygon points="-24,-16 0,-46 0,0 -24,18" fill={cfg.dark} opacity="0.38"/>
        <polygon points="0,-46 24,-16 4,-22 -2,-36" fill="#fff" opacity="0.2"/>
        <circle cx="0" cy="-4" r="5" fill={cfg.dark} opacity="0.6"/>
        <circle cx="0" cy="-4" r="2" fill={cfg.highlight} opacity="0.5"/>
        <polygon points="-24,18 24,18 0,40" fill={cfg.tip} opacity="0.65"/>
      </>
    ),
    'brilliant': (
      <>
        <polygon points="0,-50 20,-18 30,2 20,28 0,44 -20,28 -30,2 -20,-18" fill={`url(#${id})`} stroke="#fff" strokeWidth="0.8" strokeOpacity="0.8"/>
        <polygon points="-30,2 -20,-18 0,-50 0,6 -20,28" fill={cfg.dark} opacity="0.2"/>
        <polygon points="0,-50 20,-18 4,-22 -2,-40" fill="#fff" opacity="0.5"/>
        <polygon points="0,-30 12,-6 10,18 0,30 -10,18 -12,-6" fill="#fff" opacity="0.35"/>
        <line x1="0" y1="-50" x2="0" y2="44" stroke="#fff" strokeWidth="0.6" strokeOpacity="0.15"/>
        <line x1="-30" y1="2" x2="30" y2="2" stroke="#fff" strokeWidth="0.6" strokeOpacity="0.15"/>
        <polygon points="-20,28 20,28 0,44" fill={cfg.tip} opacity="0.45"/>
      </>
    ),
    'rose-cut': (
      <>
        <polygon points="0,-50 22,-14 18,24 0,42 -18,24 -22,-14" fill={`url(#${id})`} stroke={cfg.highlight} strokeWidth="0.8" strokeOpacity="0.6"/>
        <polygon points="-22,-14 0,-50 0,2 -18,24" fill={cfg.dark} opacity="0.3"/>
        <polygon points="0,-50 22,-14 4,-18 -2,-38" fill="#fff" opacity="0.32"/>
        <ellipse cx="0" cy="-6" rx="8" ry="5" fill={cfg.dark} opacity="0.5"/>
        <ellipse cx="0" cy="-6" rx="5" ry="3" fill={cfg.color} opacity="0.8"/>
        <ellipse cx="0" cy="-6" rx="2" ry="1.5" fill="#fff" opacity="0.9"/>
        <polygon points="12,-36 22,-14 12,-16" fill="#fff" opacity="0.4"/>
        <polygon points="-18,24 18,24 0,42" fill={cfg.tip} opacity="0.55"/>
      </>
    ),
    'octagon': (
      <>
        <polygon points="0,-50 18,-22 28,2 18,28 0,44 -18,28 -28,2 -18,-22" fill={`url(#${id})`} stroke="#fff" strokeWidth="0.8" strokeOpacity="0.7"/>
        <polygon points="-28,2 -18,-22 0,-50 0,8 -18,28" fill={cfg.dark} opacity="0.32"/>
        <polygon points="0,-50 18,-22 4,-26 -2,-40" fill="#fff" opacity="0.55"/>
        <polygon points="0,-30 12,-4 10,18 0,30 -10,18 -12,-4" fill="#e2e8f0" opacity="0.25"/>
        <polygon points="-18,28 18,28 0,44" fill={cfg.tip} opacity="0.55"/>
      </>
    ),
    'droplet': (
      <>
        <path d="M0,-52 Q22,0 14,28 Q0,46 -14,28 Q-22,0 0,-52Z" fill={`url(#${id})`} stroke={cfg.highlight} strokeWidth="0.8" strokeOpacity="0.6"/>
        <path d="M0,-52 Q8,0 6,24 Q0,40 0,-52Z" fill={cfg.dark} opacity="0.25"/>
        <path d="M0,-52 Q10,-20 8,-8" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.35" strokeLinecap="round"/>
        <circle cx="0" cy="0" r="6" fill={cfg.highlight} opacity="0.2"/>
      </>
    ),
    'leaf': (
      <>
        <polygon points="0,-50 18,-16 14,28 0,46 -14,28 -18,-16" fill={`url(#${id})`} stroke={cfg.highlight} strokeWidth="0.8" strokeOpacity="0.6"/>
        <polygon points="-18,-16 0,-50 0,4 -14,28" fill={cfg.dark} opacity="0.35"/>
        <polygon points="0,-50 18,-16 4,-20 -2,-38" fill="#fff" opacity="0.3"/>
        <path d="M0,-30 Q4,0 0,30" fill="none" stroke={cfg.highlight} strokeWidth="0.8" strokeOpacity="0.4"/>
        <path d="M0,-10 Q-6,4 -10,14" fill="none" stroke={cfg.highlight} strokeWidth="0.6" strokeOpacity="0.3"/>
        <path d="M0,-10 Q6,4 10,14" fill="none" stroke={cfg.highlight} strokeWidth="0.6" strokeOpacity="0.3"/>
        <polygon points="-14,28 14,28 0,46" fill={cfg.tip} opacity="0.6"/>
      </>
    ),
  };

  return (
    <svg
      viewBox="-40 -70 80 130"
      width={size}
      height={size}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {cfg.gradient.map(([c, o], i) => (
            <stop key={i} offset={`${i * 50}%`} stopColor={c} stopOpacity={o} />
          ))}
        </linearGradient>
        <filter id={`glow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={glowRadius} result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* ambient glow halo */}
      <ellipse cx="0" cy="30" rx="26" ry="9" fill={cfg.color} opacity={0.12 + tier * 0.04}/>
      <g filter={`url(#glow-${id})`}>
        {shapes[cfg.shape] || shapes['tall-pointed']}
      </g>
    </svg>
  );
}

export default function ShardCrystal({ type, size = 64, tier = 1, quantity, animated = true, className = '' }) {
  const cfg = SHARD_CONFIG[type] || SHARD_CONFIG.Fire;

  return (
    <div
      className={`shard-crystal inline-block ${animated ? 'shard-idle' : ''} ${className}`}
      style={{ width: size, height: size }}
      title={`${cfg.name}${quantity ? ` ×${quantity}` : ''}`}
    >
      <CrystalShape cfg={cfg} size={size} tier={tier} />
    </div>
  );
}

export { SHARD_CONFIG };
