-- =========================================================
-- CRM SCHEMA: 04_gift_certificates.sql
-- Сыйлық сертификаттары: Құру, сатып алу, тексеру және өтеу
-- =========================================================

CREATE TABLE IF NOT EXISTS gift_certificates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id          UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  order_id         UUID REFERENCES orders(id) ON DELETE SET NULL,
  code             TEXT NOT NULL,
  initial_amount   NUMERIC(12, 2) NOT NULL,
  current_balance  NUMERIC(12, 2) NOT NULL,
  recipient_name   TEXT,
  recipient_email  TEXT,
  recipient_phone  TEXT,
  sender_name      TEXT,
  sender_message   TEXT,
  is_active        BOOLEAN DEFAULT false,
  is_paid          BOOLEAN DEFAULT false,
  expiry_date      TIMESTAMPTZ,
  activated_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cafe_id, code)
);

CREATE INDEX IF NOT EXISTS idx_gift_cert_code ON gift_certificates(code);
CREATE INDEX IF NOT EXISTS idx_gift_cert_cafe ON gift_certificates(cafe_id);

-- RLS
ALTER TABLE gift_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage gift certificates"
  ON gift_certificates FOR ALL
  USING (
    cafe_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    OR cafe_id IN (SELECT cafe_id FROM staff_profiles WHERE id = auth.uid())
  );
