import { supabase } from '@/lib/supabase';

const tableMap = {
  Event: 'events',
  Squad: 'squads',
  SquadMember: 'squad_members',
  PlayerStatus: 'player_status',
  Channel: 'channels',
  Message: 'messages',
  VoiceNet: 'voice_nets',
  Coffer: 'coffers',
  CofferTransaction: 'coffer_transactions',
  AIAgent: 'ai_agents',
  AIAgentLog: 'ai_agent_logs',
  AIAgentRule: 'ai_agent_rules',
  ArmoryItem: 'armory_items',
  Role: 'roles',
  FleetAsset: 'fleet_assets',
  Mission: 'missions',
  User: 'profiles'
};

const applyFilters = (query, params) => {
  const filter = params?.filter ?? params;
  if (filter && typeof filter === 'object') {
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
  }
  return query;
};

const applySort = (query, params) => {
  const sort = params?.sort;
  if (sort && typeof sort === 'object') {
    const [[column, direction]] = Object.entries(sort);
    query = query.order(column, { ascending: direction === 1 });
  }
  return query;
};

const createEntityClient = (tableName) => ({
  list: async (params = {}, limitOverride) => {
    if (!supabase) return [];
    let query = supabase.from(tableName).select('*');
    query = applyFilters(query, params);
    query = applySort(query, params);
    const limit = params?.limit ?? limitOverride;
    if (limit) {
      query = query.limit(limit);
    }
    const { data, error } = await query;
    if (error) {
      console.error(`Error listing from ${tableName}`, error);
      return [];
    }
    return data || [];
  },
  get: async (id) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).maybeSingle();
    if (error) {
      console.error(`Error fetching ${tableName} record`, error);
      return null;
    }
    return data;
  },
  create: async (payload) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from(tableName).insert(payload).select().maybeSingle();
    if (error) {
      console.error(`Error creating ${tableName} record`, error);
      return null;
    }
    return data;
  },
  update: async (id, payload) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from(tableName).update(payload).eq('id', id).select().maybeSingle();
    if (error) {
      console.error(`Error updating ${tableName} record`, error);
      return null;
    }
    return data;
  },
  delete: async (id) => {
    if (!supabase) return false;
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
      console.error(`Error deleting from ${tableName}`, error);
      return false;
    }
    return true;
  }
});

const entities = Object.fromEntries(
  Object.entries(tableMap).map(([key, table]) => [key, createEntityClient(table)])
);

export const dataClient = {
  auth: {
    me: async () => {
      if (!supabase) return null;
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching current user', error);
        return null;
      }
      return data?.user || null;
    }
  },
  entities,
  functions: {
    invoke: async (fnName, payload) => {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      const { data, error } = await supabase.functions.invoke(fnName, { body: payload });
      if (error) {
        console.error(`Error invoking function ${fnName}`, error);
      }
      return { data, error };
    }
  }
};

export default dataClient;
