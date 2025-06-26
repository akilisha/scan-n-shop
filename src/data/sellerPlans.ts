import { SellerPlan } from "@/types";

export const sellerPlans: SellerPlan[] = [
  {
    id: "starter",
    name: "Seller Starter",
    description: "Perfect for small businesses getting started",
    price: 19.99,
    interval: "month",
    features: [
      "Create up to 100 products",
      "Generate barcodes & QR codes",
      "Basic payment processing",
      "Transaction history",
      "Email support",
    ],
  },
  {
    id: "professional",
    name: "Seller Professional",
    description: "Advanced tools for growing businesses",
    price: 49.99,
    interval: "month",
    popular: true,
    features: [
      "Unlimited products",
      "Advanced barcode generation",
      "Bulk product import",
      "Payment analytics",
      "Refund management",
      "Stripe integration settings",
      "Priority support",
      "Custom branding on receipts",
    ],
  },
  {
    id: "enterprise",
    name: "Seller Enterprise",
    description: "Full-featured solution for large operations",
    price: 199.99,
    interval: "month",
    features: [
      "Everything in Professional",
      "Multi-location support",
      "Advanced analytics",
      "API access",
      "White-label solution",
      "Dedicated account manager",
      "Custom integrations",
      "24/7 phone support",
    ],
  },
];

export const yearlySellerPlans: SellerPlan[] = sellerPlans.map((plan) => ({
  ...plan,
  id: `${plan.id}_yearly`,
  price: plan.price * 10, // 2 months free
  interval: "year" as const,
}));
