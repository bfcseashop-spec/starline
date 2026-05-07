const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
const TOKEN_KEY = "starline_token";

type QueryAction = "select" | "insert" | "update" | "delete" | "upsert";

class QueryBuilder implements PromiseLike<any> {
  private filters: Record<string, any> = {};
  private action: QueryAction = "select";
  private payload: any = null;
  private upsertConflict?: string;
  private singleMode = false;
  private orderBy?: string;
  private ascending = true;

  constructor(private readonly table: string) {}

  select() {
    this.action = "select";
    return this;
  }

  insert(payload: any) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: any, options?: { onConflict?: string }) {
    this.action = "upsert";
    this.payload = payload;
    this.upsertConflict = options?.onConflict;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(key: string, value: any) {
    this.filters[key] = value;
    return this;
  }

  in(key: string, values: any[]) {
    this.filters[key] = values.join(",");
    return this;
  }

  gte(key: string, value: any) {
    this.filters[`${key}__gte`] = value;
    return this;
  }

  lte(key: string, value: any) {
    this.filters[`${key}__lte`] = value;
    return this;
  }

  order(key: string, opts?: { ascending?: boolean }) {
    this.orderBy = key;
    this.ascending = opts?.ascending !== false;
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  maybeSingle() {
    this.singleMode = true;
    return this;
  }

  async execute() {
    const token = localStorage.getItem(TOKEN_KEY) || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    if (this.action === "select") {
      const qs = new URLSearchParams();
      Object.entries(this.filters).forEach(([k, v]) => qs.append(k, String(v)));
      if (this.orderBy) {
        qs.append("orderBy", this.orderBy);
        qs.append("ascending", String(this.ascending));
      }
      const res = await fetch(`${API_URL}/api/db/${this.table}?${qs.toString()}`, { headers });
      const out = await res.json();
      const rows = out.data || [];
      return { data: this.singleMode ? (rows[0] ?? null) : rows, error: out.error };
    }

    if (this.action === "insert") {
      if (Array.isArray(this.payload)) {
        const inserted = [];
        for (const row of this.payload) {
          const r = await fetch(`${API_URL}/api/db/${this.table}`, {
            method: "POST",
            headers,
            body: JSON.stringify(row),
          });
          const j = await r.json();
          inserted.push(j.data);
        }
        return { data: inserted, error: null };
      }
      const res = await fetch(`${API_URL}/api/db/${this.table}`, {
        method: "POST",
        headers,
        body: JSON.stringify(this.payload),
      });
      const out = await res.json();
      return { data: out.data, error: out.error };
    }

    if (this.action === "upsert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      const results: any[] = [];
      const keys = (this.upsertConflict || "").split(",").map((k) => k.trim()).filter(Boolean);
      for (const row of rows) {
        const filters = Object.fromEntries(keys.map((k) => [k, row[k]]));
        if (keys.length) {
          const q = new URLSearchParams();
          Object.entries(filters).forEach(([k, v]) => q.append(k, String(v)));
          const existingRes = await fetch(`${API_URL}/api/db/${this.table}?${q.toString()}`, { headers });
          const existingOut = await existingRes.json();
          const existing = existingOut.data?.[0];
          if (existing) {
            const patchRes = await fetch(`${API_URL}/api/db/${this.table}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify({ payload: row, filters }),
            });
            const patchOut = await patchRes.json();
            results.push(patchOut.data?.[0] || null);
            continue;
          }
        }
        const ins = await fetch(`${API_URL}/api/db/${this.table}`, {
          method: "POST",
          headers,
          body: JSON.stringify(row),
        });
        const insOut = await ins.json();
        results.push(insOut.data);
      }
      return { data: Array.isArray(this.payload) ? results : results[0], error: null };
    }

    if (this.action === "update") {
      const res = await fetch(`${API_URL}/api/db/${this.table}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ payload: this.payload, filters: this.filters }),
      });
      const out = await res.json();
      return { data: this.singleMode ? (out.data?.[0] ?? null) : out.data, error: out.error };
    }

    const res = await fetch(`${API_URL}/api/db/${this.table}`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ filters: this.filters }),
    });
    const out = await res.json();
    return { data: out.data, error: out.error };
  }

  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject);
  }
}

const authListeners = new Set<(event: string, session: any) => void>();
const notify = (event: string, session: any) => authListeners.forEach((cb) => cb(event, session));

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  auth: {
    async signUp({ email, password }: { email: string; password: string }) {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const out = await res.json();
      if (out.access_token) localStorage.setItem(TOKEN_KEY, out.access_token);
      notify("SIGNED_IN", out);
      return { data: out, error: null };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const res = await fetch(`${API_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const out = await res.json();
      if (out.access_token) localStorage.setItem(TOKEN_KEY, out.access_token);
      notify("SIGNED_IN", out);
      return { data: out, error: null };
    },
    async signOut() {
      localStorage.removeItem(TOKEN_KEY);
      notify("SIGNED_OUT", null);
      return { error: null };
    },
    async getSession() {
      const token = localStorage.getItem(TOKEN_KEY) || "";
      if (!token) return { data: { session: null }, error: null };
      const res = await fetch(`${API_URL}/api/auth/session`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const out = await res.json();
      return { data: out, error: null };
    },
    async getUser() {
      const session = await this.getSession();
      return { data: { user: session.data.session?.user || null }, error: null };
    },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.add(callback);
      return { data: { subscription: { unsubscribe: () => authListeners.delete(callback) } } };
    },
    admin: {
      listUsers: async () => ({ data: { users: [] }, error: null }),
      createUser: async () => ({ data: null, error: { message: "Not supported on client" } }),
      updateUserById: async () => ({ data: null, error: { message: "Not supported on client" } }),
    },
  },
  storage: {
    from(bucket: string) {
      return {
        async upload(_path: string, file: File) {
          const form = new FormData();
          form.append("file", file);
          const token = localStorage.getItem(TOKEN_KEY) || "";
          const res = await fetch(`${API_URL}/api/storage/upload/${bucket}`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: form,
          });
          const out = await res.json();
          return { data: { path: out.data.path, fullPath: out.data.path }, error: out.error };
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: `${API_URL}/api/storage/public/${bucket}/${path}` } };
        },
        async remove(paths: string[]) {
          await Promise.all(
            paths.map((p) => {
              const chunks = p.split("/").filter(Boolean);
              const b = chunks.length > 1 ? chunks[0] : bucket;
              const rest = chunks.length > 1 ? chunks.slice(1) : chunks;
              return fetch(`${API_URL}/api/storage/${b}/${rest.join("/")}`, { method: "DELETE" });
            }),
          );
          return { data: true, error: null };
        },
      };
    },
  },
  functions: {
    async invoke(name: string, payload: { body: any }) {
      const res = await fetch(`${API_URL}/api/functions/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.body || {}),
      });
      const out = await res.json();
      return out;
    },
  },
};