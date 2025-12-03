import { supabase } from '@/lib/supabaseClient';

const tableMap = {
  Event: 'events',
  PlayerStatus: 'player_statuses',
  User: 'profiles',
  Squad: 'squads',
  SquadMember: 'squad_members',
  VoiceNet: 'voice_nets',
  Channel: 'channels',
  Message: 'messages',
  CofferTransaction: 'coffer_transactions',
  FleetAsset: 'fleet_assets',
  AIAgentLog: 'ai_agent_logs',
  AIAgentRule: 'ai_agent_rules',
  AIAgent: 'ai_agents',
  Coffer: 'coffers',
  ArmoryItem: 'armory_items',
  Mission: 'missions',
};

const normalizeFilter = (options) => {
  if (!options || typeof options !== 'object') return undefined;
  const { filter, limit, sort } = options;
  if (filter || limit || sort) return filter;
  return options;
};

const applyFilter = (query, filter) => {
  if (!filter) return query;
  Object.entries(filter).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  });
  return query;
};

const applySort = (query, sort) => {
  if (!sort) return query;
  Object.entries(sort).forEach(([key, direction]) => {
    const ascending = direction === 1 || direction === 'asc' || direction === true;
    query = query.order(key, { ascending });
  });
  return query;
};

const createEntityClient = (table) => ({
  list: async (options = {}) => {
    if (!supabase) return [];
    const { limit, sort } = options;
    const filter = normalizeFilter(options);
    let query = supabase.from(table).select('*');
    query = applyFilter(query, filter);
    query = applySort(query, sort);
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) {
      console.error(`Supabase list error on ${table}:`, error.message);
      return [];
    }
    return data ?? [];
  },
  get: async (id) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    if (error) {
      console.error(`Supabase get error on ${table}:`, error.message);
      return null;
    }
    return data;
  },
  create: async (payload) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).insert(payload).select().maybeSingle();
    if (error) {
      console.error(`Supabase create error on ${table}:`, error.message);
      return null;
    }
    return data;
  },
  update: async (id, payload) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().maybeSingle();
    if (error) {
      console.error(`Supabase update error on ${table}:`, error.message);
      return null;
    }
    return data;
  },
  delete: async (id) => {
    if (!supabase) return false;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.error(`Supabase delete error on ${table}:`, error.message);
      return false;
    }
    return true;
  },
});

const entities = Object.fromEntries(
  Object.entries(tableMap).map(([entity, table]) => [entity, createEntityClient(table)])
);

export const supabaseApi = {
  auth: {
    me: async () => {
      if (!supabase) return null;
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  },
  entities,
  functions: {
    invoke: async (functionName, payload) => {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase.functions.invoke(functionName, { body: payload });
    },
  },
};

export default supabaseApi;
