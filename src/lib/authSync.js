import { supabase } from '@/lib/supabase';

export const syntheticEmailFromCallsign = (callsign = '') =>
  `${(callsign || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'operative'}@redscar.local`;

export const extractDiscordIdentity = (user) => {
  if (!user) return {};
  const identity = Array.isArray(user.identities)
    ? user.identities.find((i) => i.provider === 'discord')
    : null;
  const identityData = identity?.identity_data || {};
  const discordId = identityData.user_id || user.user_metadata?.provider_id || user.user_metadata?.sub;
  const avatar_url = identityData.avatar_url || user.user_metadata?.avatar_url || null;
  const username =
    identityData.global_name ||
    identityData.username ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email;
  return { discordId, avatar_url, username };
};

export const syncProfileFromSession = async (session) => {
  try {
    if (!session?.user || !supabase) return;
    const user = session.user;
    const callsign =
      user.user_metadata?.callsign ||
      user.email?.split('@')[0] ||
      'Operative';
    const { discordId, avatar_url, username } = extractDiscordIdentity(user);

    await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          callsign,
          discord_id: discordId || null,
          avatar_url: avatar_url || null,
        },
        { onConflict: 'id' }
      );

    if (discordId) {
      await supabase.functions.invoke('discord-sync', {
        body: { discordId, userId: user.id, username },
      });
    }
  } catch (err) {
    console.error('Profile sync failed', err);
  }
};
