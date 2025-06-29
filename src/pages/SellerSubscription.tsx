import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Shield,
  TrendingUp,
  Users,
  Crown,
  CreditCard,
  Building2,
  CheckCircle,
  Star,
  MapPin,
  BarChart3,
  Zap,
  DollarSign,
  Lock,
  Globe,
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { AuthModal } from "@/components/AuthModal";

interface SellerBenefit {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}

const sellerBenefits: SellerBenefit[] = [
  {
    icon: TrendingUp,
    title: "Sell Locally",
    description: "Reach customers in your neighborhood and community",
  },
  {
    icon: DollarSign,
    title: "Keep More Money",
    description: "Low fees, direct bank deposits, no holding periods",
  },
  {
    icon: MapPin,
    title: "Location-Based Discovery",
    description: "Customers find you through our proximity search",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Finix-powered payments with fraud protection",
  },
  {
    icon: Users,
    title: "Verified Community",
    description: "Connect with serious local buyers and sellers",
  },
  {
    icon: BarChart3,
    title: "Growth Tools",
    description: "Analytics, premium listings, and business insights",
  },
];

type OnboardingStep = "benefits" | "payment" | "bank_setup" | "complete";

export default function SellerSubscription() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("benefits");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"promotional" | "regular">(
    "promotional",
  );
  const [showAuthModal, setShowAuthModal] = useState(false);

  const navigate = useNavigate();
  const { user } = useSupabaseAuth();

  // Bank account form state
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    routingNumber: "",
    bankName: "",
    accountType: "checking" as "checking" | "savings",
  });

  const pricing = {
    promotional: {
      price: 4.99,
      duration: "12 months",
      savings: "50% off",
      after: "Then $9.99/month",
    },
    regular: {
      price: 9.99,
      duration: "monthly",
      savings: null,
      after: "Cancel anytime",
    },
  };

  const handleStartRegistration = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setCurrentStep("payment");
  };

  const handlePaymentSubmit = async () => {
    setIsProcessing(true);

    try {
      // Simulate payment processing and subscription creation
      setTimeout(() => {
        // Here you would:
        // 1. Process payment with Adyen
        // 2. Create subscription record in database
        // 3. Send confirmation email

        console.log(
          `Seller subscription created: ${selectedPlan} plan for $${pricing[selectedPlan].price}/month`,
        );

        setIsProcessing(false);
        setCurrentStep("bank_setup");
      }, 2000);
    } catch (error) {
      console.error("Payment failed:", error);
      setIsProcessing(false);
    }
  };

  const handleBankSetup = async () => {
    setIsProcessing(true);

    try {
      // Here you would integrate with Adyen for Platforms
      // to create a connected account

      // For now, simulate the process and update user's seller access
      setTimeout(async () => {
        if (user) {
          // Update the user's seller access in the database
          // This would normally be done after successful Adyen setup
          // For now we'll simulate it

          // You would call your backend API here to:
          // 1. Create Adyen connected account
          // 2. Store bank details securely
          // 3. Update user's has_seller_access to true
          // 4. Create subscription record

          console.log("Seller access granted for user:", user.id);
        }

        setIsProcessing(false);
        setCurrentStep("complete");
      }, 3000);
    } catch (error) {
      console.error("Bank setup failed:", error);
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    // Grant seller access for demo users
    localStorage.setItem("demo_seller_access", "true");

    // Navigate to seller dashboard
    navigate("/seller");
  };

  const headerContent = (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/")}
        className="p-2"
      >
        <ArrowLeft size={18} />
      </Button>
      <div>
        <h1 className="text-xl font-semibold">Become a Seller</h1>
        <p className="text-sm text-muted-foreground">
          Join our local marketplace community
        </p>
      </div>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={false}>
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2">
          {["benefits", "payment", "bank_setup", "complete"].map(
            (step, index) => (
              <div
                key={step}
                className={`flex items-center ${index < 3 ? "space-x-2" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step
                      ? "bg-primary text-primary-foreground"
                      : [
                            "benefits",
                            "payment",
                            "bank_setup",
                            "complete",
                          ].indexOf(currentStep) > index
                        ? "bg-success text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {["benefits", "payment", "bank_setup", "complete"].indexOf(
                    currentStep,
                  ) > index ? (
                    <CheckCircle size={16} />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div
                    className={`w-8 h-0.5 ${
                      ["benefits", "payment", "bank_setup", "complete"].indexOf(
                        currentStep,
                      ) > index
                        ? "bg-success"
                        : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ),
          )}
        </div>

        {/* Step Content */}
        {currentStep === "benefits" && (
          <div className="space-y-6">
            {/* Hero Section */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-8 text-center">
                <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-3">
                  Join Our Seller Community
                </h2>
                <p className="text-muted-foreground mb-6">
                  Turn your products into income with our local marketplace
                  platform. Connect with nearby customers and grow your
                  business.
                </p>
                <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium">
                  <Star size={14} />
                  Trusted by 1,000+ local sellers
                </div>
              </CardContent>
            </Card>

            {/* Pricing Plans */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPlan === "promotional"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onClick={() => setSelectedPlan("promotional")}
                  >
                    <div className="text-center">
                      <Badge className="mb-3 bg-primary">
                        50% OFF - Limited Time
                      </Badge>
                      <div className="mb-2">
                        <span className="text-3xl font-bold">
                          ${pricing.promotional.price}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        For {pricing.promotional.duration}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pricing.promotional.after}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPlan === "regular"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onClick={() => setSelectedPlan("regular")}
                  >
                    <div className="text-center">
                      <div className="mb-2">
                        <span className="text-3xl font-bold">
                          ${pricing.regular.price}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Standard pricing
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pricing.regular.after}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Seller Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {sellerBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <benefit.icon size={20} className="text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">{benefit.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Button
              onClick={handleStartRegistration}
              className="w-full h-12 text-lg"
            >
              {!user
                ? "Sign In & Start Registration"
                : `Start Registration - $${pricing[selectedPlan].price}/month`}
            </Button>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Lock size={14} />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe size={14} />
                <span>Powered by Finix</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === "payment" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={20} />
                Payment Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {selectedPlan === "promotional"
                      ? "Promotional Plan"
                      : "Regular Plan"}
                  </span>
                  <span className="font-bold">
                    ${pricing[selectedPlan].price}/month
                  </span>
                </div>
                {selectedPlan === "promotional" && (
                  <p className="text-sm text-muted-foreground">
                    50% off for first 12 months, then $9.99/month
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" disabled={isProcessing} />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      placeholder="12345"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePaymentSubmit}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? "Processing Payment..." : "Complete Payment"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Your card will be charged ${pricing[selectedPlan].price} today.
                You can cancel anytime from your seller dashboard.
              </p>
            </CardContent>
          </Card>
        )}

        {currentStep === "bank_setup" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 size={20} />
                Bank Account Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      Secure Bank Integration
                    </h4>
                    <p className="text-sm text-blue-700">
                      We use Adyen to securely handle your bank information.
                      Your details are encrypted and never stored on our
                      servers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="account-holder">Account Holder Name</Label>
                  <Input
                    id="account-holder"
                    value={bankDetails.accountHolderName}
                    onChange={(e) =>
                      setBankDetails({
                        ...bankDetails,
                        accountHolderName: e.target.value,
                      })
                    }
                    placeholder="Full name as it appears on your bank account"
                    disabled={isProcessing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="account-number">Account Number</Label>
                    <Input
                      id="account-number"
                      value={bankDetails.accountNumber}
                      onChange={(e) =>
                        setBankDetails({
                          ...bankDetails,
                          accountNumber: e.target.value,
                        })
                      }
                      placeholder="Account number"
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="routing-number">Routing Number</Label>
                    <Input
                      id="routing-number"
                      value={bankDetails.routingNumber}
                      onChange={(e) =>
                        setBankDetails({
                          ...bankDetails,
                          routingNumber: e.target.value,
                        })
                      }
                      placeholder="9-digit routing number"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <Input
                    id="bank-name"
                    value={bankDetails.bankName}
                    onChange={(e) =>
                      setBankDetails({
                        ...bankDetails,
                        bankName: e.target.value,
                      })
                    }
                    placeholder="Your bank's name"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <Button
                onClick={handleBankSetup}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing
                  ? "Setting up your account..."
                  : "Connect Bank Account"}
              </Button>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Payments are processed directly to your bank account</p>
                <p>• Funds typically arrive in 1-2 business days</p>
                <p>• Our commission is automatically deducted</p>
                <p>• You can update your bank details anytime</p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "complete" && (
          <div className="text-center space-y-6">
            <Card className="bg-gradient-to-r from-success/5 to-success/10 border-success/20">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-success" />
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  Welcome to Our Seller Community!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your seller account is now active. You can start listing
                  products and accepting payments immediately.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/50 rounded-lg p-3">
                    <Zap className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="font-medium">Account Active</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <Building2 className="h-5 w-5 text-success mx-auto mb-1" />
                    <p className="font-medium">Bank Connected</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleComplete} className="w-full h-12 text-lg">
              Go to Seller Dashboard
            </Button>
          </div>
        )}
      </div>

      {/* Inline Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setCurrentStep("payment");
        }}
      />
    </Layout>
  );
}
