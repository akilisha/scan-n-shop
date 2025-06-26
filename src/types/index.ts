export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedOptions?: {
    size?: string;
    color?: string;
    [key: string]: any;
  };
}

export interface PaymentMethod {
  id: string;
  type: "card" | "bank" | "digital_wallet";
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  nickname?: string;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "refunded";
  date: Date;
  description: string;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  receiptUrl?: string;
}

export interface Subscription {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: "month" | "year";
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate?: Date;
  paymentMethod: PaymentMethod;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    currency: string;
    language: string;
    darkMode: boolean;
  };
}

export interface CheckoutState {
  step: "cart" | "payment" | "confirmation";
  paymentMethod?: PaymentMethod;
  processing: boolean;
  error?: string;
}

export interface AppSettings {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    marketing: boolean;
  };
  security: {
    biometric: boolean;
    twoFactor: boolean;
  };
  display: {
    darkMode: boolean;
    currency: string;
    language: string;
  };
  privacy: {
    analytics: boolean;
    dataSharing: boolean;
  };
}
