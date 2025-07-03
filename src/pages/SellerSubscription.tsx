import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Store, AlertTriangle, ExternalLink } from "lucide-react";

export default function SellerSubscription() {
  const navigate = useNavigate();

  // Auto-redirect to new Stripe Connect onboarding
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      navigate("/seller/onboarding");
    }, 3000);

    return () => clearTimeout(redirectTimer);
  }, [navigate]);

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
        <h1 className="text-xl font-semibold">Seller Registration</h1>
        <p className="text-sm text-muted-foreground">
          Redirecting to updated flow
        </p>
      </div>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={false}>
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Legacy Flow Deprecated:</strong> This seller registration
            flow has been replaced with a secure Stripe Connect integration.
            You'll be redirected automatically.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Store className="h-5 w-5" />
              <span>Updated Seller Onboarding</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Redirecting to Secure Onboarding
              </h3>
              <p className="text-muted-foreground mb-6">
                We've upgraded our seller registration to use Stripe Connect for
                better security and compliance. You'll be redirected in 3
                seconds.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => navigate("/seller/onboarding")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Go to New Onboarding Now
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">What's Changed:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Secure Stripe Connect integration</li>
                <li>✅ Bank verification handled by Stripe</li>
                <li>✅ No manual payment details collection</li>
                <li>✅ Faster, more secure onboarding</li>
                <li>❌ Legacy non-Stripe forms removed</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
