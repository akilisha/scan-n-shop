# Finix Integration Guide for Local Marketplace

## 🎯 Overview

This guide will help you integrate Finix payment processing into your local marketplace app, enabling seller onboarding, commission handling, and automated payouts.

## 📋 Prerequisites

- [ ] Finix account setup
- [ ] Backend API endpoints for Finix integration
- [ ] SSL certificate for production
- [ ] Business verification documents ready

---

## 🏗️ Phase 1: Finix Account Setup

### 1.1 Create Finix Account

1. Visit [Finix.com](https://finix.com) and sign up for a platform account
2. Choose **"Marketplace/Platform"** as your business type
3. Complete business verification with:
   - Business registration documents
   - EIN (Employer Identification Number)
   - Bank account for your platform fees
   - Business address and contact information

### 1.2 Get API Credentials

After account approval, obtain:

- **Application ID** (starts with `AP`)
- **Username** (for Basic Auth)
- **Password** (for Basic Auth)
- **Webhook URL** (for notifications)

### 1.3 Environment Configuration

```bash
# Add to your environment variables
FINIX_APPLICATION_ID=APxxxxxxxxxxxxxxxxxx
FINIX_USERNAME=USxxxxxxxxxxxxxxxxxx
FINIX_PASSWORD=your_password_here
FINIX_ENVIRONMENT=sandbox  # Change to 'live' for production
FINIX_WEBHOOK_SECRET=your_webhook_secret
```

---

## 🔌 Phase 2: Backend API Integration

### 2.1 Install Finix SDK

```bash
# For Node.js backend
npm install finix

# For Python backend
pip install finix

# For Ruby backend
gem install finix
```

### 2.2 Core API Endpoints to Implement

#### A. Create Merchant Account (Seller Onboarding)

```javascript
// POST /api/sellers/create-merchant
async function createMerchantAccount(sellerData) {
  const merchant = await finix.merchants.create({
    name: sellerData.businessName,
    email: sellerData.email,
    phone: sellerData.phone,
    business_type: "INDIVIDUAL_SOLE_PROPRIETORSHIP", // or appropriate type
    has_accepted_credit_cards_previously: false,
    default_statement_descriptor: "YOUR_MARKETPLACE",

    // Bank account details
    bank_account: {
      name: sellerData.accountHolderName,
      account_number: sellerData.accountNumber,
      routing_number: sellerData.routingNumber,
      type: "CHECKING", // or "SAVINGS"
    },

    // Address information
    business_address: {
      line1: sellerData.address.line1,
      city: sellerData.address.city,
      region: sellerData.address.state,
      postal_code: sellerData.address.zipCode,
      country: "USA",
    },
  });

  return merchant;
}
```

#### B. Process Payment with Commission Split

```javascript
// POST /api/payments/process
async function processPayment(paymentData) {
  // Create payment instrument (buyer's card)
  const paymentInstrument = await finix.paymentInstruments.create({
    name: paymentData.cardholderName,
    number: paymentData.cardNumber,
    expiration_month: paymentData.expiryMonth,
    expiration_year: paymentData.expiryYear,
    security_code: paymentData.cvv,
    type: "PAYMENT_CARD",
  });

  // Create transfer with fee
  const transfer = await finix.transfers.create({
    amount: paymentData.totalAmount, // in cents
    currency: "USD",
    merchant: paymentData.sellerId,
    source: paymentInstrument.id,

    // Your platform fee
    fee: Math.round(paymentData.totalAmount * 0.029), // 2.9% example

    tags: {
      order_id: paymentData.orderId,
      buyer_id: paymentData.buyerId,
    },
  });

  return transfer;
}
```

#### C. Merchant Verification Status

```javascript
// GET /api/sellers/{sellerId}/verification-status
async function getMerchantVerificationStatus(merchantId) {
  const merchant = await finix.merchants.get(merchantId);

  return {
    status: merchant.verification?.merchant_identity?.status,
    canAcceptPayments: merchant.can_accept_payments,
    requiredFields:
      merchant.verification?.merchant_identity?.required_fields || [],
  };
}
```

#### D. Initiate Payout

```javascript
// POST /api/sellers/{sellerId}/payout
async function initiatePayout(merchantId, amount) {
  const payout = await finix.transfers.create({
    amount: amount, // in cents
    currency: "USD",
    merchant: merchantId,
    destination: "bank_account", // Uses merchant's default bank account
    type: "DEBIT",
  });

  return payout;
}
```

### 2.3 Webhook Handling

```javascript
// POST /webhooks/finix
app.post("/webhooks/finix", (req, res) => {
  const event = req.body;

  switch (event.type) {
    case "created":
      if (event.entity === "merchant") {
        // Handle merchant account created
        handleMerchantCreated(event.merchant);
      }
      break;

    case "updated":
      if (event.entity === "merchant") {
        // Handle merchant verification updates
        handleMerchantUpdated(event.merchant);
      }
      break;

    case "succeeded":
      if (event.entity === "transfer") {
        // Handle successful payment
        handlePaymentSucceeded(event.transfer);
      }
      break;

    case "failed":
      if (event.entity === "transfer") {
        // Handle failed payment
        handlePaymentFailed(event.transfer);
      }
      break;
  }

  res.status(200).send("OK");
});
```

---

## 📱 Phase 3: Frontend Integration

### 3.1 Update Environment Variables

```typescript
// src/lib/config.ts
export const config = {
  finix: {
    applicationId: import.meta.env.VITE_FINIX_APPLICATION_ID,
    environment: import.meta.env.VITE_FINIX_ENVIRONMENT || "sandbox",
  },
};
```

### 3.2 Create Finix Service

```typescript
// src/lib/finix.ts
export class FinixService {
  private apiUrl: string;

  constructor() {
    this.apiUrl =
      config.finix.environment === "live"
        ? "https://finix.com/api"
        : "https://finix-sandbox.com/api";
  }

  async createMerchantAccount(data: MerchantData) {
    const response = await fetch("/api/sellers/create-merchant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async processPayment(data: PaymentData) {
    const response = await fetch("/api/payments/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return response.json();
  }
}
```

### 3.3 Update Seller Onboarding Flow

The current `SellerSubscription.tsx` component already has the structure. Update the `handleBankSetup` function:

```typescript
const handleBankSetup = async () => {
  setIsProcessing(true);

  try {
    const merchantData = {
      businessName: user?.name || bankDetails.accountHolderName,
      email: user?.email,
      phone: user?.phone,
      accountHolderName: bankDetails.accountHolderName,
      accountNumber: bankDetails.accountNumber,
      routingNumber: bankDetails.routingNumber,
      // Add address fields as needed
    };

    const result = await finixService.createMerchantAccount(merchantData);

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Store merchant ID in user profile
    await updateUserProfile({ finixMerchantId: result.id });

    // Grant seller access
    localStorage.setItem("demo_seller_access", "true");

    setIsProcessing(false);
    setCurrentStep("complete");
  } catch (error) {
    console.error("Finix merchant creation failed:", error);
    setIsProcessing(false);
  }
};
```

---

## 🧪 Phase 4: Testing

### 4.1 Test Data (Sandbox)

Use these test values in sandbox:

**Test Bank Account:**

- Routing Number: `011401533`
- Account Number: `123456789`

**Test Credit Cards:**

- Visa: `4242424242424242`
- Mastercard: `5555555555554444`
- Declined: `4000000000000002`

### 4.2 Verification Testing

1. Create merchant with test data
2. Check verification status endpoint
3. Process test payment
4. Verify commission split
5. Test payout initiation

---

## 🚀 Phase 5: Production Deployment

### 5.1 Business Verification

Complete Finix business verification:

- Business license
- Bank account verification
- Tax ID verification
- Beneficial ownership disclosure

### 5.2 Security Checklist

- [ ] SSL certificate installed
- [ ] Webhook signature verification
- [ ] PCI compliance (if storing card data)
- [ ] API key security (server-side only)
- [ ] Rate limiting implemented

### 5.3 Go-Live Steps

1. Switch environment variables to `live`
2. Update webhook URLs to production
3. Test with small amounts first
4. Monitor transactions closely
5. Set up alerts for failed payments

---

## 📊 Phase 6: Monitoring & Analytics

### 6.1 Key Metrics to Track

- Merchant onboarding success rate
- Payment success rate
- Average payout time
- Commission collected
- Failed payment reasons

### 6.2 Dashboard Integration

Create admin dashboard to monitor:

- Total transaction volume
- Platform revenue
- Merchant status
- Payout schedules

---

## 🔧 Common Integration Issues & Solutions

### Issue 1: Merchant Verification Delays

**Solution:** Provide clear guidance on required documents and follow up proactively.

### Issue 2: Bank Account Verification Failures

**Solution:** Implement micro-deposit verification as fallback.

### Issue 3: Payment Failures

**Solution:** Implement retry logic and clear error messaging.

### Issue 4: Webhook Reliability

**Solution:** Implement idempotency and webhook replay functionality.

---

## 📞 Support Resources

- **Finix Documentation:** [docs.finix.com](https://docs.finix.com)
- **Support Email:** support@finix.com
- **Developer Slack:** [finix-community.slack.com](https://finix-community.slack.com)
- **Status Page:** [status.finix.com](https://status.finix.com)

---

## 🎯 Next Steps

1. **Immediate:** Set up Finix sandbox account
2. **Week 1:** Implement core backend endpoints
3. **Week 2:** Update frontend integration
4. **Week 3:** Complete testing and verification
5. **Week 4:** Production deployment and monitoring

**You've got this! Finix will be a game-changer for your marketplace. Let me know when you're ready to dive into any specific phase.** 🚀
