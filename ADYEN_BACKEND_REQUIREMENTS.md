# Adyen Backend Integration Requirements

This document outlines what backend endpoints are needed to make the Adyen integration production-ready.

## Current Status

✅ **Frontend Integration**: Complete with real Adyen Web SDK  
⚠️ **Backend Integration**: Requires implementation for production  
✅ **Database Schema**: Ready for payment methods and orders  
✅ **Test Environment**: Working with test credentials

## Required Backend Endpoints

### 1. Create Payment Session

**Endpoint**: `POST /api/payments/sessions`

```typescript
// Request
{
  amount: number;
  currency: string;
  reference: string;
  shopperReference?: string; // User ID
}

// Response
{
  sessionData: string; // Base64 encoded session
  id: string;
  amount: { value: number; currency: string; }
}
```

**Backend Implementation**:

```javascript
// Call Adyen /sessions endpoint
const response = await adyen.checkout.sessions({
  amount: { currency, value: amount * 100 },
  reference,
  merchantAccount: "CraftedOnECOM",
  returnUrl: `${process.env.CLIENT_URL}/checkout/return`,
  countryCode: "US",
  shopperLocale: "en-US",
  channel: "Web",
});
```

### 2. Process Payment

**Endpoint**: `POST /api/payments/process`

```typescript
// Request
{
  paymentMethod: object;
  amount: { value: number; currency: string; }
  reference: string;
  shopperReference?: string;
  returnUrl: string;
}

// Response
{
  resultCode: string;
  pspReference?: string;
  action?: object; // For 3D Secure
}
```

### 3. Handle Payment Details (3D Secure)

**Endpoint**: `POST /api/payments/details`

```typescript
// Request
{
  details: object;
  paymentData?: string;
}

// Response
{
  resultCode: string;
  pspReference?: string;
}
```

### 4. Store Payment Method

**Endpoint**: `POST /api/payments/methods/store`

```typescript
// Request
{
  paymentMethod: object;
  shopperReference: string; // User ID
}

// Response
{
  resultCode: string;
  recurringDetailReference?: string;
  paymentMethod: object;
}
```

### 5. Webhook Handler

**Endpoint**: `POST /api/webhooks/adyen`

```typescript
// Handle Adyen notifications
// Verify HMAC signature
// Update order status in database
// Send confirmation emails
```

## Environment Variables (Backend)

```env
# Adyen Configuration
ADYEN_API_KEY=your_api_key
ADYEN_CLIENT_KEY=test_JQROZLAUB5F5HBNPELQMZYYSRIA4S64Q
ADYEN_MERCHANT_ACCOUNT=CraftedOnECOM
ADYEN_ENVIRONMENT=test
ADYEN_HMAC_KEY=your_hmac_key
ADYEN_WEBHOOK_SECRET=your_webhook_secret

# Application
CLIENT_URL=http://localhost:3000
API_URL=http://localhost:8000
```

## Database Updates Needed

Execute this SQL in your Supabase dashboard:

```sql
-- Create payment_methods table (add this to existing schema)
CREATE TABLE public.payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'card',
  last4 TEXT NOT NULL,
  brand TEXT NOT NULL,
  expiry_month INTEGER NOT NULL,
  expiry_year INTEGER NOT NULL,
  nickname TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  adyen_token TEXT, -- For storing Adyen recurring detail reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payment methods." ON public.payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods." ON public.payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods." ON public.payment_methods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods." ON public.payment_methods
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at_payment_methods
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
```

## Testing

### Test Cards (Adyen)

- **Visa**: 4111 1111 1111 1111
- **Mastercard**: 5555 4444 3333 1111
- **American Express**: 3700 0000 0000 002
- **3D Secure**: 4212 3456 7891 0006

### CVV: Any 3 digits (4 for Amex)

### Expiry: Any future date

## Security Considerations

1. **API Keys**: Never expose API keys on frontend
2. **HMAC Verification**: Always verify webhook signatures
3. **HTTPS**: All communication must use HTTPS
4. **PCI Compliance**: Use Adyen's secure fields
5. **Rate Limiting**: Implement on all endpoints
6. **Input Validation**: Validate all incoming data

## Next Steps

1. **Execute database schema** in Supabase
2. **Implement backend endpoints** using your preferred framework
3. **Configure webhooks** in Adyen Customer Area
4. **Test payment flow** end-to-end
5. **Set up monitoring** and error logging

The frontend is ready and will automatically connect to the backend endpoints when available!
