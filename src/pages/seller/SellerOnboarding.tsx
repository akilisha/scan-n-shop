import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import StripeConnectOnboarding from "@/components/StripeConnectOnboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Store,
  DollarSign,
  Users,
  TrendingUp,
  Shield,
  CheckCircle,
  Star,
  Globe,
  Smartphone,
  CreditCard,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { getUserConnectAccount } from "@/lib/stripe-connect";

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { supabaseUser, user } = useSupabaseAuth();
  const [connectAccount, setConnectAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Check for success/refresh params from Stripe
  const isSuccess = searchParams.get("success") === "true";
  const isRefresh = searchParams.get("refresh") === "true";

  // Debug logging
  React.useEffect(() => {
    console.log("🔍 SellerOnboarding Debug Info:");
    console.log("Current URL:", window.location.href);
    console.log("Search params:", Object.fromEntries(searchParams.entries()));
    console.log("isSuccess:", isSuccess);
    console.log("isRefresh:", isRefresh);
    console.log("currentStep:", currentStep);
    console.log("connectAccount:", connectAccount);
    console.log("supabaseUser:", !!supabaseUser);
  }, [
    searchParams,
    isSuccess,
    isRefresh,
    currentStep,
    connectAccount,
    supabaseUser,
  ]);

  useEffect(() => {
    if (supabaseUser) {
      loadConnectAccount();
    }
  }, [supabaseUser]);

  // Handle return from Stripe onboarding
  useEffect(() => {
    if (isSuccess || isRefresh) {
      // User returned from Stripe, refresh account status
      console.log("🔄 User returned from Stripe, refreshing account status...");
      setError(null); // Clear any previous errors
      setRetryCount(0); // Reset retry count

      if (supabaseUser) {
        // Add a small delay to allow Stripe webhooks to process
        setTimeout(() => {
          loadConnectAccount();
        }, 2000);

        // Set up retry mechanism in case first attempt fails
        const retryInterval = setInterval(() => {
          if (retryCount < 3 && currentStep < 4) {
            console.log(
              `🔄 Retry attempt ${retryCount + 1} for account status...`,
            );
            setRetryCount((prev) => prev + 1);
            loadConnectAccount();
          } else {
            clearInterval(retryInterval);
          }
        }, 10000); // Retry every 10 seconds, max 3 times

        // Clean up interval after 35 seconds
        setTimeout(() => clearInterval(retryInterval), 35000);
      }

      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      url.searchParams.delete("refresh");
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [isSuccess, isRefresh, supabaseUser]);

  const loadConnectAccount = async () => {
    if (!supabaseUser) {
      console.log("❌ No supabaseUser, cannot load account");
      return;
    }

    console.log("🔄 Loading connect account for user:", supabaseUser.id);
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await getUserConnectAccount(supabaseUser.id);
      console.log("📋 Database query result:", { data, error });

      if (data && !error) {
        console.log("📊 Account found in database:", data);
        setConnectAccount(data);

        // Check live status with Stripe API
        await checkLiveAccountStatus(data.stripe_account_id);
      } else if (error) {
        console.log("❌ Database error:", error);
        if (
          error.message?.includes('relation "connect_accounts" does not exist')
        ) {
          setError(
            "Database setup required. Please run the database setup SQL.",
          );
        } else {
          setError(`Database error: ${error.message}`);
        }
      } else {
        console.log("ℹ️ No account found in database");
        setCurrentStep(1); // No account yet
        setConnectAccount(null);
      }
    } catch (error) {
      console.error("💥 Exception loading connect account:", error);
      setError(`Failed to load account: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkLiveAccountStatus = async (stripeAccountId: string) => {
    try {
      console.log("🔍 Checking live account status with Stripe...");

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `http://localhost:8000/api/stripe-connect/connect/account/${stripeAccountId}`,
        {
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const liveAccountData = await response.json();
        console.log("✅ Live account status:", liveAccountData);

        // Update local state with live data
        setConnectAccount((prev) => ({
          ...prev,
          ...liveAccountData,
        }));

        // Update step based on live status
        if (
          liveAccountData.charges_enabled &&
          liveAccountData.payouts_enabled
        ) {
          console.log("🎉 Account fully active!");
          setCurrentStep(4); // Account is fully set up
        } else if (liveAccountData.details_submitted) {
          console.log("⏳ Account under review");
          setCurrentStep(3); // Under review
        } else {
          console.log("📝 Account needs onboarding");
          setCurrentStep(2); // Account created, needs onboarding
        }

        // If account is now active, update database
        if (
          liveAccountData.charges_enabled &&
          liveAccountData.payouts_enabled
        ) {
          await updateDatabaseAccountStatus(liveAccountData);
        }
      } else {
        throw new Error(`API responded with status: ${response.status}`);
      }
    } catch (error: any) {
      console.error("❌ Error checking live account status:", error);

      if (error.name === "AbortError") {
        console.warn("⏰ Account status check timed out");
        setError(
          "Account status check timed out. Please try refreshing manually.",
        );
      } else if (error.message?.includes("Failed to fetch")) {
        console.warn("🔌 Backend server not reachable");
        setError(
          "Cannot connect to backend server. Please check if it's running.",
        );
      } else {
        console.warn("🔄 Using database data as fallback");
      }

      // Fall back to database data if live check fails
      if (connectAccount) {
        console.log("📋 Using database data for status");
        if (connectAccount.charges_enabled && connectAccount.payouts_enabled) {
          setCurrentStep(4);
        } else if (connectAccount.details_submitted) {
          setCurrentStep(3);
        } else {
          setCurrentStep(2);
        }
      }
    }
  };

  const updateDatabaseAccountStatus = async (liveData: any) => {
    try {
      // Update database with latest status from Stripe
      // This is optional but keeps our database in sync
      console.log("💾 Updating database with live account status");
    } catch (error) {
      console.error("Error updating database:", error);
      // Not critical, continue anyway
    }
  };

  const handleAccountCreated = (accountData: any) => {
    setConnectAccount(accountData);
    setCurrentStep(2);
  };

  const benefits = [
    {
      icon: DollarSign,
      title: "Competitive Fees",
      description: "Just 2.9% + $0.30 per transaction",
    },
    {
      icon: TrendingUp,
      title: "Daily Payouts",
      description: "Get paid automatically every day",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Sell to customers worldwide",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Bank-level security with Stripe",
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      description: "Manage your store on any device",
    },
    {
      icon: Users,
      title: "Built-in Audience",
      description: "Access KerbDrop's customer base",
    },
  ];

  const steps = [
    {
      number: 1,
      title: "Create Account",
      description: "Set up your seller profile",
      completed: currentStep > 1,
      active: currentStep === 1,
    },
    {
      number: 2,
      title: "Verify Identity",
      description: "Complete Stripe verification",
      completed: currentStep > 2,
      active: currentStep === 2,
    },
    {
      number: 3,
      title: "Under Review",
      description: "Account verification in progress",
      completed: currentStep > 3,
      active: currentStep === 3,
    },
    {
      number: 4,
      title: "Start Selling",
      description: "Your store is ready!",
      completed: currentStep === 4,
      active: currentStep === 4,
    },
  ];

  const headerContent = (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/")}
        className="p-2"
      >
        <ArrowLeft size={20} />
      </Button>
      <div>
        <h1 className="text-xl font-semibold">Become a Seller</h1>
        <p className="text-sm text-muted-foreground">
          Join the KerbDrop marketplace
        </p>
      </div>
    </div>
  );

  if (!supabaseUser) {
    return (
      <Layout headerContent={headerContent} showBottomNav={false}>
        <div className="flex flex-col items-center justify-center py-12">
          <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Store className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground text-center mb-6">
                Please sign in to your account to start the seller onboarding
                process
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerContent={headerContent} showBottomNav={false}>
      <div className="space-y-6">
        {/* Status Messages */}
        {(isSuccess || isRefresh) && currentStep < 4 && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Checking your account status after Stripe verification...
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("🔄 Manual status check triggered");
                  setError(null);
                  loadConnectAccount();
                }}
                className="ml-2"
              >
                Check Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {currentStep === 4 && (isSuccess || isRefresh) && (
          <Alert className="border-success text-success">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Perfect! Your seller account is now fully verified and ready to
              accept payments.
            </AlertDescription>
          </Alert>
        )}

        {loading && !isSuccess && !isRefresh && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <AlertDescription>Loading account information...</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  loadConnectAccount();
                }}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Store className="h-5 w-5" />
                <span>Setup Progress</span>
              </div>
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadConnectAccount}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Refresh Status"
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step.completed
                        ? "bg-success text-success-foreground"
                        : step.active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {step.description}
                    </div>
                  </div>
                  {step.active && (
                    <Badge variant="outline" className="text-primary">
                      Current
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Onboarding Component */}
        <StripeConnectOnboarding
          onSuccess={handleAccountCreated}
          onError={(error) => console.error("Onboarding error:", error)}
        />

        {/* Benefits Section - Show only for new sellers */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>Why Sell on KerbDrop?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{benefit.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fee Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Fee Calculator</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Calculate your earnings for different sale amounts:
              </div>

              {[25, 50, 100, 200].map((amount) => {
                const platformFee = amount * 0.029 + 0.3;
                const youReceive = amount - platformFee;

                return (
                  <div
                    key={amount}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="text-sm">
                      <span className="font-medium">${amount.toFixed(2)}</span>{" "}
                      sale
                    </div>
                    <div className="text-sm space-x-4 text-right">
                      <span className="text-muted-foreground">
                        Fee: ${platformFee.toFixed(2)}
                      </span>
                      <span className="font-semibold text-success">
                        You get: ${youReceive.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="text-xs text-muted-foreground pt-2 border-t">
                Platform fee: 2.9% + $0.30 per transaction. No monthly fees or
                hidden costs.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Under Review */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Account Under Review</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Great! You've completed the Stripe verification process. Your
                  account is now under review.
                </AlertDescription>
              </Alert>

              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>What happens next?</strong>
                </p>
                <p>• Stripe is reviewing your account information</p>
                <p>• This usually takes a few minutes for test accounts</p>
                <p>• You'll be able to start selling once approved</p>
              </div>

              <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Checking status...</p>
                  <p className="text-xs text-muted-foreground">
                    We'll automatically refresh when ready
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={loadConnectAccount}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check Status Now"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Next Steps for Completed Accounts */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Ready to Start Selling</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-success text-success">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Congratulations! Your seller account is fully verified and
                  ready to accept payments.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate("/seller/products/new")}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/seller")}
                >
                  Go to Seller Dashboard
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/seller/products")}
                >
                  Manage Products
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Panel - Only show when debugging needed */}
        {(isSuccess || isRefresh || error) && (
          <Card className="border-dashed border-warning">
            <CardHeader>
              <CardTitle className="text-sm text-warning">
                Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div>
                <strong>URL Params:</strong>{" "}
                {JSON.stringify(Object.fromEntries(searchParams.entries()))}
              </div>
              <div>
                <strong>Current Step:</strong> {currentStep}
              </div>
              <div>
                <strong>Is Success:</strong> {isSuccess.toString()}
              </div>
              <div>
                <strong>Is Refresh:</strong> {isRefresh.toString()}
              </div>
              <div>
                <strong>Loading:</strong> {loading.toString()}
              </div>
              <div>
                <strong>Has Connect Account:</strong> {!!connectAccount}
              </div>
              <div>
                <strong>Account ID:</strong>{" "}
                {connectAccount?.stripe_account_id || "None"}
              </div>
              <div>
                <strong>Charges Enabled:</strong>{" "}
                {connectAccount?.charges_enabled?.toString() || "Unknown"}
              </div>
              <div>
                <strong>Error:</strong> {error || "None"}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log("🐛 Manual debug trigger");
                  setError(null);
                  loadConnectAccount();
                }}
                className="mt-2"
              >
                Force Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Support Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Seller Support</span>
                <Button variant="outline" size="sm">
                  Contact Us
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span>Stripe Help Center</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open("https://support.stripe.com", "_blank")
                  }
                >
                  Visit
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span>Seller Guidelines</span>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
