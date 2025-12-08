import { supabase } from '@/lib/supabase';

/**
 * Discord Rank Mapping Utilities
 * Manages the mapping between NomadNexus ranks and Discord role IDs
 */

/**
 * Get the Discord role ID for a given rank
 */
export async function getDiscordRoleIdForRank(rank) {
  if (!supabase || !rank) return null;
  
  const { data, error } = await supabase
    .from('discord_rank_mapping')
    .select('discord_role_id')
    .eq('rank', rank)
    .maybeSingle();
  
  if (error) {
    console.error('Failed to fetch Discord role ID for rank:', error);
    return null;
  }
  
  return data?.discord_role_id || null;
}

/**
 * Get the NomadNexus rank for a given Discord role ID
 */
export async function getRankForDiscordRoleId(discordRoleId) {
  if (!supabase || !discordRoleId) return null;
  
  const { data, error } = await supabase
    .from('discord_rank_mapping')
    .select('rank')
    .eq('discord_role_id', discordRoleId)
    .maybeSingle();
  
  if (error) {
    console.error('Failed to fetch rank for Discord role ID:', error);
    return null;
  }
  
  return data?.rank || null;
}

/**
 * Get all Discord rank mappings
 */
export async function getAllDiscordRankMappings(): Promise<Array<{ rank: string; discord_role_id: string }>> {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('discord_rank_mapping')
    .select('*')
    .order('rank', { ascending: true });
  
  if (error) {
    console.error('Failed to fetch Discord rank mappings:', error);
    return [];
  }
  
  return (data as Array<{ rank: string; discord_role_id: string }>) || [];
}

/**
 * Update a Discord rank mapping
 * @param {string} rank - The NomadNexus rank
 * @param {string} discordRoleId - The Discord role ID (snowflake)
 */
export async function updateDiscordRankMapping(rank, discordRoleId) {
  if (!supabase || !rank || !discordRoleId) return null;
  
  const { data, error } = await supabase
    .from('discord_rank_mapping')
    .upsert({
      rank,
      discord_role_id: discordRoleId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'rank' })
    .select()
    .maybeSingle();
  
  if (error) {
    console.error('Failed to update Discord rank mapping:', error);
    return null;
  }
  
  return data;
}

/**
 * Sync user's rank based on their Discord roles
 * Called after Discord OAuth login to set user's rank from Discord roles
 */
export async function syncUserRankFromDiscord(userId, discordRoleIds = []) {
  if (!supabase || !userId || discordRoleIds.length === 0) return null;
  
  // Get all mappings to find which rank the user should have
  const mappings = await getAllDiscordRankMappings();
  
  // Find the highest rank the user has (pioneer > founder > voyager > scout > vagrant)
  const rankHierarchy = ['pioneer', 'founder', 'voyager', 'scout', 'vagrant'];
  let userRank = 'vagrant'; // Default to Vagrant
  
  for (const mapping of mappings) {
    if (discordRoleIds.includes(mapping.discord_role_id)) {
      const rankIndex = rankHierarchy.indexOf(mapping.rank);
      const currentIndex = rankHierarchy.indexOf(userRank);
      if (rankIndex < currentIndex) {
        userRank = mapping.rank;
      }
    }
  }
  
  // Update user's profile with the synced rank
  const { data, error } = await supabase
    .from('profiles')
    .update({
      rank: userRank,
      discord_rank: discordRoleIds[0] || null, // Store primary Discord role
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .maybeSingle();
  
  if (error) {
    console.error('Failed to sync user rank from Discord:', error);
    return null;
  }
  
  return data;
}

/**
 * Get user's current rank and Discord role ID
 */
export async function getUserRankInfo(userId) {
  if (!supabase || !userId) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('rank, discord_rank, discord_id')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Failed to fetch user rank info:', error);
    return null;
  }
  
  return data;
}
