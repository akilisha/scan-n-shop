import {
  Product,
  CartItem,
  PaymentMethod,
  PaymentHistory,
  Subscription,
  User,
  AppSettings,
} from "@/types";

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Premium Coffee Blend",
    description:
      "Artisan roasted coffee beans with notes of chocolate and caramel",
    price: 24.99,
    image:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop",
    category: "Beverages",
    inStock: true,
    barcode: "1234567890123",
  },
  {
    id: "2",
    name: "Organic Green Tea",
    description: "Refreshing organic green tea with antioxidants",
    price: 18.99,
    image:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop",
    category: "Beverages",
    inStock: true,
    barcode: "2345678901234",
  },
  {
    id: "3",
    name: "Meditation App Premium",
    description: "One year subscription to our premium meditation app",
    price: 59.99,
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
    category: "Digital",
    inStock: true,
    barcode: "3456789012345",
  },
  {
    id: "4",
    name: "Wireless Earbuds",
    description: "High-quality wireless earbuds with noise cancellation",
    price: 149.99,
    image:
      "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop",
    category: "Electronics",
    inStock: true,
    barcode: "4567890123456",
  },
  {
    id: "5",
    name: "Artisan Dark Chocolate",
    description: "Single-origin 70% dark chocolate bar",
    price: 8.99,
    image:
      "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=400&fit=crop",
    category: "Food",
    inStock: true,
    barcode: "5678901234567",
  },
  {
    id: "6",
    name: "Bamboo Water Bottle",
    description: "Eco-friendly insulated water bottle",
    price: 32.99,
    image:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop",
    category: "Lifestyle",
    inStock: true,
    barcode: "6789012345678",
  },
  {
    id: "7",
    name: "Yoga Mat Premium",
    description: "Non-slip eco-friendly yoga mat",
    price: 45.99,
    image:
      "https://images.unsplash.com/photo-1506629905645-b178f786832d?w=400&h=400&fit=crop",
    category: "Fitness",
    inStock: true,
    barcode: "7890123456789",
  },
];

export const mockCartItems: CartItem[] = [
  {
    id: "1",
    product: mockProducts[0],
    quantity: 2,
  },
  {
    id: "2",
    product: mockProducts[1],
    quantity: 1,
  },
];

export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "1",
    type: "card",
    last4: "4242",
    brand: "visa",
    expiryMonth: 12,
    expiryYear: 2027,
    isDefault: true,
    nickname: "Personal Card",
  },
  {
    id: "2",
    type: "card",
    last4: "0005",
    brand: "mastercard",
    expiryMonth: 8,
    expiryYear: 2026,
    isDefault: false,
    nickname: "Business Card",
  },
];

export const mockPaymentHistory: PaymentHistory[] = [
  {
    id: "1",
    amount: 68.97,
    currency: "USD",
    status: "succeeded",
    date: new Date("2024-01-15"),
    description: "Coffee & Tea Order",
    paymentMethod: mockPaymentMethods[0],
    items: mockCartItems,
  },
  {
    id: "2",
    amount: 59.99,
    currency: "USD",
    status: "succeeded",
    date: new Date("2024-01-10"),
    description: "Meditation App Subscription",
    paymentMethod: mockPaymentMethods[0],
    items: [
      {
        id: "3",
        product: mockProducts[2],
        quantity: 1,
      },
    ],
  },
  {
    id: "3",
    amount: 149.99,
    currency: "USD",
    status: "succeeded",
    date: new Date("2024-01-05"),
    description: "Wireless Earbuds",
    paymentMethod: mockPaymentMethods[1],
    items: [
      {
        id: "4",
        product: mockProducts[3],
        quantity: 1,
      },
    ],
  },
];

export const mockSubscriptions: Subscription[] = [
  {
    id: "1",
    name: "Meditation App Premium",
    description: "Access to all premium meditation content and features",
    price: 59.99,
    interval: "year",
    status: "active",
    currentPeriodStart: new Date("2024-01-10"),
    currentPeriodEnd: new Date("2025-01-10"),
    nextBillingDate: new Date("2025-01-10"),
    paymentMethod: mockPaymentMethods[0],
  },
  {
    id: "2",
    name: "Coffee Subscription",
    description: "Monthly delivery of premium coffee beans",
    price: 24.99,
    interval: "month",
    status: "active",
    currentPeriodStart: new Date("2024-01-01"),
    currentPeriodEnd: new Date("2024-02-01"),
    nextBillingDate: new Date("2024-02-01"),
    paymentMethod: mockPaymentMethods[0],
  },
];

export const mockUser: User = {
  id: "1",
  email: "user@example.com",
  name: "Alex Johnson",
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  phone: "+1 (555) 123-4567",
  preferences: {
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    currency: "USD",
    language: "English",
    darkMode: false,
  },
};

export const mockAppSettings: AppSettings = {
  notifications: {
    push: true,
    email: true,
    sms: false,
    marketing: false,
  },
  security: {
    biometric: true,
    twoFactor: false,
  },
  display: {
    darkMode: false,
    currency: "USD",
    language: "English",
  },
  privacy: {
    analytics: true,
    dataSharing: false,
  },
};
