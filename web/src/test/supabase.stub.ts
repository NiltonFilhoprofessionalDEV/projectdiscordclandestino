const chain = {
  select() {
    return chain;
  },
  insert() {
    return chain;
  },
  eq() {
    return chain;
  },
  is() {
    return chain;
  },
  order() {
    return chain;
  },
  limit() {
    return chain;
  },
  or() {
    return chain;
  },
  in() {
    return chain;
  },
  async single() {
    return { data: null, error: { message: "stub" } };
  },
  async maybeSingle() {
    return { data: null, error: null };
  },
  then(resolve: (value: { data: null; error: null }) => unknown) {
    return Promise.resolve({ data: null, error: null }).then(resolve);
  },
};

export const supabase = {
  from() {
    return chain;
  },
  channel() {
    return { on: () => ({ subscribe: () => ({}) }) };
  },
  removeChannel() {
    return undefined;
  },
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
    signOut: async () => ({ error: null }),
  },
};
