// Temporary stub to prevent build failures after legacy removal.
// Replace usages with Supabase calls; this stub returns empty results.
export const base44 = {
  auth: {
    me: async () => null,
    login: async () => ({}),
    register: async () => ({}),
  },
  entities: new Proxy({}, {
    get: () => ({
      list: async () => [],
      get: async () => null,
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    })
  }),
  functions: {
    invoke: async () => ({}),
  },
  post: async () => ({}),
};
