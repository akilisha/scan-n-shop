-- QUICK DATABASE SETUP - Copy and paste this into Supabase SQL Editor

-- 1. Create connect_accounts table
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

-- 2. Enable RLS and create policy
ALTER TABLE connect_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY connect_accounts_user_policy ON connect_accounts
    FOR ALL USING (auth.uid()::uuid = user_id);

-- 3. Grant permissions
GRANT ALL ON connect_accounts TO authenticated;

-- 4. Create index
CREATE INDEX IF NOT EXISTS idx_connect_accounts_user_id ON connect_accounts(user_id);

SELECT 'Database setup complete! You can now test seller onboarding.' as message;
