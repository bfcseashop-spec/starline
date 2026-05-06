## Bootstrap admin user (`admin@starlineb.com`)

This project uses **Supabase Auth** + `public.user_roles` (with enum `public.app_role`) to control admin access.

New auth users automatically receive the `customer` role via the `handle_new_user()` trigger. To create an admin, you must:

1) **Create the auth user** (Supabase Dashboard → Authentication → Users → Add user), then  
2) **Grant the admin role** using the SQL below.

### 1) Create auth user

- **Email**: `admin@starlineb.com`  
- **Password**: `Admin@2814`

### 2) Promote to admin (idempotent)

Run in Supabase SQL Editor (or `psql` as project owner):

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'admin@starlineb.com'
on conflict (user_id, role) do nothing;
```

### 3) Optional: remove customer role (admin-only)

```sql
delete from public.user_roles ur
using auth.users au
where ur.user_id = au.id
  and au.email = 'admin@starlineb.com'
  and ur.role = 'customer'::public.app_role;
```

### 4) Verify role

```sql
select au.email, ur.role, ur.created_at
from public.user_roles ur
join auth.users au on au.id = ur.user_id
where au.email = 'admin@starlineb.com'
order by ur.created_at;
```

