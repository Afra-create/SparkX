const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const tempStorage = new Map<string, string>();

function createQuery(table: string) {
  let _eq: Record<string, any> = {};
  let _ilike: { col: string; val: string } | null = null;
  let _isSingle = false;
  let _priceEq: number | null = null;

  const endpoint = table === 'items' ? 'marketplace' : table === 'lost_found' ? 'lost-found' : table;

  function doFetch() {
    return fetch(`${API_URL}/${endpoint}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(r => r.json())
    .then((data: any) => {
      let result: any[] = Array.isArray(data) ? data.map((item: any) => {
        let imgs: any[] = [];
        try { imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images; } catch { imgs = []; }
        return { ...item, images: imgs, created_at: item.createdAt || new Date().toISOString() };
      }) : [];

      for (const [k, v] of Object.entries(_eq)) {
        const tk = k === 'record_type' ? 'type' : (k === 'seller_id' || k === 'reporter_id') ? 'ownerId' : k;
        result = result.filter((item: any) => {
          if ((table === 'items' || table === 'lost_found') && tk === 'status') return true;
          const iv = item[tk];
          if (typeof iv === 'string' && typeof v === 'string') return iv.toLowerCase() === v.toLowerCase();
          return iv === v;
        });
      }
      if (_priceEq !== null) result = result.filter((item: any) => Number(item.price) === _priceEq);
      if (_ilike) { const { col, val } = _ilike; result = result.filter((item: any) => String(item[col] || '').toLowerCase().includes(val)); }

      if (_isSingle) return { data: result[0] ?? null, error: result[0] ? null : { message: 'Not found' } };
      return { data: result, error: null };
    })
    .catch((err: any) => ({ data: null, error: err }));
  }

  const q: any = {
    select: (_cols: string) => q,
    eq(col: string, val: any) {
      if (col === 'price') _priceEq = Number(val); else _eq[col] = val;
      return q;
    },
    neq: (_col: string, _val: any) => q,
    or: (_val: string) => q,
    ilike(col: string, val: string) { _ilike = { col, val: val.replace(/%/g, '').toLowerCase() }; return q; },
    order: (_col: string, _opts: any) => q,
    limit: (_n: number) => q,
    single() { _isSingle = true; return q; },
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then(resolve: (v: any) => void, _reject?: (e: any) => void) { doFetch().then(resolve, _reject); },
    async insert(rows: any[]) {
      try {
        const payload = { ...rows[0] };
        if (payload.seller_id) { payload.ownerId = payload.seller_id; delete payload.seller_id; }
        if (payload.reporter_id) { payload.ownerId = payload.reporter_id; delete payload.reporter_id; }
        if (payload.record_type) { payload.type = payload.record_type; delete payload.record_type; }
        const res = await fetch(`${API_URL}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify(payload)
        });
        const text = await res.text();
        let rd: any;
        try { rd = JSON.parse(text); } catch { rd = { error: 'Invalid response' }; }
        if (!res.ok) return { data: null, error: new Error(rd?.error || `HTTP ${res.status}`) };
        return { data: rd, error: null };
      } catch(err) { return { data: null, error: err }; }
    },
    delete() { return Promise.resolve({ data: null, error: null }); },
    async update(_data: any) { return { data: null, error: null }; },
  };
  return q;
}

export const supabase = {
  from: (table: string) => createQuery(table),
  auth: {
    getSession: async () => ({ data: { session: localStorage.getItem('token') ? { user: JSON.parse(localStorage.getItem('user') || '{}') } : null } }),
    onAuthStateChange: (cb: any) => { cb('INITIAL_SESSION', null); return { data: { subscription: { unsubscribe: () => {} } } }; },
    signInWithPassword: async ({ email, password }: any) => {
      const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password}) });
      const data = await res.json();
      if (data.token) { localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); return { data: { user: data.user, session: {} }, error: null }; }
      return { data: null, error: new Error(data.error) };
    },
    signUp: async ({ email, password, options }: any) => {
      const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password, name: options?.data?.full_name || 'User'}) });
      const data = await res.json();
      if (data.token) { localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); return { data: { user: data.user, session: {} }, error: null }; }
      return { data: null, error: new Error(data.error) };
    },
    signInWithOAuth: async (_opts: any) => ({ data: null, error: new Error('Google sign-in not supported in this build') }),
    signOut: async () => { localStorage.removeItem('token'); localStorage.removeItem('user'); return { error: null }; }
  },
  storage: {
    from: (_bucket: string) => ({
      upload: async (path: any, file: any) => new Promise<any>((resolve) => {
        if (!file) return resolve({ data: { path }, error: null });
        const reader = new FileReader();
        reader.onloadend = () => { tempStorage.set(path, reader.result as string); resolve({ data: { path }, error: null }); };
        reader.readAsDataURL(file);
      }),
      getPublicUrl: (path: any) => ({ data: { publicUrl: tempStorage.get(path) || '' } })
    })
  },
  channel: (_name: string) => ({ 
    on: (_type: string, _opts: any, _cb: any) => ({ 
      subscribe: () => ({ unsubscribe: () => {} }) 
    }) 
  }),
  removeChannel: (_channel: any) => {}
};
