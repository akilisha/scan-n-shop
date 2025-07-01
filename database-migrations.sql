-- ===================================================================
-- KerbDrop Stripe Connect Database Migrations
-- ===================================================================

-- Migration 001: Payment Methods Table
-- ===================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('card', 'us_bank_account', 'link', 'cashapp', 'affirm', 'klarna')),
    brand VARCHAR(50),
    last4 VARCHAR(4),
    exp_month INTEGER,
    exp_year INTEGER,
    nickname VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    billing_details JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);

-- Trigger to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE payment_methods 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_payment_method
    BEFORE INSERT OR UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_payment_method();

-- Migration 002: Orders Table
-- ===================================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES profiles(id),
    seller_id UUID REFERENCES profiles(id),
    stripe_payment_intent_id VARCHAR(255),
    stripe_connect_account_id VARCHAR(255),
    order_number VARCHAR(50) UNIQUE,
    total_amount DECIMAL(12,2) NOT NULL,
    application_fee DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
    items JSONB NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    payment_method_details JSONB,
    notes TEXT,
    refund_reason TEXT,
    metadata JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_connect_account ON orders(stripe_connect_account_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := 'KD' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Trigger to auto-generate order numbers
CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- Migration 003: Subscriptions Table
-- ===================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_connect_account_id VARCHAR(255),
    plan_id VARCHAR(100) NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancel_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    price_amount DECIMAL(10,2) NOT NULL,
    price_currency VARCHAR(3) DEFAULT 'usd',
    price_interval VARCHAR(20) NOT NULL CHECK (price_interval IN ('day', 'week', 'month', 'year')),
    price_interval_count INTEGER DEFAULT 1,
    application_fee_percent DECIMAL(5,4),
    discount_coupon_id VARCHAR(255),
    discount_amount DECIMAL(10,2),
    latest_invoice_id VARCHAR(255),
    payment_method_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period ON subscriptions(current_period_start, current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(user_id, status) WHERE status = 'active';

-- Migration 004: Referrals Table
-- ===================================================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES profiles(id),
    referred_id UUID REFERENCES profiles(id),
    referral_code VARCHAR(12) NOT NULL,
    email VARCHAR(255), -- Email of referred person (before they sign up)
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
    credit_type VARCHAR(20) NOT NULL DEFAULT 'month' CHECK (credit_type IN ('month', 'dollar')),
    credit_awarded DECIMAL(10,2) DEFAULT 0,
    credit_used BOOLEAN DEFAULT FALSE,
    credit_applied_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals(email);
CREATE INDEX IF NOT EXISTS idx_referrals_expires_at ON referrals(expires_at);

-- Migration 005: Connect Accounts Table
-- ===================================================================
CREATE TABLE IF NOT EXISTS connect_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    stripe_account_id VARCHAR(255) NOT NULL UNIQUE,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('express', 'standard', 'custom')),
    business_type VARCHAR(20) NOT NULL CHECK (business_type IN ('individual', 'company', 'non_profit')),
    country VARCHAR(2) NOT NULL DEFAULT 'US',
    email VARCHAR(255),
    charges_enabled BOOLEAN DEFAULT FALSE,
    payouts_enabled BOOLEAN DEFAULT FALSE,
    details_submitted BOOLEAN DEFAULT FALSE,
    capabilities JSONB,
    requirements JSONB,
    settings JSONB,
    business_profile JSONB,
    individual JSONB,
    company JSONB,
    tos_acceptance JSONB,
    onboarding_link_expires_at TIMESTAMP WITH TIME ZONE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_failed_reason TEXT,
    last_webhook_received_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for connect_accounts
CREATE INDEX IF NOT EXISTS idx_connect_accounts_user ON connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connect_accounts_stripe_id ON connect_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_connect_accounts_charges_enabled ON connect_accounts(charges_enabled) WHERE charges_enabled = true;
CREATE INDEX IF NOT EXISTS idx_connect_accounts_details_submitted ON connect_accounts(details_submitted);
CREATE INDEX IF NOT EXISTS idx_connect_accounts_verification ON connect_accounts(verification_status);

-- Migration 006: User Profile Updates for Stripe
-- ===================================================================
-- Add Stripe-related fields to existing profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12),
ADD COLUMN IF NOT EXISTS referred_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS referral_credits_available DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_credits_used DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_referrals INTEGER DEFAULT 0;

-- Indexes for new profile fields
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code(user_id_param UUID)
RETURNS VARCHAR(12) AS $$
DECLARE
    timestamp_part VARCHAR(4);
    user_part VARCHAR(8);
    final_code VARCHAR(12);
BEGIN
    -- Get timestamp component
    timestamp_part := UPPER(TO_CHAR(EXTRACT(epoch FROM NOW())::INTEGER, 'FM000000')::VARCHAR);
    
    -- Get user ID component (last 8 chars, uppercase)
    user_part := UPPER(RIGHT(REPLACE(user_id_param::TEXT, '-', ''), 8));
    
    -- Combine: KERB + 4 chars timestamp + 4 chars user
    final_code := 'KERB' || RIGHT(timestamp_part, 4) || LEFT(user_part, 4);
    
    RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Migration 007: Webhook Events Log Table
-- ===================================================================
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    webhook_source VARCHAR(50) NOT NULL DEFAULT 'stripe',
    processed BOOLEAN DEFAULT FALSE,
    processing_attempts INTEGER DEFAULT 0,
    last_processing_attempt_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for webhook_events
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Migration 008: Application Fees Table
-- ===================================================================
CREATE TABLE IF NOT EXISTS application_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    stripe_application_fee_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    connect_account_id VARCHAR(255) NOT NULL,
    fee_amount DECIMAL(10,2) NOT NULL,
    fee_currency VARCHAR(3) DEFAULT 'usd',
    original_amount DECIMAL(10,2) NOT NULL,
    fee_percentage DECIMAL(5,4) NOT NULL,
    fixed_fee DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'refunded', 'failed')),
    collected_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for application_fees
CREATE INDEX IF NOT EXISTS idx_application_fees_order ON application_fees(order_id);
CREATE INDEX IF NOT EXISTS idx_application_fees_stripe_fee_id ON application_fees(stripe_application_fee_id);
CREATE INDEX IF NOT EXISTS idx_application_fees_connect_account ON application_fees(connect_account_id);
CREATE INDEX IF NOT EXISTS idx_application_fees_status ON application_fees(status);

-- Migration 009: Updated Triggers and Functions
-- ===================================================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER trigger_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_connect_accounts_updated_at
    BEFORE UPDATE ON connect_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_webhook_events_updated_at
    BEFORE UPDATE ON webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_application_fees_updated_at
    BEFORE UPDATE ON application_fees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migration 010: Views for Common Queries
-- ===================================================================
-- View for active seller subscriptions
CREATE OR REPLACE VIEW active_seller_subscriptions AS
SELECT 
    s.*,
    p.email,
    p.full_name,
    ca.stripe_account_id,
    ca.charges_enabled,
    ca.payouts_enabled
FROM subscriptions s
JOIN profiles p ON s.user_id = p.id
LEFT JOIN connect_accounts ca ON p.id = ca.user_id
WHERE s.status = 'active'
  AND s.current_period_end > NOW();

-- View for referral statistics
CREATE OR REPLACE VIEW referral_stats AS
SELECT 
    p.id as user_id,
    p.email,
    p.referral_code,
    COUNT(r.id) as total_referrals,
    COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as successful_referrals,
    COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_referrals,
    SUM(CASE WHEN r.status = 'completed' THEN r.credit_awarded ELSE 0 END) as total_credits_earned,
    p.referral_credits_available,
    p.referral_credits_used
FROM profiles p
LEFT JOIN referrals r ON p.id = r.referrer_id
GROUP BY p.id, p.email, p.referral_code, p.referral_credits_available, p.referral_credits_used;

-- View for marketplace revenue
CREATE OR REPLACE VIEW marketplace_revenue AS
SELECT 
    DATE_TRUNC('day', o.created_at) as date,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as gross_revenue,
    SUM(af.fee_amount) as application_fees,
    COUNT(DISTINCT o.seller_id) as active_sellers,
    COUNT(DISTINCT o.buyer_id) as active_buyers
FROM orders o
LEFT JOIN application_fees af ON o.id = af.order_id
WHERE o.status = 'completed'
GROUP BY DATE_TRUNC('day', o.created_at)
ORDER BY date DESC;

-- Migration 011: Row Level Security (RLS) Setup
-- ===================================================================
-- Enable RLS on sensitive tables
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE connect_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY payment_methods_user_policy ON payment_methods
    FOR ALL USING (auth.uid()::uuid = user_id);

-- RLS Policies for orders
CREATE POLICY orders_buyer_policy ON orders
    FOR ALL USING (auth.uid()::uuid = buyer_id);

CREATE POLICY orders_seller_policy ON orders
    FOR ALL USING (auth.uid()::uuid = seller_id);

-- RLS Policies for subscriptions
CREATE POLICY subscriptions_user_policy ON subscriptions
    FOR ALL USING (auth.uid()::uuid = user_id);

-- RLS Policies for referrals
CREATE POLICY referrals_referrer_policy ON referrals
    FOR ALL USING (auth.uid()::uuid = referrer_id);

CREATE POLICY referrals_referred_policy ON referrals
    FOR SELECT USING (auth.uid()::uuid = referred_id);

-- RLS Policies for connect_accounts
CREATE POLICY connect_accounts_user_policy ON connect_accounts
    FOR ALL USING (auth.uid()::uuid = user_id);

-- ===================================================================
-- End of Migrations
-- ===================================================================

-- Grant necessary permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create helpful stored procedures
CREATE OR REPLACE FUNCTION get_user_payment_stats(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_orders', COUNT(o.id),
        'total_spent', COALESCE(SUM(o.total_amount), 0),
        'successful_orders', COUNT(CASE WHEN o.status = 'completed' THEN 1 END),
        'payment_methods', COUNT(DISTINCT pm.id),
        'active_subscriptions', COUNT(CASE WHEN s.status = 'active' THEN 1 END)
    ) INTO result
    FROM profiles p
    LEFT JOIN orders o ON p.id = o.buyer_id
    LEFT JOIN payment_methods pm ON p.id = pm.user_id
    LEFT JOIN subscriptions s ON p.id = s.user_id
    WHERE p.id = user_id_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'KerbDrop Stripe Connect database migrations completed successfully!';
    RAISE NOTICE 'Tables created: payment_methods, orders, subscriptions, referrals, connect_accounts, webhook_events, application_fees';
    RAISE NOTICE 'Views created: active_seller_subscriptions, referral_stats, marketplace_revenue';
    RAISE NOTICE 'RLS policies enabled for data security';
END $$;
