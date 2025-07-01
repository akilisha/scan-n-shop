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

  // Check for success/refresh params from Stripe
  const isSuccess = searchParams.get("success") === "true";
  const isRefresh = searchParams.get("refresh") === "true";

  useEffect(() => {
    if (supabaseUser) {
      loadConnectAccount();
    }
  }, [supabaseUser]);

  const loadConnectAccount = async () => {
    if (!supabaseUser) return;

    setLoading(true);
    try {
      const { data, error } = await getUserConnectAccount(supabaseUser.id);
      if (data && !error) {
        setConnectAccount(data);
        if (data.charges_enabled && data.payouts_enabled) {
          setCurrentStep(4); // Account is fully set up
        } else if (data.details_submitted) {
          setCurrentStep(3); // Under review
        } else {
          setCurrentStep(2); // Account created, needs onboarding
        }
      } else {
        setCurrentStep(1); // No account yet
      }
    } catch (error) {
      console.error("Error loading connect account:", error);
    } finally {
      setLoading(false);
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
        {/* Success/Refresh Messages */}
        {isSuccess && (
          <Alert className="border-success text-success">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Great! Your seller account has been successfully set up. You can
              now start selling on KerbDrop.
            </AlertDescription>
          </Alert>
        )}

        {isRefresh && (
          <Alert>
            <AlertDescription>
              It looks like you need to complete your account setup. Please
              continue with the verification process.
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Store className="h-5 w-5" />
              <span>Setup Progress</span>
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
