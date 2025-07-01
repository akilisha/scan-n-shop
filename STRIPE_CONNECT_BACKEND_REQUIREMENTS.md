# Stripe Connect Backend Requirements

This document outlines the backend implementation requirements to make the Stripe Connect integration production-ready for KerbDrop's marketplace platform.

## Current Status

✅ **Frontend Integration**: Complete with Stripe payment forms and Connect onboarding  
⚠️ **Backend Integration**: Requires implementation for production  
✅ **Database Schema**: Ready for payment methods, orders, and referrals  
✅ **Test Environment**: Working with development stubs

## Required Backend Endpoints

### 1. Payment Intent Management

#### Create Payment Intent

**Endpoint**: `POST /api/payments/create-payment-intent`

```typescript
// Request
{
  amount: number;              // Amount in cents (e.g., 2999 for $29.99)
  currency: string;            // Currency code (default: "usd")
  reference: string;           // Order/transaction reference
  connectedAccountId?: string; // Seller's Stripe Connect account ID (optional)
}

// Response
{
  client_secret: string;       // For frontend payment confirmation
  payment_intent_id: string;   // Stripe payment intent ID
  amount: number;             // Confirmed amount in cents
  currency: string;           // Confirmed currency
}
```

**Implementation Notes:**

- Use `stripe.paymentIntents.create()` with Connect account if provided
- Calculate and apply application fees for marketplace transactions
- Add metadata for tracking and reconciliation

#### Confirm Payment Intent

**Endpoint**: `POST /api/payments/confirm-payment`

```typescript
// Request
{
  paymentIntentId: string;
  paymentMethodId?: string;
  connectedAccountId?: string;
}

// Response
{
  payment_intent: object;      // Full Stripe PaymentIntent object
  status: string;             // Payment status
}
```

### 2. Setup Intent Management (Saved Payment Methods)

#### Create Setup Intent

**Endpoint**: `POST /api/payments/create-setup-intent`

```typescript
// Request
{
  customerId?: string;         // Stripe customer ID
  connectedAccountId?: string; // For merchant-specific saved methods
}

// Response
{
  client_secret: string;       // For frontend setup confirmation
  setup_intent_id: string;     // Stripe setup intent ID
}
```

### 3. Stripe Connect Account Management

#### Create Connect Account

**Endpoint**: `POST /api/connect/create-account`

```typescript
// Request
{
  type: "express" | "standard"; // Account type
  business_type: "individual" | "company"; // Business structure
}

// Response
{
  account_id: string; // Stripe Connect account ID
  type: string; // Account type
  business_type: string; // Business type
  charges_enabled: boolean; // Can accept payments
  payouts_enabled: boolean; // Can receive payouts
  details_submitted: boolean; // Onboarding completed
  created: number; // Unix timestamp
}
```

#### Create Account Link (Onboarding)

**Endpoint**: `POST /api/connect/create-account-link`

```typescript
// Request
{
  account: string;            // Stripe Connect account ID
  refresh_url: string;        // URL for restarting onboarding
  return_url: string;         // URL after successful onboarding
  type?: string;             // Default: "account_onboarding"
}

// Response
{
  url: string;               // Stripe onboarding URL
  expires_at: number;        // Link expiration timestamp
}
```

#### Get Account Details

**Endpoint**: `GET /api/connect/account/{accountId}`

```typescript
// Response
{
  id: string;
  type: string;
  business_type: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: {
    currently_due: string[];    // Fields that must be provided
    eventually_due: string[];   // Fields that will be required
    past_due: string[];        // Overdue requirements
    pending_verification: string[]; // Under review
  };
  capabilities: {
    card_payments: "active" | "inactive" | "pending";
    transfers: "active" | "inactive" | "pending";
  };
  created: number;
}
```

### 4. Subscription Management

#### Create Subscription

**Endpoint**: `POST /api/subscriptions/create`

```typescript
// Request
{
  customerId: string;         // Stripe customer ID
  priceId: string;           // Stripe price ID for subscription
  connectedAccountId?: string; // For marketplace subscriptions
}

// Response
{
  subscription_id: string;    // Stripe subscription ID
  client_secret?: string;     // If payment required
  status: string;            // Subscription status
}
```

#### Cancel Subscription

**Endpoint**: `POST /api/subscriptions/{subscriptionId}/cancel`

```typescript
// Request
{
  connectedAccountId?: string;
  cancelAtPeriodEnd?: boolean; // Default: true
}

// Response
{
  subscription_id: string;
  status: string;
  cancel_at_period_end: boolean;
  canceled_at?: number;      // Unix timestamp if immediately canceled
}
```

### 5. Referral System

#### Generate Referral Code

**Endpoint**: `POST /api/referrals/generate-code`

```typescript
// Request
{
  userId: string; // User ID from your system
}

// Response
{
  code: string; // Generated referral code (e.g., "KERB12AB34CD")
  userId: string; // Referrer user ID
  created: string; // ISO date string
}
```

#### Apply Referral Code

**Endpoint**: `POST /api/referrals/apply-code`

```typescript
// Request
{
  code: string; // Referral code
  newUserId: string; // New user's ID
}

// Response
{
  success: boolean;
  code: string;
  referrerId: string; // Original referrer's user ID
  creditAwarded: number; // Credits/months awarded
  message: string;
}
```

#### Get Referral Stats

**Endpoint**: `GET /api/referrals/stats/{userId}`

```typescript
// Response
{
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalCredits: number; // Total earned
  availableCredits: number; // Available for use
  usedCredits: number; // Already applied
  referralCode: string; // Current active code
  recentReferrals: Array<{
    id: string;
    referredEmail: string;
    status: "pending" | "completed" | "failed";
    creditAwarded: number;
    createdAt: string;
    completedAt?: string;
  }>;
}
```

### 6. Customer Management

#### Create Customer

**Endpoint**: `POST /api/customers/create`

```typescript
// Request
{
  email: string;
  name?: string;
  phone?: string;
  metadata?: object;        // Custom data
}

// Response
{
  customer_id: string;      // Stripe customer ID
  email: string;
  created: number;
}
```

### 7. Webhook Handler

#### Stripe Webhooks

**Endpoint**: `POST /api/payments/webhooks/stripe`

**Content-Type**: `application/json`  
**Headers**: `stripe-signature` (required for verification)

**Supported Events:**

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `account.updated`
- `account.application.deauthorized`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`

## Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id_here

# Application Fee Configuration
STRIPE_APPLICATION_FEE_PERCENT=0.029    # 2.9%
STRIPE_APPLICATION_FEE_FIXED=30         # 30 cents

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# App Configuration
CLIENT_URL=http://localhost:3000
API_BASE_URL=http://localhost:8000
NODE_ENV=development
```

## Database Schema Requirements

### Users Table Updates

```sql
-- Add Stripe-related fields to existing users/profiles table
ALTER TABLE profiles ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN stripe_connect_account_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN referral_code VARCHAR(12);
ALTER TABLE profiles ADD COLUMN referred_by VARCHAR(255);

-- Add indexes for performance
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX idx_profiles_connect_account ON profiles(stripe_connect_account_id);
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
```

### Payment Methods Table

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('card', 'us_bank_account', 'link')),
  brand VARCHAR(50),
  last4 VARCHAR(4),
  exp_month INTEGER,
  exp_year INTEGER,
  nickname VARCHAR(100),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(stripe_payment_method_id)
);

CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default);
```

### Orders Table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID REFERENCES profiles(id),
  stripe_payment_intent_id VARCHAR(255),
  stripe_connect_account_id VARCHAR(255),
  total_amount DECIMAL(10,2) NOT NULL,
  application_fee DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  items JSONB,
  shipping_address JSONB,
  billing_address JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_payment_intent ON orders(stripe_payment_intent_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  plan_id VARCHAR(100) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  price_amount DECIMAL(10,2),
  price_currency VARCHAR(3) DEFAULT 'usd',
  price_interval VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(stripe_subscription_id)
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_customer ON subscriptions(stripe_customer_id);
```

### Referrals Table

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id),
  referred_id UUID REFERENCES profiles(id),
  referral_code VARCHAR(12) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  credit_awarded DECIMAL(10,2) DEFAULT 0,
  credit_used BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);
```

### Connect Accounts Table

```sql
CREATE TABLE connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_account_id VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) NOT NULL,
  business_type VARCHAR(20) NOT NULL,
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  details_submitted BOOLEAN DEFAULT FALSE,
  requirements JSONB,
  capabilities JSONB,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(stripe_account_id),
  UNIQUE(user_id)
);

CREATE INDEX idx_connect_accounts_user ON connect_accounts(user_id);
CREATE INDEX idx_connect_accounts_stripe_id ON connect_accounts(stripe_account_id);
```

## Implementation Examples

### 1. Create Payment Intent (Node.js/Express)

```javascript
const express = require("express");
const router = express.Router();
const { stripe } = require("../config/stripe");

router.post("/create-payment-intent", async (req, res) => {
  try {
    const {
      amount,
      currency = "usd",
      reference,
      connectedAccountId,
    } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Invalid amount",
        message: "Amount must be greater than 0",
      });
    }

    // Calculate application fee for marketplace transactions
    const applicationFee = connectedAccountId
      ? Math.round(amount * 0.029) + 30 // 2.9% + 30¢
      : null;

    const paymentIntentData = {
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        reference: reference || `payment_${Date.now()}`,
        created_via: "kerbdrop_api",
      },
    };

    // Add Connect-specific fields if marketplace transaction
    if (connectedAccountId && applicationFee) {
      paymentIntentData.application_fee_amount = applicationFee;
      paymentIntentData.transfer_data = {
        destination: connectedAccountId,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    res.status(500).json({
      error: "Payment intent creation failed",
      message: error.message,
    });
  }
});

module.exports = router;
```

### 2. Create Connect Account

```javascript
router.post("/connect/create-account", async (req, res) => {
  try {
    const { type = "express", business_type = "individual" } = req.body;

    const account = await stripe.accounts.create({
      type,
      business_type,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: { interval: "daily" },
        },
      },
    });

    // Save to database
    await db.connect_accounts.create({
      user_id: req.user.id,
      stripe_account_id: account.id,
      account_type: type,
      business_type,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });

    res.json({
      account_id: account.id,
      type: account.type,
      business_type: account.business_type,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      created: account.created,
    });
  } catch (error) {
    console.error("Connect account creation error:", error);
    res.status(500).json({
      error: "Account creation failed",
      message: error.message,
    });
  }
});
```

### 3. Webhook Handler with Signature Verification

```javascript
router.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleSubscriptionPayment(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  },
);

async function handlePaymentSucceeded(paymentIntent) {
  // Update order status in database
  await db.orders.update(
    {
      status: "completed",
      updated_at: new Date(),
    },
    {
      where: { stripe_payment_intent_id: paymentIntent.id },
    },
  );

  // Send confirmation email, update inventory, etc.
}
```

## Security Requirements

### 1. API Authentication

- All endpoints require valid user session/JWT
- Rate limiting on all payment endpoints
- Input validation and sanitization

### 2. Stripe Integration Security

- Webhook signature verification mandatory
- Use HTTPS for all communication
- Store Stripe IDs, never sensitive card data
- Implement idempotency keys for critical operations

### 3. PCI Compliance

- Never log sensitive payment data
- Use Stripe's secure tokenization
- Implement proper error handling without exposing internals

### 4. Database Security

- Encrypt sensitive fields at rest
- Use prepared statements to prevent SQL injection
- Regular security audits and updates

## Testing Strategy

### 1. Unit Tests

- Test each endpoint with valid/invalid inputs
- Mock Stripe API calls for consistent testing
- Test error handling and edge cases

### 2. Integration Tests

- End-to-end payment flows
- Webhook delivery and processing
- Connect account onboarding

### 3. Test Data

Use Stripe's test mode with these test cards:

```javascript
// Successful payments
"4242424242424242"; // Visa
"5555555555554444"; // Mastercard
"378282246310005"; // American Express

// Failed payments
"4000000000000002"; // Generic decline
"4000000000009995"; // Insufficient funds
"4000000000009987"; // Lost card
```

## Monitoring and Analytics

### 1. Key Metrics

- Payment success rate
- Average transaction value
- Connect account activation rate
- Referral conversion rate
- Application fee revenue

### 2. Logging

- All payment attempts and results
- Webhook delivery status
- Error rates and types
- Performance metrics

### 3. Alerting

- Failed webhook deliveries
- High payment failure rates
- Unusual referral activity
- System errors and downtime

## Deployment Checklist

### Pre-Production

- [ ] All endpoints implemented and tested
- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Webhook endpoints set up in Stripe dashboard
- [ ] SSL certificates configured

### Production

- [ ] Switch to live Stripe keys
- [ ] Update webhook URLs to production
- [ ] Configure monitoring and alerting
- [ ] Test critical payment flows
- [ ] Set up backup and recovery procedures

### Post-Launch

- [ ] Monitor payment success rates
- [ ] Track key business metrics
- [ ] Gather user feedback
- [ ] Plan iterative improvements

## Support and Maintenance

### Documentation

- API documentation for internal teams
- Troubleshooting guides
- Runbook for common issues

### Monitoring

- Real-time dashboard for payment health
- Regular reporting on key metrics
- Automated alerts for critical issues

### Updates

- Regular Stripe SDK updates
- Security patches and improvements
- Feature enhancements based on usage

---

This comprehensive backend implementation will provide a robust foundation for KerbDrop's marketplace functionality with Stripe Connect, enabling secure payment processing, merchant onboarding, and the referral reward system.
