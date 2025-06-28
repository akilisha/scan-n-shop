# 🚨 Database Update Required

## New Subscriptions Table Added

The seller subscription feature now requires a new `subscriptions` table in your Supabase database.

### ⚡ Quick Setup

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Run this SQL:**

```sql
-- Create subscriptions table for seller plans
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions table
CREATE POLICY "Users can view their own subscriptions." ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions." ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions." ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
```

### ✅ What This Enables

- **Real Seller Subscriptions** - Users can actually subscribe to seller plans
- **Database Persistence** - Subscriptions are saved permanently
- **Seller Access Control** - Proper seller access management
- **Subscription Management** - Cancel, pause, resume subscriptions

### 🧪 Testing the Fix

1. **Sign in to your app**
2. **Click the "Seller/Upgrade" tab**
3. **Select a subscription plan**
4. **Complete the subscription process**
5. **Verify seller access is granted**

The seller subscription upgrade should now work perfectly! 🎉

---

**Need help?** Check the full database setup in `SUPABASE_SETUP.md`
