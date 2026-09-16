-- =========================================================
-- ERP SCHEMA: 05_saas_billing_subscriptions.sql
-- Тарифтік жоспарлар, биллинг және мейрамхана жазылымдары
-- =========================================================

-- 1. Тарифтік жоспарлар (Pricing Plans)
CREATE TABLE IF NOT EXISTS pricing_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  code         TEXT NOT NULL UNIQUE, -- 'basic', 'pro', 'enterprise'
  price_monthly NUMERIC(10, 2) NOT NULL,
  price_yearly  NUMERIC(10, 2) NOT NULL,
  features     JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 2. Мейрамханалардың SaaS жазылымдары
CREATE TABLE IF NOT EXISTS restaurant_subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id          UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  plan_id          UUID REFERENCES pricing_plans(id) NOT NULL,
  status           TEXT NOT NULL DEFAULT 'trial'
                   CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'expired')),
  billing_cycle    TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end   TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pricing plans"
  ON pricing_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can view own restaurant subscriptions"
  ON restaurant_subscriptions FOR SELECT
  USING (cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
