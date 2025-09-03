-- Admin Terminal Backend - Core Tables Migration
-- Creates essential tables for admin terminal functionality

BEGIN;

-- Admin Terminal Audit Log (tamper-evident)
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id SERIAL PRIMARY KEY,
    sequence INTEGER NOT NULL UNIQUE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id TEXT NOT NULL,
    user_roles TEXT[] NOT NULL DEFAULT '{}',
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    hash_current TEXT NOT NULL,
    hash_previous TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Admin Terminal Approval Requests (dual-approval workflow)
CREATE TABLE IF NOT EXISTS admin_approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    action TEXT NOT NULL,
    requester_user_id TEXT NOT NULL,
    requester_roles TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
    request_data JSONB NOT NULL DEFAULT '{}',
    approval_data JSONB DEFAULT '{}',
    approver_user_id TEXT,
    approver_roles TEXT[] DEFAULT '{}',
    reason TEXT,
    step_up_id TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Admin Terminal Sessions (step-up authentication)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    session_type TEXT NOT NULL DEFAULT 'normal' CHECK (session_type IN ('normal', 'step_up')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Admin Terminal Configuration (governance toggles)
CREATE TABLE IF NOT EXISTS admin_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    requires_approval BOOLEAN NOT NULL DEFAULT true,
    last_modified_by TEXT,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_sequence ON admin_audit_log(sequence);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_timestamp ON admin_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user_id ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_resource_type ON admin_audit_log(resource_type);

CREATE INDEX IF NOT EXISTS idx_admin_approval_requests_status ON admin_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_approval_requests_requester ON admin_approval_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_approval_requests_expires ON admin_approval_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_approval_requests_created ON admin_approval_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_status ON admin_sessions(status);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_config_category ON admin_config(category);

-- Row Level Security (RLS) Policies for admin terminal
-- Enable RLS on all admin tables
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Admin audit log policies (read-only for most, admin-write only)
CREATE POLICY admin_audit_log_read ON admin_audit_log
    FOR SELECT TO authenticated
    USING (
        current_setting('app.user_role', true) IN ('admin', 'super_admin') OR
        user_id = current_setting('app.user_id', true)
    );

CREATE POLICY admin_audit_log_insert ON admin_audit_log
    FOR INSERT TO authenticated
    WITH CHECK (
        current_setting('app.user_role', true) IN ('admin', 'super_admin') AND
        user_id = current_setting('app.user_id', true)
    );

-- Approval requests policies (requester and approvers can access)
CREATE POLICY admin_approval_requests_read ON admin_approval_requests
    FOR SELECT TO authenticated
    USING (
        current_setting('app.user_role', true) IN ('admin', 'super_admin') OR
        requester_user_id = current_setting('app.user_id', true) OR
        approver_user_id = current_setting('app.user_id', true)
    );

CREATE POLICY admin_approval_requests_write ON admin_approval_requests
    FOR ALL TO authenticated
    USING (
        current_setting('app.user_role', true) IN ('admin', 'super_admin')
    )
    WITH CHECK (
        current_setting('app.user_role', true) IN ('admin', 'super_admin')
    );

-- Sessions policies (own sessions only)
CREATE POLICY admin_sessions_own ON admin_sessions
    FOR ALL TO authenticated
    USING (user_id = current_setting('app.user_id', true))
    WITH CHECK (user_id = current_setting('app.user_id', true));

-- Config policies (read for all admin, write for super_admin only)
CREATE POLICY admin_config_read ON admin_config
    FOR SELECT TO authenticated
    USING (current_setting('app.user_role', true) IN ('admin', 'super_admin'));

CREATE POLICY admin_config_write ON admin_config
    FOR ALL TO authenticated
    USING (current_setting('app.user_role', true) = 'super_admin')
    WITH CHECK (current_setting('app.user_role', true) = 'super_admin');

-- Insert initial configuration values
INSERT INTO admin_config (key, value, description, category) VALUES
    ('maintenance_mode', 'false', 'Enable/disable maintenance mode', 'system'),
    ('feature_flags', '{"approval_workflows": true, "audit_logging": true, "step_up_auth": true}', 'Feature toggles for admin terminal', 'features'),
    ('security_settings', '{"max_session_duration": 3600, "step_up_timeout": 300, "max_failed_attempts": 3}', 'Security configuration', 'security'),
    ('rate_limits', '{"api_requests": 1000, "window_minutes": 60, "admin_endpoints": 100}', 'Rate limiting configuration', 'performance')
ON CONFLICT (key) DO NOTHING;

COMMIT;
