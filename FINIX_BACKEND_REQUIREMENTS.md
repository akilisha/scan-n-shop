# Finix Backend Integration Requirements

This document outlines what backend endpoints are needed to make the Finix integration production-ready.

## Current Status

✅ **Frontend Integration**: Complete with Finix payment forms  
⚠️ **Backend Integration**: Requires implementation for production  
✅ **Database Schema**: Ready for payment methods and orders  
✅ **Test Environment**: Working with sandbox credentials

## Required Backend Endpoints

### 1. Create Payment Session

**Endpoint**: `POST /api/payments/sessions`

```typescript
// Request
{
  amount: number;
  currency: string;
  reference: string;
  merchantId?: string; // Merchant ID
}

// Response
{
  sessionData: {
    id: string;
    amount: { value: number; currency: string };
    reference: string;
    applicationId: string;
  }
}
```

### 2. Process Payment

**Endpoint**: `POST /api/payments/process`

```typescript
// Request
{
  paymentMethod: {
    type: "PAYMENT_CARD";
    number: string;
    expiration_month: number;
    expiration_year: number;
    security_code: string;
    name: string;
  }
  amount: number;
  reference: string;
  merchantId: string;
}

// Response
{
  id: string;
  status: "succeeded" | "pending" | "failed";
  amount: number;
  pspReference: string;
}
```

### 3. Store Payment Method

**Endpoint**: `POST /api/payments/methods/store`

```typescript
// Request
{
  paymentMethod: {
    type: "PAYMENT_CARD";
    number: string;
    expiration_month: number;
    expiration_year: number;
    security_code: string;
    name: string;
  }
  merchantReference: string; // User ID
}

// Response
{
  id: string;
  last4: string;
  brand: string;
  type: string;
}
```

### 4. Create Merchant Account

**Endpoint**: `POST /api/merchants/create`

```typescript
// Request
{
  name: string;
  email: string;
  phone: string;
  bankAccount: {
    name: string;
    account_number: string;
    routing_number: string;
    type: "CHECKING" | "SAVINGS";
  }
  businessAddress: {
    line1: string;
    city: string;
    region: string;
    postal_code: string;
    country: string;
  }
}

// Response
{
  id: string;
  status: string;
  canAcceptPayments: boolean;
}
```

### 5. Webhook Handler

**Endpoint**: `POST /api/webhooks/finix`

```typescript
// Handle Finix notifications
// Verify HMAC signature
// Process events: merchant updates, transfer status, etc.
```

## Environment Variables

```env
# Finix Configuration
FINIX_USERNAME=your_username
FINIX_PASSWORD=your_password
FINIX_APPLICATION_ID=your_application_id
FINIX_ENVIRONMENT=sandbox
FINIX_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=postgresql://...

# App Configuration
CLIENT_URL=http://localhost:3000
```

## Database Schema Updates

### Payment Methods Table

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank', 'digital_wallet')),
  last4 TEXT,
  brand TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  finix_token TEXT, -- For storing Finix payment instrument reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### Orders Table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID REFERENCES profiles(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method JSONB,
  finix_transfer_id TEXT, -- Finix transfer reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

## Security Requirements

1. **API Authentication**: All endpoints require valid user session
2. **Input Validation**: Validate all payment data before processing
3. **HTTPS**: All communication must use HTTPS
4. **PCI Compliance**: Use Finix's secure tokenization
5. **Rate Limiting**: Implement on all endpoints

## Implementation Steps

1. **Set up Finix SDK** in your backend framework
2. **Implement backend endpoints** using your preferred framework
3. **Configure webhooks** in Finix dashboard
4. **Test payment flow** end-to-end

## Test Cards (Finix)

```javascript
// Successful payments
"4242424242424242"; // Visa
"5555555555554444"; // Mastercard

// Failed payments
"4000000000000002"; // Generic decline
"4000000000009995"; // Insufficient funds
```

## Security Notes

1. **Never log sensitive data**: Card numbers, CVV, etc.
2. **Use Finix tokenization**: Store tokens, not raw card data
3. **Implement proper error handling**: Don't expose internal errors
4. **Monitor transactions**: Set up alerts for unusual activity
