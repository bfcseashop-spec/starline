/**
 * Thin client for Starline Nest API (/api/db, /api/auth, /api/storage, /api/functions).
 * API client used by the Vite app; all persistence is PostgreSQL through the Nest server.
 */

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4042").replace(/\/$/, "");
export const BACKEND_AUTH_TOKEN_KEY = "starline_token";

type QueryAction = "select" | "insert" | "update" | "delete" | "upsert";

function extractMessage(body: Record<string, unknown> | undefined, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const m = body.message;
  if (typeof m === "string" && m.trim()) return m;
  if (Array.isArray(m) && m.length && typeof m[0] === "string") return m.join("; ");
  if (typeof body.error === "string" && body.error.trim()) return body.error;
  return fallback;
}

async function parseJsonBody(res: Response): Promise<Record<string, unknown>> {
  try {
    const text = await res.text();
    if (!text) return {};
    const j = JSON.parse(text) as unknown;
    return j && typeof j === "object" ? (j as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

class QueryBuilder implements PromiseLike<{ data: any; error: { message: string } | null }> {
  private filters: Record<string, any> = {};
  private action: QueryAction = "select";
  private payload: any = null;
  private upsertConflict?: string;
  private singleMode = false;
  private orderBy?: string;
  private ascending = true;

  constructor(private readonly table: string) {}

  select(..._args: any[]) {
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

  limit(_n: number) {
    return this;
  }

  range(_from: number, _to: number) {
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
    const token = localStorage.getItem(BACKEND_AUTH_TOKEN_KEY) || "";
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
      const out = await parseJsonBody(res);
      if (!res.ok) {
        const msg = extractMessage(out, `Request failed (${res.status})`);
        return { data: this.singleMode ? null : [], error: { message: msg } };
      }
      const rows = (out.data as unknown[]) ?? [];
      const err = out.error !== undefined && out.error !== null ? String(out.error) : null;
      return {
        data: this.singleMode ? (rows[0] ?? null) : rows,
        error: err ? { message: err } : null,
      };
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
          const j = await parseJsonBody(r);
          if (!r.ok) {
            inserted.push(null);
          } else {
            inserted.push(j.data);
          }
        }
        return { data: inserted, error: null };
      }
      const res = await fetch(`${API_URL}/api/db/${this.table}`, {
        method: "POST",
        headers,
        body: JSON.stringify(this.payload),
      });
      const out = await parseJsonBody(res);
      if (!res.ok) {
        return { data: null, error: { message: extractMessage(out, `Request failed (${res.status})`) } };
      }
      return { data: out.data, error: null };
    }

    if (this.action === "upsert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      const results: unknown[] = [];
      const keys = (this.upsertConflict || "").split(",").map((k) => k.trim()).filter(Boolean);
      for (const row of rows) {
        const filters = Object.fromEntries(keys.map((k) => [k, row[k]]));
        if (keys.length) {
          const q = new URLSearchParams();
          Object.entries(filters).forEach(([k, v]) => q.append(k, String(v)));
          const existingRes = await fetch(`${API_URL}/api/db/${this.table}?${q.toString()}`, { headers });
          const existingOut = await parseJsonBody(existingRes);
          if (!existingRes.ok) {
            results.push(null);
            continue;
          }
          const existing = (existingOut.data as unknown[])?.[0];
          if (existing) {
            const patchRes = await fetch(`${API_URL}/api/db/${this.table}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify({ payload: row, filters }),
            });
            const patchOut = await parseJsonBody(patchRes);
            if (!patchRes.ok) {
              results.push(null);
            } else {
              results.push((patchOut.data as unknown[])?.[0] ?? null);
            }
            continue;
          }
        }
        const ins = await fetch(`${API_URL}/api/db/${this.table}`, {
          method: "POST",
          headers,
          body: JSON.stringify(row),
        });
        const insOut = await parseJsonBody(ins);
        if (!ins.ok) {
          results.push(null);
        } else {
          results.push(insOut.data);
        }
      }
      return { data: Array.isArray(this.payload) ? results : results[0], error: null };
    }

    if (this.action === "update") {
      const res = await fetch(`${API_URL}/api/db/${this.table}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ payload: this.payload, filters: this.filters }),
      });
      const out = await parseJsonBody(res);
      if (!res.ok) {
        return { data: null, error: { message: extractMessage(out, `Request failed (${res.status})`) } };
      }
      return { data: this.singleMode ? (out.data?.[0] ?? null) : out.data, error: null };
    }

    const res = await fetch(`${API_URL}/api/db/${this.table}`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ filters: this.filters }),
    });
    const out = await parseJsonBody(res);
    if (!res.ok) {
      return { data: null, error: { message: extractMessage(out, `Request failed (${res.status})`) } };
    }
    return { data: out.data, error: null };
  }

  then<TResult1 = { data: any; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

const authListeners = new Set<(event: string, session: SessionPayload | null) => void>();

export type SessionPayload = {
  access_token: string;
  user: { id: string; email: string; user_metadata?: Record<string, any> };
  expires_in?: number;
  token_type?: string;
};

function notifyAuth(event: string, session: SessionPayload | null) {
  authListeners.forEach((cb) => cb(event, session));
}

function buildCredentialsError(res: Response, body: Record<string, unknown>): Error {
  return new Error(extractMessage(body, res.statusText || `Login failed (${res.status})`));
}

export const backend = {
  from(table: string) {
    return new QueryBuilder(table);
  },

  auth: {
    async signUp(payload: {
      email: string;
      password: string;
      options?: { data?: { full_name?: string }; emailRedirectTo?: string };
    }) {
      const fullName = payload.options?.data?.full_name ?? undefined;
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email, password: payload.password, full_name: fullName }),
      });
      const out = await parseJsonBody(res);
      if (!res.ok || !("access_token" in out && out.access_token)) {
        const err = buildCredentialsError(res, out);
        return { data: null, error: err };
      }
      const session: SessionPayload = {
        access_token: String(out.access_token),
        user: out.user as SessionPayload["user"],
        expires_in: Number(out.expires_in ?? 0) || undefined,
        token_type: String(out.token_type ?? "bearer"),
      };
      localStorage.setItem(BACKEND_AUTH_TOKEN_KEY, session.access_token);
      notifyAuth("SIGNED_IN", session);
      return { data: { session }, error: null as Error | null };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const res = await fetch(`${API_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const out = await parseJsonBody(res);
      if (!res.ok || !("access_token" in out && out.access_token)) {
        const err = buildCredentialsError(res, out);
        return { data: null, error: err };
      }
      const session: SessionPayload = {
        access_token: String(out.access_token),
        user: out.user as SessionPayload["user"],
        expires_in: Number(out.expires_in ?? 0) || undefined,
        token_type: String(out.token_type ?? "bearer"),
      };
      localStorage.setItem(BACKEND_AUTH_TOKEN_KEY, session.access_token);
      notifyAuth("SIGNED_IN", session);
      return { data: { session }, error: null as Error | null };
    },

    async signOut() {
      localStorage.removeItem(BACKEND_AUTH_TOKEN_KEY);
      notifyAuth("SIGNED_OUT", null);
      return { error: null };
    },

    async getSession() {
      const token = localStorage.getItem(BACKEND_AUTH_TOKEN_KEY) || "";
      if (!token) return { data: { session: null }, error: null };
      const res = await fetch(`${API_URL}/api/auth/session`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const out = await parseJsonBody(res);
      if (!res.ok) {
        localStorage.removeItem(BACKEND_AUTH_TOKEN_KEY);
        return { data: { session: null }, error: null };
      }
      const sessionNested = out.session as { access_token?: string; user?: { id: string; email: string } } | undefined;
      if (!sessionNested?.user) return { data: { session: null }, error: null };
      const session: SessionPayload = {
        access_token: sessionNested.access_token || token,
        user: sessionNested.user,
      };
      return { data: { session }, error: null };
    },

    async getUser() {
      const sess = await this.getSession();
      const s = sess.data?.session as SessionPayload | undefined;
      return { data: { user: s?.user ?? null }, error: sess.error ?? null };
    },

    onAuthStateChange(callback: (event: string, session: SessionPayload | null) => void) {
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
        async upload(remotePath: string, file: File) {
          const form = new FormData();
          form.append("file", file);
          form.append("path", remotePath);
          const token = localStorage.getItem(BACKEND_AUTH_TOKEN_KEY) || "";
          const res = await fetch(`${API_URL}/api/storage/upload/${bucket}`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: form,
          });
          const out = await parseJsonBody(res);
          if (!res.ok) {
            return {
              data: null,
              error: { message: extractMessage(out, `Upload failed (${res.status})`) },
            };
          }
          const d = out.data as { path?: string } | undefined;
          const pathStr = typeof d?.path === "string" ? d.path : `${bucket}/${remotePath}`;
          return { data: { path: pathStr, fullPath: pathStr }, error: null };
        },

        getPublicUrl(remotePath: string) {
          const clean = remotePath.replace(/^\/+/, "");
          const fullPath = clean.startsWith(`${bucket}/`) ? clean : `${bucket}/${clean}`;
          return {
            data: { publicUrl: `${API_URL}/api/storage/public/${fullPath.replace(/^\/+/, "")}` },
          };
        },

        async remove(paths: string[]) {
          await Promise.all(
            paths.map((raw) => {
              const segments = String(raw).replace(/^\/+/, "").split("/").filter(Boolean);
              let bkt = bucket;
              let fname: string;
              if (segments.length === 1) {
                fname = segments[0]!;
              } else {
                bkt = segments[0]!;
                fname = segments.slice(1).join("/");
              }
              return fetch(`${API_URL}/api/storage/${encodeURIComponent(bkt)}/${encodeURIComponent(fname)}`, {
                method: "DELETE",
              });
            }),
          );
          return { data: true, error: null };
        },
      };
    },
  },

  functions: {
    /** @deprecated Prefer naming this "invoke" only; kept for compatibility with older call sites. */
    async invoke(name: string, opts: { body?: Record<string, unknown> } = {}): Promise<{ data: any; error: { message: string } | null }> {
      const token = localStorage.getItem(BACKEND_AUTH_TOKEN_KEY) || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/functions/${name}`, {
        method: "POST",
        headers,
        body: JSON.stringify(opts.body ?? {}),
      });
      let out: { data?: any; error?: any; message?: string } = {};
      try {
        out = await res.json();
      } catch {
        return { data: null, error: { message: res.ok ? "Invalid response" : res.statusText || `Request failed (${res.status})` } };
      }
      const errMsg =
        (out.error !== undefined && out.error !== null && typeof out.error !== "object" ? String(out.error) : null) ||
        (typeof out.message === "string" ? out.message : null) ||
        (!res.ok ? `Request failed (${res.status})` : null);
      return { data: out.data ?? null, error: errMsg ? { message: errMsg } : null };
    },
  },
};
