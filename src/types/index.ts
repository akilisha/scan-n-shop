export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  barcode?: string;
  sellerId?: string;
  createdAt?: Date;
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
  buyerId?: string;
  sellerId?: string;
  refundable?: boolean;
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
  planType?: "seller" | "premium";
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
  subscriptions?: Subscription[];
  hasSellerAccess?: boolean;
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

export interface SellerPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  popular?: boolean;
}

export interface SellerPayment extends PaymentHistory {
  buyerInfo: {
    name: string;
    email: string;
  };
  fees: {
    stripe: number;
    platform: number;
  };
  netAmount: number;
}

export interface ProductCode {
  id: string;
  productId: string;
  type: "barcode" | "qr" | "price_tag";
  code: string;
  data: any;
  createdAt: Date;
  printCount: number;
}

export type AppMode = "buyer" | "seller";
