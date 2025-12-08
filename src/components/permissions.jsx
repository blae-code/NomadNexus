/**
 * Redscar Permissions Logic
 * Rank Hierarchy: pioneer > founder > voyager > scout > vagrant
 */

const RANK_VALUES = {
  'pioneer': 6,
  'founder': 5,
  'voyager': 4,
  'scout': 3,
  'affiliate': 2, // Assigned arbitrary value, but handling explicitly below
  'vagrant': 1
};

export function getUserRankValue(rank) {
  return RANK_VALUES[rank?.toLowerCase?.()] || 0;
}

export function hasMinRank(user, minRank) {
  if (!user || !user.rank) return false;
  if (!minRank) return true;
  return getUserRankValue(user.rank) >= getUserRankValue(minRank);
}

export function hasRole(user, roleTag) {
  if (!user || !user.role_tags) return false;
  return user.role_tags.includes(roleTag);
}

// Focused Voice: scout, voyager, founder, affiliate, pioneer
export function canAccessFocusedVoice(user) {
  if (!user || !user.rank) return false;
  const allowedRanks = ['scout', 'voyager', 'founder', 'pioneer', 'affiliate'];
  return allowedRanks.includes(user.rank?.toLowerCase?.());
}

// Edit Armory/Coffer: pioneer, Shaman
export function canEditResources(user) {
  if (!user) return false;
  if (user.rank?.toLowerCase?.() === 'pioneer') return true;
  if (user.is_shaman) return true;
  return false;
}

export function canAccessChannel(user, channel) {
  if (!user) return false;
  
  // Rank check
  if (channel.access_min_rank && !hasMinRank(user, channel.access_min_rank)) {
    return false;
  }

  // Role check (if allowed_role_tags is present and not empty)
  if (channel.allowed_role_tags && channel.allowed_role_tags.length > 0) {
    const hasTag = channel.allowed_role_tags.some(tag => hasRole(user, tag));
    if (!hasTag) return false;
  }

  return true;
}

export function canPostInChannel(user, channel) {
  if (!canAccessChannel(user, channel)) return false;
  if (channel.is_read_only) {
    // Read-only: only voyager and above can post
    return hasMinRank(user, 'voyager');
  }
  return true;
}

export function canCreateEvent(user) {
  // Only scout and above can create events
  return hasMinRank(user, 'scout');
}

export function canEditEvent(user, event) {
  if (!user) return false;
  // Creator always can
  if (event.created_by === user.id) return true;
  // Founder and above always can
  if (hasMinRank(user, 'founder')) return true;
  return false;
}