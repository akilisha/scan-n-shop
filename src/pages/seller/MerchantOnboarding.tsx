import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import StripeConnectOnboarding from "@/components/StripeConnectOnboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Building2,
  DollarSign,
  Shield,
  Users,
  TrendingUp,
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";

const MerchantOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useSupabaseAuth();
  const { toast } = useToast();
  const [connectAccountId, setConnectAccountId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Check for completion or error states from URL params
  useEffect(() => {
    const success = searchParams.get("success");
    const refresh = searchParams.get("refresh");

    if (success === "true") {
      setIsComplete(true);
      toast({
        title: "Setup Complete!",
        description: "Your merchant account has been successfully configured.",
      });
    }

    if (refresh === "true") {
      // User returned to refresh the onboarding flow
      // In a real implementation, you would reload the account status
      toast({
        title: "Refreshing",
        description: "Checking your account status...",
      });
    }
  }, [searchParams, toast]);

  const handleOnboardingComplete = (accountId: string) => {
    setConnectAccountId(accountId);
    setIsComplete(true);

    // In a real implementation, you would:
    // 1. Save the Connect account ID to the user's profile
    // 2. Update their seller status
    // 3. Enable seller features

    toast({
      title: "Merchant Setup Complete!",
      description: "You can now start accepting payments and managing orders.",
    });

    // Redirect to seller dashboard after a short delay
    setTimeout(() => {
      navigate("/seller/dashboard");
    }, 2000);
  };

  const handleOnboardingError = (error: any) => {
    console.error("Onboarding error:", error);
    toast({
      title: "Setup Error",
      description: error.message || "Failed to complete merchant setup.",
      variant: "destructive",
    });
  };

  if (!user) {
    return (
      <Layout title="Merchant Onboarding">
        <div className="max-w-2xl mx-auto p-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Sign in to continue
              </h2>
              <p className="text-muted-foreground mb-4">
                You need to be signed in to set up your merchant account.
              </p>
              <Button onClick={() => navigate("/")}>Go to Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Merchant Setup">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Merchant Account Setup</h1>
              <p className="text-muted-foreground">
                Set up your Stripe Connect account to start selling
              </p>
            </div>
          </div>
        </div>

        {/* Success State */}
        {isComplete && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Congratulations!</strong> Your merchant account is set up
              and ready to accept payments. You'll be redirected to your seller
              dashboard shortly.
            </AlertDescription>
          </Alert>
        )}

        {/* Benefits Overview */}
        {!isComplete && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Start Earning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Accept payments from customers and start earning money through
                  our marketplace platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Secure Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Stripe Connect provides enterprise-grade security and fraud
                  protection for all transactions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Reach Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Connect with buyers in your area and expand your customer base
                  through our location-based marketplace.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Grow Your Business
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Access analytics, manage inventory, and grow your business
                  with our comprehensive seller tools.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stripe Connect Onboarding */}
        <StripeConnectOnboarding
          userId={user.id}
          onComplete={handleOnboardingComplete}
          onError={handleOnboardingError}
          existingAccountId={connectAccountId}
        />

        {/* Information Section */}
        {!isComplete && (
          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What You'll Need</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div>
                      <strong>Business Information:</strong> Legal business
                      name, address, and tax ID (if applicable)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div>
                      <strong>Personal Details:</strong> Name, date of birth,
                      and government-issued ID for verification
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div>
                      <strong>Banking Information:</strong> Bank account details
                      for receiving payments
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fees and Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      Platform fee per transaction:
                    </span>
                    <Badge variant="secondary">2.9% + 30¢</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly subscription:</span>
                    <Badge variant="secondary">$9.99/month</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Setup fee:</span>
                    <Badge variant="outline" className="text-green-600">
                      FREE
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    * Competitive rates with instant payouts and no hidden fees
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Support & Security</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>24/7 Support:</strong> Get help whenever you need it
                    from our dedicated merchant support team.
                  </p>
                  <p>
                    <strong>PCI Compliance:</strong> Your business and customers
                    are protected with industry-standard security.
                  </p>
                  <p>
                    <strong>Dispute Management:</strong> We help resolve payment
                    disputes and chargebacks automatically.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MerchantOnboarding;
