/** Loose row shapes for admin investment UI (PostgreSQL via API; columns may evolve). */

export type Investor = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_color?: string | null;
  created_at?: string;
};

export type InvestmentCategory = {
  id: string;
  name?: string | null;
  color?: string | null;
  created_at?: string;
};

export type Investment = {
  id: string;
  name?: string | null;
  description?: string | null;
  total_capital?: number | null;
  investor_id?: string | null;
  category_id?: string | null;
  project_id?: string | null;
  amount?: number | null;
  expected_return?: number | null;
  status?: string | null;
  created_at?: string;
};

export type Contribution = {
  id: string;
  investor_id: string;
  investment_id: string;
  amount?: number | null;
  contribution_date: string;
  notes?: string | null;
  /** UI / legacy field name */
  note?: string | null;
  image_url?: string | null;
  slip_url?: string | null;
  category_id?: string | null;
  project_id?: string | null;
  created_at?: string;
};

export type InvestmentShare = {
  id: string;
  investment_id: string;
  investor_id?: string | null;
  user_id?: string | null;
  share_percent?: number | null;
  amount?: number | null;
  /** UI label; may map to `amount` in DB */
  capital_amount?: number | null;
  created_at?: string;
};
