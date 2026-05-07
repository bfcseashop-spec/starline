## Bootstrap admin user

Authentication is **JWT via the Nest API**; users and roles live in PostgreSQL (`users`, `profiles`, `user_roles`).

### Preferred: seed script

With PostgreSQL running and `.env` / env vars set (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`), run from the repo root:

```bash
npm run db:init      # creates schema (backend/sql/init.sql)
npm run admin:seed   # upserts admin from DEFAULT_ADMIN_* env vars
```

Defaults match `.env.example`: email `admin@starlineb.com`, password `Admin@2814`, name `Starline Admin`. Override with `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_NAME`.

### Verify in PostgreSQL

```sql
SELECT u.email, ur.role
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'admin@starlineb.com';
```

### Importing JSON table dumps

Place `{table}.json` arrays under `backend/data-export/` (the default when you run `import:data`; or set `DATA_EXPORT_DIR`), then:

```bash
npm run import:data
```
