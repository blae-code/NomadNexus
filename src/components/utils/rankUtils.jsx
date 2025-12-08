export const RANK_COLORS = {
  'pioneer': { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'shadow-red-500/50' },
  'founder': { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-amber-500/50' },
  'voyager': { text: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/30', glow: 'shadow-teal-500/50' },
  'scout': { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: 'shadow-orange-500/50' },
  'vagrant': { text: 'text-emerald-600', bg: 'bg-emerald-600/10', border: 'border-emerald-600/30', glow: 'shadow-emerald-600/50' },
  'affiliate': { text: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30', glow: 'shadow-purple-500/50' },
  'guest': { text: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', glow: 'shadow-zinc-500/50' }
};

export function getRankColorClass(rank, type = 'text') {
  const normalizedRank = rank?.toLowerCase?.() || 'guest';
  const config = RANK_COLORS[normalizedRank] || RANK_COLORS['guest'];
  return config[type] || config.text;
}