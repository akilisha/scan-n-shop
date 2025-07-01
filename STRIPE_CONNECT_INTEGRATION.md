# Stripe Connect Integration Guide

This document outlines the complete Stripe Connect integration for KerbDrop, including payment processing, merchant onboarding, and the referral system.

## Overview

KerbDrop uses Stripe Connect to enable marketplace functionality where sellers can accept payments directly while the platform takes a small application fee. This integration supports:

- Express and Standard Connect accounts
- Marketplace payment splitting
- Automated fee collection
- Referral system with fee waivers
- Comprehensive merchant onboarding

## Features

### 🎯 Stripe Connect Express Accounts

- Simplified onboarding for individual sellers
- Automatic verification process
- Express checkout and payment methods
- Real-time status tracking

### 💳 Payment Processing

- Support for all major payment methods
- Real-time payment confirmation
- Automatic fee splitting
- Subscription management for recurring payments

### 🎁 Referral System

- Automated referral code generation
- One month fee waiver per successful referral
- Real-time tracking and analytics
- Social sharing capabilities

### 🏪 Merchant Onboarding

- Step-by-step guided setup
- Stripe Connect account creation
- Verification status monitoring
- Seamless dashboard integration

## Environment Configuration

Create a `.env` file with the following Stripe Connect variables:

```env
# Stripe Connect Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_ENVIRONMENT=test
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id_here
STRIPE_APPLICATION_FEE_PERCENT=0.029
STRIPE_APPLICATION_FEE_FIXED=30
```

### Environment Variables Explained

- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key for frontend
- `STRIPE_SECRET_KEY`: Stripe secret key for backend operations
- `STRIPE_WEBHOOK_SECRET`: Secret for webhook signature verification
- `STRIPE_CONNECT_CLIENT_ID`: Connect application client ID
- `STRIPE_APPLICATION_FEE_PERCENT`: Platform fee percentage (2.9%)
- `STRIPE_APPLICATION_FEE_FIXED`: Fixed fee per transaction (30 cents)

## Frontend Components

### Payment Components

#### StripePaymentForm

Real Stripe integration component for production use:

```tsx
import StripePaymentForm from "@/components/StripePaymentForm";

<StripePaymentForm
  amount={2999} // $29.99 in cents
  currency="usd"
  onSuccess={handlePaymentSuccess}
  onError={handlePaymentError}
  connectedAccountId="acct_seller123" // Optional for marketplace
  showExpressCheckout={true}
  customerEmail="customer@example.com"
/>;
```

#### StripePaymentFormStub

Development/testing component with mock payment flows:

```tsx
import StripePaymentFormStub from "@/components/StripePaymentFormStub";

<StripePaymentFormStub
  amount={2999}
  onSuccess={handlePaymentSuccess}
  onError={handlePaymentError}
/>;
```

### Merchant Onboarding

#### StripeConnectOnboarding

Complete onboarding flow for merchants:

```tsx
import StripeConnectOnboarding from "@/components/StripeConnectOnboarding";

<StripeConnectOnboarding
  userId={user.id}
  onComplete={handleOnboardingComplete}
  onError={handleOnboardingError}
  existingAccountId={existingAccountId}
/>;
```

### Referral System

#### ReferralDashboard

Comprehensive referral management:

```tsx
import ReferralDashboard from "@/components/ReferralDashboard";

<ReferralDashboard
  userId={user.id}
  userEmail={user.email}
  isSellerMode={true}
/>;
```

## Backend API Endpoints

### Payment Intents

#### Create Payment Intent

```
POST /api/payments/create-payment-intent
```

```json
{
  "amount": 2999,
  "currency": "usd",
  "reference": "order_123",
  "connectedAccountId": "acct_seller123"
}
```

#### Confirm Payment

```
POST /api/payments/confirm-payment
```

```json
{
  "paymentIntentId": "pi_test_123",
  "paymentMethodId": "pm_test_123",
  "connectedAccountId": "acct_seller123"
}
```

### Connect Account Management

#### Create Connect Account

```
POST /api/connect/create-account
```

```json
{
  "type": "express",
  "business_type": "individual"
}
```

#### Create Account Link

```
POST /api/connect/create-account-link
```

```json
{
  "account": "acct_seller123",
  "refresh_url": "https://yourapp.com/seller/onboarding?refresh=true",
  "return_url": "https://yourapp.com/seller/onboarding?success=true"
}
```

#### Get Account Details

```
GET /api/connect/account/{accountId}
```

### Subscription Management

#### Create Subscription

```
POST /api/subscriptions/create
```

```json
{
  "customerId": "cus_customer123",
  "priceId": "price_monthly",
  "connectedAccountId": "acct_seller123"
}
```

#### Cancel Subscription

```
POST /api/subscriptions/{subscriptionId}/cancel
```

```json
{
  "connectedAccountId": "acct_seller123",
  "cancelAtPeriodEnd": true
}
```

### Referral System

#### Generate Referral Code

```
POST /api/referrals/generate-code
```

```json
{
  "userId": "user_123"
}
```

#### Apply Referral Code

```
POST /api/referrals/apply-code
```

```json
{
  "code": "KERB12345678",
  "newUserId": "user_456"
}
```

#### Get Referral Stats

```
GET /api/referrals/stats/{userId}
```

## Webhook Handling

### Webhook Endpoint

```
POST /api/payments/webhooks/stripe
```

### Supported Events

- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `account.updated` - Connect account status changed
- `account.application.deauthorized` - Account disconnected
- `invoice.payment_succeeded` - Subscription payment succeeded
- `invoice.payment_failed` - Subscription payment failed
- `customer.subscription.deleted` - Subscription canceled

### Webhook Security

Webhooks are secured using Stripe's signature verification:

```javascript
const sig = req.headers["stripe-signature"];
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET,
);
```

## Referral System Details

### How It Works

1. **Code Generation**: Each user gets a unique referral code (e.g., `KERB12AB34CD`)
2. **Sharing**: Users share codes via link or social media
3. **Sign-up**: New users enter code during registration
4. **Validation**: System validates code and creates referral record
5. **Rewards**: Both referrer and referee receive benefits

### Benefits Structure

#### For Sellers (Referrers)

- 1 month of seller fees waived per successful referral
- Cumulative credits that can be applied to future billing
- Real-time tracking of referral status and earnings

#### For New Users (Referees)

- First month free on any seller plan
- Access to premium features during trial period
- Welcome bonus credits for initial transactions

### Referral Code Format

```
KERB + [8 chars from User ID] + [4 chars timestamp]
Example: KERB12AB34CD
```

### Validation Rules

- Codes expire after 1 year
- Users cannot refer themselves
- Maximum 50 referrals per user per year
- Only successful sign-ups with verified payment methods count

## Marketplace Fee Structure

### Application Fees

- **Percentage Fee**: 2.9% of transaction amount
- **Fixed Fee**: 30¢ per transaction
- **Maximum Fee**: Cannot exceed transaction amount

### Fee Calculation Example

```javascript
const calculateApplicationFee = (amount) => {
  const percentageFee = Math.round(amount * 0.029);
  const totalFee = percentageFee + 30; // 30 cents fixed fee
  return Math.min(totalFee, amount);
};

// For a $100 transaction:
// Percentage fee: $100 × 2.9% = $2.90
// Fixed fee: $0.30
// Total fee: $3.20
```

### Payout Schedule

- **Express Accounts**: Daily automatic payouts
- **Standard Accounts**: Configurable (daily, weekly, monthly)
- **Minimum Payout**: $1.00
- **Currency**: USD (expandable to other currencies)

## Testing

### Test Cards

#### Successful Payments

- `4242424242424242` - Visa
- `5555555555554444` - Mastercard
- `378282246310005` - American Express

#### Error Scenarios

- `4000000000000002` - Card declined
- `4000000000009995` - Insufficient funds
- `4000000000009987` - Lost card
- `4000000000009979` - Stolen card

### Test Connect Accounts

Stripe provides test Connect accounts for development:

- All test data is automatically cleared
- No real money transactions
- Full API functionality available

### Development Mode

The app includes stub components for development:

- `StripePaymentFormStub` - Mock payment form
- Mock referral data
- Simulated onboarding flows

## Production Deployment

### Pre-deployment Checklist

1. **Environment Variables**
   - [ ] Production Stripe keys configured
   - [ ] Webhook endpoints set up
   - [ ] Application fees configured

2. **Stripe Dashboard Setup**
   - [ ] Connect application created
   - [ ] Webhook endpoints configured
   - [ ] Business verification completed

3. **Security**
   - [ ] Webhook signature verification enabled
   - [ ] HTTPS enforced for all endpoints
   - [ ] API rate limiting configured

4. **Testing**
   - [ ] End-to-end payment flows tested
   - [ ] Webhook delivery confirmed
   - [ ] Error handling validated

### Monitoring

#### Key Metrics to Track

- Payment success rate
- Average transaction value
- Connect account activation rate
- Referral conversion rate
- Application fee revenue

#### Alerting

Set up alerts for:

- Failed webhook deliveries
- High payment failure rates
- Unusual referral activity
- Connect account issues

## Security Considerations

### Data Protection

- Payment data never stored on your servers
- PCI compliance handled by Stripe
- Sensitive data encrypted in transit and at rest

### API Security

- All API requests authenticated
- Rate limiting on sensitive endpoints
- Input validation on all parameters
- SQL injection prevention

### Webhook Security

- Signature verification required
- Replay attack prevention
- Secure endpoint configuration

## Support and Resources

### Documentation

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Payment Intents API](https://stripe.com/docs/api/payment_intents)

### Development Tools

- [Stripe CLI](https://stripe.com/docs/stripe-cli) for webhook testing
- [Stripe Dashboard](https://dashboard.stripe.com/) for monitoring
- [API Logs](https://dashboard.stripe.com/logs) for debugging

### Getting Help

- Stripe Support: [support.stripe.com](https://support.stripe.com/)
- Community: [github.com/stripe/stripe-node](https://github.com/stripe/stripe-node)
- Documentation: [stripe.com/docs](https://stripe.com/docs)

## Migration Notes

This integration replaces the previous Finix implementation. Key changes:

### Updated Components

- `FinixPaymentForm` → `StripePaymentForm`
- `finix.ts` → `stripe.ts`
- `finix.css` → `stripe.css`

### Environment Variables

- `VITE_FINIX_*` → `VITE_STRIPE_*`
- New webhook and Connect-specific variables

### API Endpoints

- `/api/finix/*` → `/api/payments/*`
- New `/api/connect/*` endpoints
- Updated webhook endpoints

### Benefits of Migration

- Lower barrier to entry with transparent pricing
- Extensive documentation and community support
- Well-known brand with high merchant trust
- Rich ecosystem of tools and integrations
- Better support for marketplace use cases

---

This Stripe Connect integration provides a robust foundation for KerbDrop's marketplace functionality while maintaining security, scalability, and user experience standards.
