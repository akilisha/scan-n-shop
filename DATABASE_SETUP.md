# 🗄️ Database Setup for Stripe Connect Marketplace

Before testing the seller onboarding, you need to create the required database tables in Supabase.

## Quick Setup (Copy & Paste)

**Copy this SQL and run it in your Supabase SQL Editor:**

```sql
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

-- 3. Add Stripe fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12),
ADD COLUMN IF NOT EXISTS referred_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS referral_credits_available DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_connect_accounts_user_id ON connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connect_accounts_stripe_id ON connect_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- 5. Enable Row Level Security
ALTER TABLE connect_accounts ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
CREATE POLICY connect_accounts_user_policy ON connect_accounts
    FOR ALL USING (auth.uid()::uuid = user_id);

-- 7. Grant permissions
GRANT ALL ON connect_accounts TO authenticated;

-- Success message
SELECT 'KerbDrop Stripe Connect essential tables created successfully!' as message;
```

## 📋 What This Creates

- **connect_accounts** - Stores Stripe Connect account data for sellers
- **Enhanced orders** - Adds seller_id and marketplace fields
- **Enhanced profiles** - Adds referral system fields
- **Indexes & Security** - Performance optimization and data protection

## 🧪 Testing the Setup

After running the SQL:

1. **Go to Profile page** → Click "Become a Seller"
2. **Fill out seller form** → Click "Create Seller Account"
3. **Complete Stripe onboarding** → Follow the external Stripe flow
4. **Return to KerbDrop** → Your seller account will be active

## 🔍 Verify Setup

Check that tables were created:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('connect_accounts');
```

## 🚨 Troubleshooting

- **Permission errors**: Make sure you're using the SQL Editor as an authenticated user
- **Table exists errors**: Safe to ignore - means table already exists
- **RLS errors**: Normal if policies already exist

---

**Next Steps:** After database setup, test the seller onboarding flow!
