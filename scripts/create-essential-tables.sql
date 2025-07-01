-- Essential Stripe Connect Tables for KerbDrop
-- Run this in your Supabase SQL Editor

-- 1. Connect Accounts Table (for sellers)
CREATE TABLE IF NOT EXISTS connect_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_account_id VARCHAR(255) NOT NULL UNIQUE,
    account_type VARCHAR(20) NOT NULL DEFAULT 'express',
    business_type VARCHAR(20) NOT NULL DEFAULT 'individual',
    country VARCHAR(2) NOT NULL DEFAULT 'US',
    email VARCHAR(255),
    charges_enabled BOOLEAN DEFAULT FALSE,
    payouts_enabled BOOLEAN DEFAULT FALSE,
    details_submitted BOOLEAN DEFAULT FALSE,
    capabilities JSONB,
    requirements JSONB,
    business_profile JSONB,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    verification_status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enhanced Orders Table (add seller support)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS application_fee DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);

-- 3. Application Fees Table
CREATE TABLE IF NOT EXISTS application_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    stripe_application_fee_id VARCHAR(255),
    connect_account_id VARCHAR(255) NOT NULL,
    fee_amount DECIMAL(10,2) NOT NULL,
    fee_currency VARCHAR(3) DEFAULT 'usd',
    original_amount DECIMAL(10,2) NOT NULL,
    fee_percentage DECIMAL(5,4) NOT NULL,
    fixed_fee DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    collected_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES profiles(id),
    referred_id UUID REFERENCES profiles(id),
    referral_code VARCHAR(12) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    credit_type VARCHAR(20) NOT NULL DEFAULT 'month',
    credit_awarded DECIMAL(10,2) DEFAULT 0,
    credit_used BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Add Stripe fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12),
ADD COLUMN IF NOT EXISTS referred_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS referral_credits_available DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_connect_accounts_user_id ON connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connect_accounts_stripe_id ON connect_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_connect_account ON orders(stripe_connect_account_id);
CREATE INDEX IF NOT EXISTS idx_application_fees_order_id ON application_fees(order_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- 7. Enable Row Level Security
ALTER TABLE connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies
CREATE POLICY connect_accounts_user_policy ON connect_accounts
    FOR ALL USING (auth.uid()::uuid = user_id);

CREATE POLICY application_fees_order_policy ON application_fees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = application_fees.order_id 
            AND (o.buyer_id = auth.uid()::uuid OR o.seller_id = auth.uid()::uuid)
        )
    );

CREATE POLICY referrals_user_policy ON referrals
    FOR ALL USING (
        auth.uid()::uuid = referrer_id OR auth.uid()::uuid = referred_id
    );

-- 9. Function to generate referral codes
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

-- 10. Trigger to auto-generate referral codes for new users
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_referral_code
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_referral_code();

-- 11. Grant permissions
GRANT ALL ON connect_accounts TO authenticated;
GRANT ALL ON application_fees TO authenticated;
GRANT ALL ON referrals TO authenticated;

-- Success message
SELECT 'KerbDrop Stripe Connect essential tables created successfully!' as message;
