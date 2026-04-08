-- Authentication and paid-report entitlement schema.
-- Supabase version: user_id is UUID referencing auth.users (managed by Supabase Auth).

BEGIN;

CREATE TABLE IF NOT EXISTS report_entitlements (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'yoco', 'admin_grant')),
  external_payment_id TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entitlement_key)
);

COMMENT ON TABLE report_entitlements IS
'Paid access entitlements used to gate full ancestry reports.';

CREATE INDEX IF NOT EXISTS idx_report_entitlements_user_id ON report_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_report_entitlements_key_status ON report_entitlements(entitlement_key, status);

CREATE TABLE IF NOT EXISTS yoco_checkout_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_key TEXT NOT NULL,
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  currency CHAR(3) NOT NULL,
  checkout_id TEXT NOT NULL UNIQUE,
  payment_id TEXT,
  status TEXT NOT NULL,
  redirect_url TEXT,
  raw_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE yoco_checkout_sessions IS
'Yoco checkout session audit table for reconciliation and webhook fulfillment.';

CREATE INDEX IF NOT EXISTS idx_yoco_checkout_sessions_user_id ON yoco_checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_yoco_checkout_sessions_entitlement ON yoco_checkout_sessions(entitlement_key, status);

COMMIT;
