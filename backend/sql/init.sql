CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  project_name TEXT,
  location TEXT,
  status TEXT,
  total_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  monthly_installment NUMERIC DEFAULT 0,
  start_date DATE,
  expected_completion DATE,
  building_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  project_id UUID,
  amount NUMERIC DEFAULT 0,
  payment_date DATE,
  payment_method TEXT,
  status TEXT,
  reference_no TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  amount NUMERIC DEFAULT 0,
  category TEXT,
  expense_date DATE,
  status TEXT,
  description TEXT,
  vendor TEXT,
  payment_method TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  project_id UUID,
  file_name TEXT,
  file_type TEXT,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID,
  title TEXT,
  description TEXT,
  update_date DATE,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID,
  image_url TEXT,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  body TEXT,
  content TEXT,
  link TEXT,
  image_url TEXT,
  platform TEXT,
  status TEXT,
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  account_name TEXT,
  account_number TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investment_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID,
  category_id UUID,
  project_id UUID,
  amount NUMERIC DEFAULT 0,
  expected_return NUMERIC DEFAULT 0,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID,
  investment_id UUID,
  amount NUMERIC DEFAULT 0,
  contribution_date DATE,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investment_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID,
  user_id UUID,
  share_percent NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Social broadcasting (one post -> many platforms)

CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL,
  account_label TEXT,
  account_external_id TEXT,
  credentials_enc TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMP,
  last_error TEXT,
  last_used_at TIMESTAMP,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS social_connections_platform_idx ON social_connections(platform);
CREATE INDEX IF NOT EXISTS social_connections_status_idx ON social_connections(status);

CREATE TABLE IF NOT EXISTS social_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  link TEXT,
  scheduled_at TIMESTAMP,
  status TEXT DEFAULT 'pending',
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS social_broadcasts_status_idx ON social_broadcasts(status);
CREATE INDEX IF NOT EXISTS social_broadcasts_scheduled_idx ON social_broadcasts(scheduled_at);

CREATE TABLE IF NOT EXISTS social_broadcast_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID NOT NULL,
  connection_id UUID,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  external_id TEXT,
  external_url TEXT,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sbt_broadcast_idx ON social_broadcast_targets(broadcast_id);
CREATE INDEX IF NOT EXISTS sbt_status_idx ON social_broadcast_targets(status);
CREATE INDEX IF NOT EXISTS sbt_scheduled_idx ON social_broadcast_targets(scheduled_at);

CREATE TABLE IF NOT EXISTS social_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID,
  platform TEXT,
  event TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  actor_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sal_connection_idx ON social_audit_log(connection_id);

-- Optional override for public featured portfolio (JSON: { "items": Property[] }). Empty array = app uses built-in catalog.
INSERT INTO site_settings (setting_key, setting_value)
SELECT 'marketing_properties', '{"items":[]}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE setting_key = 'marketing_properties');
