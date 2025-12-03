import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = Deno.env.get('PROJECT_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN') ?? '';
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID') ?? '';

const supabase = PROJECT_URL && SERVICE_ROLE_KEY ? createClient(PROJECT_URL, SERVICE_ROLE_KEY) : null;

type RankMap = { [roleId: string]: string };

// Map Discord role IDs to Redscar ranks
const ROLE_TO_RANK: RankMap = {
  // '123456789012345678': 'Pioneer',
  // '234567890123456789': 'Voyager',
};

const mapRolesToRank = (roleIds: string[]): string | null => {
  for (const rid of roleIds) {
    if (ROLE_TO_RANK[rid]) return ROLE_TO_RANK[rid];
  }
  return null;
};

const fetchMemberRoles = async (discordId: string) => {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) return [];
  const res = await fetch(`https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${discordId}`, {
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    },
  });
  if (res.status === 404 || res.status === 401) return [];
  if (!res.ok) throw new Error(`Discord fetch failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.roles) ? data.roles : [];
};

export default async function handler(req: Request): Promise<Response> {
  if (!supabase) {
    return new Response('Server misconfigured', { status: 500 });
  }

  try {
    const { discordId, userId } = await req.json();
    if (!discordId || !userId) {
      return new Response(JSON.stringify({ error: 'discordId and userId required' }), { status: 400 });
    }

    let roles: string[] = [];
    try {
      roles = await fetchMemberRoles(discordId);
    } catch (err) {
      console.error('Failed to fetch Discord roles', err);
    }

    const mappedRank = roles.length ? mapRolesToRank(roles) : null;
    const effectiveRank = mappedRank ?? 'vagrant';

    await supabase
      .from('profiles')
      .update({
        discord_id: discordId,
        rank: effectiveRank,
        is_guest: false,
      })
      .eq('id', userId);

    return new Response(JSON.stringify({ ok: true, roles, rank: effectiveRank }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('discord-sync failed', err);
    return new Response(JSON.stringify({ error: 'discord-sync failed' }), { status: 500 });
  }
}

serve(handler);
