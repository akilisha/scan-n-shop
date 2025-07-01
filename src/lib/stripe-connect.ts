import { supabase } from "./supabase";

// =============================================================================
// STRIPE CONNECT ACCOUNT MANAGEMENT
// =============================================================================

export interface ConnectAccount {
  id: string;
  user_id: string;
  stripe_account_id: string;
  account_type: "express" | "standard" | "custom";
  business_type: "individual" | "company" | "non_profit";
  country: string;
  email?: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  capabilities?: any;
  requirements?: any;
  settings?: any;
  business_profile?: any;
  individual?: any;
  company?: any;
  tos_acceptance?: any;
  onboarding_link_expires_at?: string;
  onboarding_completed_at?: string;
  verification_status: "pending" | "verified" | "rejected";
  verification_failed_reason?: string;
  last_webhook_received_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface ConnectAccountCreateData {
  stripe_account_id: string;
  account_type: "express" | "standard" | "custom";
  business_type: "individual" | "company" | "non_profit";
  country?: string;
  email?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  capabilities?: any;
  requirements?: any;
  settings?: any;
  business_profile?: any;
  individual?: any;
  company?: any;
  tos_acceptance?: any;
  onboarding_link_expires_at?: string;
  verification_status?: "pending" | "verified" | "rejected";
  metadata?: any;
}

// Create or update connect account
export const createConnectAccount = async (
  userId: string,
  accountData: ConnectAccountCreateData,
) => {
  const { data, error } = await supabase
    .from("connect_accounts")
    .upsert({
      user_id: userId,
      ...accountData,
    })
    .select()
    .single();

  return { data, error };
};

// Get user's connect account
export const getUserConnectAccount = async (userId: string) => {
  const { data, error } = await supabase
    .from("connect_accounts")
    .select("*")
    .eq("user_id", userId)
    .single();

  return { data, error };
};

// Update connect account
export const updateConnectAccount = async (
  accountId: string,
  updates: Partial<ConnectAccountCreateData>,
) => {
  const { data, error } = await supabase
    .from("connect_accounts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .select()
    .single();

  return { data, error };
};

// Get connect account by Stripe account ID
export const getConnectAccountByStripeId = async (stripeAccountId: string) => {
  const { data, error } = await supabase
    .from("connect_accounts")
    .select("*")
    .eq("stripe_account_id", stripeAccountId)
    .single();

  return { data, error };
};

// =============================================================================
// MARKETPLACE ORDERS
// =============================================================================

export interface MarketplaceOrder {
  id: string;
  buyer_id: string;
  seller_id?: string;
  stripe_payment_intent_id?: string;
  stripe_connect_account_id?: string;
  order_number: string;
  total_amount: number;
  application_fee?: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  items: any;
  shipping_address?: any;
  billing_address?: any;
  payment_method_details?: any;
  notes?: string;
  refund_reason?: string;
  metadata?: any;
  processed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  refunded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceOrderCreateData {
  buyer_id: string;
  seller_id?: string;
  stripe_payment_intent_id?: string;
  stripe_connect_account_id?: string;
  total_amount: number;
  application_fee?: number;
  currency?: string;
  status?: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  items: any;
  shipping_address?: any;
  billing_address?: any;
  payment_method_details?: any;
  notes?: string;
  metadata?: any;
}

// Create marketplace order
export const createMarketplaceOrder = async (
  orderData: MarketplaceOrderCreateData,
) => {
  const { data, error } = await supabase
    .from("orders")
    .insert(orderData)
    .select()
    .single();

  return { data, error };
};

// Update order status
export const updateOrderStatus = async (
  orderId: string,
  status: MarketplaceOrder["status"],
  additionalData?: any,
) => {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  // Add timestamp fields based on status
  switch (status) {
    case "processing":
      updates.processed_at = new Date().toISOString();
      break;
    case "completed":
      updates.delivered_at = new Date().toISOString();
      break;
    case "cancelled":
      updates.cancelled_at = new Date().toISOString();
      if (additionalData?.refund_reason) {
        updates.refund_reason = additionalData.refund_reason;
      }
      break;
    case "refunded":
      updates.refunded_at = new Date().toISOString();
      if (additionalData?.refund_reason) {
        updates.refund_reason = additionalData.refund_reason;
      }
      break;
  }

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select()
    .single();

  return { data, error };
};

// Get seller orders
export const getSellerOrders = async (sellerId: string) => {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      buyer:profiles!buyer_id(email, full_name)
    `,
    )
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  return { data, error };
};

// =============================================================================
// APPLICATION FEES
// =============================================================================

export interface ApplicationFee {
  id: string;
  order_id: string;
  stripe_application_fee_id?: string;
  stripe_charge_id?: string;
  connect_account_id: string;
  fee_amount: number;
  fee_currency: string;
  original_amount: number;
  fee_percentage: number;
  fixed_fee: number;
  status: "pending" | "collected" | "refunded" | "failed";
  collected_at?: string;
  refunded_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface ApplicationFeeCreateData {
  order_id: string;
  stripe_application_fee_id?: string;
  stripe_charge_id?: string;
  connect_account_id: string;
  fee_amount: number;
  fee_currency?: string;
  original_amount: number;
  fee_percentage: number;
  fixed_fee: number;
  status?: "pending" | "collected" | "refunded" | "failed";
  metadata?: any;
}

// Create application fee record
export const createApplicationFee = async (
  feeData: ApplicationFeeCreateData,
) => {
  const { data, error } = await supabase
    .from("application_fees")
    .insert({
      ...feeData,
      fee_currency: feeData.fee_currency || "usd",
      status: feeData.status || "pending",
    })
    .select()
    .single();

  return { data, error };
};

// Update application fee status
export const updateApplicationFeeStatus = async (
  feeId: string,
  status: ApplicationFee["status"],
  stripeIds?: {
    stripe_application_fee_id?: string;
    stripe_charge_id?: string;
  },
) => {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "collected") {
    updates.collected_at = new Date().toISOString();
  } else if (status === "refunded") {
    updates.refunded_at = new Date().toISOString();
  }

  if (stripeIds) {
    Object.assign(updates, stripeIds);
  }

  const { data, error } = await supabase
    .from("application_fees")
    .update(updates)
    .eq("id", feeId)
    .select()
    .single();

  return { data, error };
};

// =============================================================================
// REFERRAL SYSTEM
// =============================================================================

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id?: string;
  referral_code: string;
  email?: string;
  status: "pending" | "completed" | "failed" | "expired";
  credit_type: "month" | "dollar";
  credit_awarded: number;
  credit_used: boolean;
  credit_applied_at?: string;
  completed_at?: string;
  expires_at: string;
  failure_reason?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface ReferralCreateData {
  referrer_id: string;
  referral_code: string;
  email?: string;
  credit_type?: "month" | "dollar";
  credit_awarded?: number;
  expires_at?: string;
  metadata?: any;
}

// Create referral
export const createReferral = async (referralData: ReferralCreateData) => {
  const { data, error } = await supabase
    .from("referrals")
    .insert({
      ...referralData,
      credit_type: referralData.credit_type || "month",
      credit_awarded: referralData.credit_awarded || 1,
      expires_at:
        referralData.expires_at ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  return { data, error };
};

// Apply referral code
export const applyReferralCode = async (
  referralCode: string,
  referredUserId: string,
) => {
  // First, find the referral
  const { data: referral, error: findError } = await supabase
    .from("referrals")
    .select("*")
    .eq("referral_code", referralCode)
    .eq("status", "pending")
    .single();

  if (findError || !referral) {
    return {
      data: null,
      error: findError || new Error("Referral code not found"),
    };
  }

  // Update the referral with the referred user
  const { data, error } = await supabase
    .from("referrals")
    .update({
      referred_id: referredUserId,
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", referral.id)
    .select()
    .single();

  return { data, error };
};

// Get user referrals
export const getUserReferrals = async (userId: string) => {
  const { data, error } = await supabase
    .from("referrals")
    .select(
      `
      *,
      referred_user:profiles!referred_id(email, full_name)
    `,
    )
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
};

// =============================================================================
// WEBHOOK EVENTS
// =============================================================================

export interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  webhook_source: string;
  processed: boolean;
  processing_attempts: number;
  last_processing_attempt_at?: string;
  processing_error?: string;
  event_data: any;
  created_at: string;
  updated_at: string;
}

// Log webhook event
export const logWebhookEvent = async (
  stripeEventId: string,
  eventType: string,
  eventData: any,
  webhookSource: string = "stripe",
) => {
  const { data, error } = await supabase
    .from("webhook_events")
    .insert({
      stripe_event_id: stripeEventId,
      event_type: eventType,
      webhook_source: webhookSource,
      event_data: eventData,
      processed: false,
      processing_attempts: 0,
    })
    .select()
    .single();

  return { data, error };
};

// Mark webhook as processed
export const markWebhookProcessed = async (
  webhookId: string,
  success: boolean,
  errorMessage?: string,
) => {
  const updates: any = {
    processed: success,
    processing_attempts: success ? 1 : 2, // Simplified for now
    last_processing_attempt_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!success && errorMessage) {
    updates.processing_error = errorMessage;
  }

  const { data, error } = await supabase
    .from("webhook_events")
    .update(updates)
    .eq("id", webhookId)
    .select()
    .single();

  return { data, error };
};
