-- Phase-3 Vault and Redemption Tables
-- This migration runs only if ENABLE_VAULT_REDEMPTION=true

-- Vault Inventory Table
CREATE TABLE IF NOT EXISTS vault_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metal VARCHAR(2) NOT NULL CHECK (metal IN ('AU', 'AG', 'PT', 'PD', 'CU')),
  sku VARCHAR(50) UNIQUE NOT NULL,
  format VARCHAR(10) NOT NULL CHECK (format IN ('BAR', 'COIN', 'SHEET', 'COIL', 'ROUND')),
  weight DECIMAL(10,4) NOT NULL CHECK (weight > 0),
  purity DECIMAL(6,4) NOT NULL CHECK (purity > 0 AND purity <= 1),
  vault_location VARCHAR(100) NOT NULL,
  qty_available INTEGER NOT NULL DEFAULT 0 CHECK (qty_available >= 0),
  qty_reserved INTEGER NOT NULL DEFAULT 0 CHECK (qty_reserved >= 0),
  unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost > 0),
  last_restocked TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Redemption Requests Table
CREATE TABLE IF NOT EXISTS redemption_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(20) NOT NULL,
  asset_amount DECIMAL(20,8) NOT NULL CHECK (asset_amount > 0),
  vault_sku VARCHAR(50) NOT NULL,
  requested_qty INTEGER NOT NULL CHECK (requested_qty > 0),
  allocated_qty INTEGER NOT NULL DEFAULT 0 CHECK (allocated_qty >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'ALLOCATED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED')),
  shipping_address JSONB NOT NULL,
  vault_location VARCHAR(100) NOT NULL,
  estimated_value DECIMAL(10,2) NOT NULL CHECK (estimated_value > 0),
  lock_expires_at TIMESTAMPTZ NOT NULL,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  shipping_carrier VARCHAR(50),
  tracking_number VARCHAR(100),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Business rules
  CHECK ((status != 'APPROVED') OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  CHECK ((status != 'SHIPPED') OR (shipping_carrier IS NOT NULL AND tracking_number IS NOT NULL AND shipped_at IS NOT NULL)),
  CHECK ((status != 'DELIVERED') OR (delivered_at IS NOT NULL)),
  CHECK ((status != 'FAILED') OR (failure_reason IS NOT NULL))
);

-- Vault Audit Log Table (track inventory changes)
CREATE TABLE IF NOT EXISTS vault_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES vault_inventory(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('RESTOCK', 'RESERVE', 'RELEASE', 'ALLOCATE', 'SHIPPED', 'RETURNED')),
  qty_change INTEGER NOT NULL,
  previous_qty INTEGER NOT NULL,
  new_qty INTEGER NOT NULL,
  user_id UUID REFERENCES users(id),
  redemption_id UUID REFERENCES redemption_requests(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for vault_inventory
CREATE INDEX IF NOT EXISTS idx_vault_inventory_metal ON vault_inventory(metal);
CREATE INDEX IF NOT EXISTS idx_vault_inventory_sku ON vault_inventory(sku);
CREATE INDEX IF NOT EXISTS idx_vault_inventory_format ON vault_inventory(format);
CREATE INDEX IF NOT EXISTS idx_vault_inventory_vault_location ON vault_inventory(vault_location);
CREATE INDEX IF NOT EXISTS idx_vault_inventory_available ON vault_inventory(qty_available) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_vault_inventory_active ON vault_inventory(is_active);
CREATE INDEX IF NOT EXISTS idx_vault_inventory_last_restocked ON vault_inventory(last_restocked);

-- Indexes for redemption_requests
CREATE INDEX IF NOT EXISTS idx_redemption_requests_user_id ON redemption_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_status ON redemption_requests(status);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_vault_sku ON redemption_requests(vault_sku);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_vault_location ON redemption_requests(vault_location);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_created_at ON redemption_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_lock_expires ON redemption_requests(lock_expires_at) WHERE status IN ('PENDING', 'APPROVED');
CREATE INDEX IF NOT EXISTS idx_redemption_requests_tracking ON redemption_requests(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_redemption_requests_user_status_created ON redemption_requests(user_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_status_created ON redemption_requests(status, created_at);

-- Indexes for vault_audit_log
CREATE INDEX IF NOT EXISTS idx_vault_audit_log_inventory_id ON vault_audit_log(inventory_id);
CREATE INDEX IF NOT EXISTS idx_vault_audit_log_action ON vault_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_vault_audit_log_user_id ON vault_audit_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vault_audit_log_redemption_id ON vault_audit_log(redemption_id) WHERE redemption_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vault_audit_log_created_at ON vault_audit_log(created_at);

-- Updated at triggers
CREATE TRIGGER trigger_vault_inventory_updated_at
  BEFORE UPDATE ON vault_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_redemption_requests_updated_at
  BEFORE UPDATE ON redemption_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert sample vault inventory data for testing
INSERT INTO vault_inventory (metal, sku, format, weight, purity, vault_location, qty_available, unit_cost, metadata) VALUES
  ('AU', 'AU-EAGLE-1OZ', 'COIN', '1.0000', '0.9167', 'VAULT-MAIN', 100, '2150.00', '{"mint": "US Mint", "year": "2024", "denomination": "$50"}'),
  ('AU', 'AU-MAPLE-1OZ', 'COIN', '1.0000', '0.9999', 'VAULT-MAIN', 50, '2145.00', '{"mint": "Royal Canadian Mint", "year": "2024", "denomination": "$50"}'),
  ('AU', 'AU-BAR-1OZ', 'BAR', '1.0000', '0.9999', 'VAULT-MAIN', 200, '2140.00', '{"refinery": "PAMP Suisse", "serial": true}'),
  ('AG', 'AG-EAGLE-1OZ', 'COIN', '1.0000', '0.999', 'VAULT-MAIN', 500, '32.50', '{"mint": "US Mint", "year": "2024", "denomination": "$1"}'),
  ('AG', 'AG-MAPLE-1OZ', 'COIN', '1.0000', '0.9999', 'VAULT-MAIN', 300, '32.25', '{"mint": "Royal Canadian Mint", "year": "2024", "denomination": "$5"}'),
  ('AG', 'AG-BAR-10OZ', 'BAR', '10.0000', '0.999', 'VAULT-MAIN', 100, '320.00', '{"refinery": "Sunshine Minting", "serial": true}'),
  ('PT', 'PT-EAGLE-1OZ', 'COIN', '1.0000', '0.9995', 'VAULT-MAIN', 25, '1050.00', '{"mint": "US Mint", "year": "2024", "denomination": "$100"}'),
  ('PT', 'PT-BAR-1OZ', 'BAR', '1.0000', '0.9995', 'VAULT-MAIN', 50, '1045.00', '{"refinery": "PAMP Suisse", "serial": true}'),
  ('PD', 'PD-LEAF-1OZ', 'COIN', '1.0000', '0.9995', 'VAULT-MAIN', 20, '1200.00', '{"mint": "Royal Canadian Mint", "year": "2024", "denomination": "$50"}'),
  ('CU', 'CU-COIL-1LB', 'COIL', '1.0000', '0.999', 'VAULT-SECONDARY', 1000, '8.50', '{"form": "wire coil", "gauge": "12 AWG"}')
ON CONFLICT (sku) DO NOTHING;

-- Add comment to track migration version
COMMENT ON TABLE vault_inventory IS 'Phase-3 vault inventory tracking - Migration 002';
COMMENT ON TABLE redemption_requests IS 'Phase-3 redemption requests - Migration 002';
COMMENT ON TABLE vault_audit_log IS 'Phase-3 vault audit trail - Migration 002';
