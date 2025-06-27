# Adyen Integration Guide

This project has been successfully integrated with Adyen payment processing, replacing the previous Stripe integration.

## Configuration

### Environment Variables

Create a `.env` file with your Adyen credentials:

```env
VITE_ADYEN_CLIENT_KEY=test_JQROZLAUB5F5HBNPELQMZYYSRIA4S64Q
VITE_ADYEN_ENVIRONMENT=test
VITE_ADYEN_MERCHANT_ACCOUNT=CraftedOnECOM
```

### Supported Payment Methods

1. **Credit/Debit Cards**

   - Visa, Mastercard, American Express
   - 3D Secure authentication support
   - Card validation and storage

2. **Digital Wallets**
   - Apple Pay (iOS Safari)
   - Google Pay (Android Chrome)

## Integration Details

### Key Files

- `src/lib/adyen.ts` - Adyen configuration and utilities
- `src/components/AdyenPaymentForm.tsx` - Main payment form component
- `src/styles/adyen.css` - Custom styling to match app theme
- `.env` - Environment configuration

### Usage

The Adyen payment form is used in:

1. **Checkout Page** (`/checkout`) - Complete payment processing
2. **Payment Methods Page** (`/payment-methods`) - Add new payment methods

### Demo Mode

For testing and demo purposes, the integration includes:

- Simulated payment processing
- Mock payment session creation
- Test payment methods and responses

### Security Features

- Client-side validation
- 3D Secure support
- Encrypted payment data
- PCI DSS compliant integration

## Styling

The Adyen components are styled to match the app's warm, vibrant theme:

- Primary color: `hsl(15, 84%, 58%)` (coral)
- Custom CSS variables for consistent branding
- Mobile-responsive design
- Focus states and error handling

## Testing

Use Adyen's test cards for testing:

- **Successful payment**: 4111 1111 1111 1111
- **3D Secure**: 4212 3456 7891 0006
- **Insufficient funds**: 4000 0000 0000 0002

## Production Deployment

To deploy to production:

1. Update environment variables with live credentials
2. Change `VITE_ADYEN_ENVIRONMENT` to `live`
3. Configure webhook endpoints for payment notifications
4. Set up proper error handling and logging

## Backend Requirements

For a complete production setup, you'll need a backend service to:

1. Create payment sessions via Adyen API
2. Handle webhook notifications
3. Process payment confirmations
4. Manage payment methods and customer data

## Support

For Adyen-specific issues, refer to:

- [Adyen Documentation](https://docs.adyen.com/)
- [Adyen Web SDK](https://github.com/Adyen/adyen-web)
