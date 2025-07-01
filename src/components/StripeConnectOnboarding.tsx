import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Store,
  DollarSign,
  Shield,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import {
  createConnectAccount,
  getUserConnectAccount,
  updateConnectAccount,
} from "@/lib/stripe-connect";

interface StripeConnectOnboardingProps {
  onSuccess?: (accountData: any) => void;
  onError?: (error: any) => void;
}

export default function StripeConnectOnboarding({
  onSuccess,
  onError,
}: StripeConnectOnboardingProps) {
  const { supabaseUser, user } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [businessType, setBusinessType] = useState<"individual" | "company">(
    "individual",
  );
  const [country, setCountry] = useState("US");
  const [connectAccount, setConnectAccount] = useState<any>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing connect account on mount
  React.useEffect(() => {
    if (supabaseUser) {
      loadExistingAccount();
    }
  }, [supabaseUser]);

  const loadExistingAccount = async () => {
    if (!supabaseUser) return;

    try {
      const { data, error } = await getUserConnectAccount(supabaseUser.id);
      if (data && !error) {
        setConnectAccount(data);
        // Check account status with Stripe
        await checkAccountStatus(data.stripe_account_id);
      } else if (
        error &&
        error.message?.includes('relation "connect_accounts" does not exist')
      ) {
        console.warn(
          "📋 Database tables not set up yet. This is expected for first-time setup.",
        );
        // Don't show error to user, just log it
      }
    } catch (error) {
      console.error("Error loading connect account:", error);
      // Don't show database errors to user unless critical
    }
  };

  const checkAccountStatus = async (stripeAccountId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/stripe-connect/connect/account/${stripeAccountId}`,
      );
      if (response.ok) {
        const accountData = await response.json();
        setConnectAccount((prev: any) => ({
          ...prev,
          ...accountData,
        }));
      }
    } catch (error) {
      console.error("Error checking account status:", error);
    }
  };

  const createStripeAccount = async () => {
    if (!supabaseUser || !email) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("🚀 Creating Stripe Express account...");

      // Create Stripe Express account
      const response = await fetch(
        "http://localhost:8000/api/stripe-connect/connect/create-express-account",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            business_type: businessType,
            country,
            refresh_url: `${window.location.origin}/seller/onboarding?refresh=true`,
            return_url: `${window.location.origin}/seller/onboarding?success=true`,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Stripe account creation failed:",
          response.status,
          errorText,
        );
        throw new Error(`Failed to create Stripe account: ${response.status}`);
      }

      const stripeAccountData = await response.json();
      console.log("✅ Stripe account created:", stripeAccountData);

      // Save account to database
      console.log("💾 Saving to database...");
      const { data: dbAccount, error: dbError } = await createConnectAccount(
        supabaseUser.id,
        {
          stripe_account_id: stripeAccountData.account_id,
          account_type: "express",
          business_type: businessType,
          country,
          email,
          charges_enabled: stripeAccountData.charges_enabled,
          payouts_enabled: stripeAccountData.payouts_enabled,
          details_submitted: stripeAccountData.details_submitted,
          verification_status: "pending",
        },
      );

      if (dbError) {
        console.error("❌ Database error:", dbError);
        // If database save fails, show helpful error
        if (
          dbError.message?.includes(
            'relation "connect_accounts" does not exist',
          )
        ) {
          throw new Error(
            "Database not set up. Please run the database setup SQL first.",
          );
        }
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log("✅ Account saved to database:", dbAccount);

      setConnectAccount({
        ...dbAccount,
        ...stripeAccountData,
      });

      setOnboardingUrl(stripeAccountData.onboarding_url);

      if (onSuccess) {
        onSuccess(stripeAccountData);
      }
    } catch (error: any) {
      console.error("💥 Account creation error:", error);

      // Show user-friendly error messages
      let userMessage = error.message;
      if (error.message?.includes("Database not set up")) {
        userMessage =
          "Database setup required. Please check the setup instructions.";
      } else if (error.message?.includes("Failed to fetch")) {
        userMessage =
          "Cannot connect to backend server. Make sure it's running.";
      } else if (
        error.message?.includes("relation") &&
        error.message?.includes("does not exist")
      ) {
        userMessage =
          "Database tables not created yet. Please run the database setup first.";
      }

      setError(userMessage);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateAccountLink = async () => {
    if (!connectAccount?.stripe_account_id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/stripe-connect/connect/create-account-link",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account_id: connectAccount.stripe_account_id,
            refresh_url: `${window.location.origin}/seller/onboarding?refresh=true`,
            return_url: `${window.location.origin}/seller/onboarding?success=true`,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to generate account link");
      }

      const { url } = await response.json();
      setOnboardingUrl(url);
    } catch (error: any) {
      setError(error.message || "Failed to generate onboarding link");
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountStatusBadge = () => {
    if (!connectAccount) return null;

    if (connectAccount.charges_enabled && connectAccount.payouts_enabled) {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }

    if (connectAccount.details_submitted) {
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Under Review
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="border-orange-200">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Setup Required
      </Badge>
    );
  };

  const calculateEstimatedEarnings = (saleAmount: number) => {
    // KerbDrop fee: 2.9% + $0.30
    const platformFee = saleAmount * 0.029 + 0.3;
    const sellerReceives = saleAmount - platformFee;
    return { platformFee, sellerReceives };
  };

  if (connectAccount && connectAccount.charges_enabled) {
    const earnings = calculateEstimatedEarnings(100);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Store className="h-5 w-5" />
              <span>Seller Account</span>
            </div>
            {getAccountStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-success/5 border border-success/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-semibold text-success">Account Active</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your seller account is fully set up and ready to receive payments.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground">Charges</div>
              <div className="font-semibold text-success">Enabled</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground">Payouts</div>
              <div className="font-semibold text-success">Enabled</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Earnings Calculator</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>For every $100.00 sale:</div>
              <div>• Platform fee: ${earnings.platformFee.toFixed(2)}</div>
              <div>• You receive: ${earnings.sellerReceives.toFixed(2)}</div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              window.open(
                `http://localhost:8000/api/stripe-connect/connect/dashboard-link`,
                "_blank",
              )
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Stripe Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (onboardingUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Store className="h-5 w-5" />
            <span>Complete Seller Setup</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Complete your seller verification with Stripe to start receiving
              payments. This is required by financial regulations.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              Click the button below to complete your seller account setup with
              our secure payment partner, Stripe.
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => window.open(onboardingUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Complete Setup with Stripe
            </Button>

            <div className="text-xs text-muted-foreground">
              This will open in a new window. After completing setup, return
              here to start selling.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Store className="h-5 w-5" />
          <span>Become a Seller</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              {error.includes("Database") && (
                <div className="mt-2 text-sm">
                  <strong>Setup Required:</strong> Run the SQL from{" "}
                  <code className="bg-background px-1 rounded">
                    QUICK_DB_SETUP.sql
                  </code>{" "}
                  in your Supabase SQL Editor first.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertDescription>
            <strong>Platform Fee:</strong> 2.9% + $0.30 per transaction.
            Competitive rates with instant payouts.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="businessType">Business Type</Label>
            <Select
              value={businessType}
              onValueChange={(value: "individual" | "company") =>
                setBusinessType(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <div>By continuing, you agree to:</div>
          <div>
            • Stripe's{" "}
            <a
              href="https://stripe.com/connect-account/legal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Connected Account Agreement
            </a>
          </div>
          <div>• KerbDrop's Terms of Service</div>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={createStripeAccount}
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Create Seller Account
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
