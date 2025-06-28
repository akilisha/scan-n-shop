import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Check,
  Crown,
  Zap,
  Building,
  Star,
  Loader2,
  User,
} from "lucide-react";
import { sellerPlans, yearlySellerPlans } from "@/data/sellerPlans";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useAppMode } from "@/contexts/AppModeContext";
import { usePaymentMethods } from "@/contexts/PaymentMethodsContext";
import { supabase } from "@/lib/supabase";
import { nativeService } from "@/lib/native";
import { cn } from "@/lib/utils";

export default function SellerSubscription() {
  const navigate = useNavigate();
  const { user, setUser, setMode } = useAppMode();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const plans = isYearly ? yearlySellerPlans : sellerPlans;

  const handleSubscribe = async (planId: string) => {
    setSelectedPlan(planId);
    setSubscribing(true);

    try {
      // Simulate subscription process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update user with seller access
      const updatedUser = {
        ...user!,
        hasSellerAccess: true,
        subscriptions: [
          ...(user?.subscriptions || []),
          {
            id: Date.now().toString(),
            name: plans.find((p) => p.id === planId)?.name || "Seller Plan",
            description: "Seller mode access",
            price: plans.find((p) => p.id === planId)?.price || 0,
            interval: isYearly ? ("year" as const) : ("month" as const),
            status: "active" as const,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(
              Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000,
            ),
            nextBillingDate: new Date(
              Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000,
            ),
            paymentMethod: {
              id: "1",
              type: "card" as const,
              last4: "4242",
              brand: "visa",
              isDefault: true,
            },
            planType: "seller" as const,
          },
        ],
      };

      setUser(updatedUser);

      // Switch to seller mode
      setMode("seller");
      navigate("/seller");
    } catch (error) {
      console.error("Subscription failed:", error);
    } finally {
      setSubscribing(false);
      setSelectedPlan(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    if (planId.includes("starter")) return Crown;
    if (planId.includes("professional")) return Zap;
    if (planId.includes("enterprise")) return Building;
    return Star;
  };

  const headerContent = (
    <div>
      <h1 className="text-xl font-semibold">Seller Subscription</h1>
      <p className="text-sm text-muted-foreground">
        Unlock powerful seller tools
      </p>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={true}>
      <div className="space-y-6">
        {/* Benefits Header */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-coral-50">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">Become a Seller</h2>
              <p className="text-muted-foreground">
                Create products, manage payments, and grow your business with
                our powerful seller tools.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Billing Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Annual Billing</p>
                <p className="text-sm text-muted-foreground">
                  Save 17% with yearly plans
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={cn("text-sm", !isYearly && "font-medium")}>
                  Monthly
                </span>
                <Switch checked={isYearly} onCheckedChange={setIsYearly} />
                <span className={cn("text-sm", isYearly && "font-medium")}>
                  Yearly
                </span>
                {isYearly && (
                  <Badge variant="secondary" className="ml-2">
                    Save 17%
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div className="space-y-4">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.id);
            const isPopular = plan.popular;
            const isSelected = selectedPlan === plan.id;
            const isLoading = subscribing && isSelected;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative overflow-hidden transition-all",
                  isPopular && "border-primary shadow-lg",
                  isSelected && "ring-2 ring-primary",
                )}
              >
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-1 text-xs font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader className={cn(isPopular && "pt-8")}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold">
                        ${plan.price.toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">
                        /{plan.interval}
                      </span>
                    </div>
                    {isYearly && (
                      <p className="text-sm text-muted-foreground">
                        ${(plan.price / 12).toFixed(2)} per month
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={cn(
                      "w-full",
                      isPopular &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      "Get Started"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-sm">Can I cancel anytime?</p>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time. Your access
                will continue until the end of your billing period.
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-sm">What payment methods?</p>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards and bank transfers through
                Stripe's secure payment processing.
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-sm">Is there a free trial?</p>
              <p className="text-sm text-muted-foreground">
                We offer a 14-day free trial for all new seller accounts. No
                credit card required to start.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
