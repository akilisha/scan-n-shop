import React from "react";
import { Layout } from "@/components/Layout";
import ReferralDashboard from "@/components/ReferralDashboard";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Gift, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Referrals: React.FC = () => {
  const { user, profile } = useSupabaseAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Layout title="Referrals">
        <div className="max-w-2xl mx-auto p-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Sign in to access referrals
              </h2>
              <p className="text-muted-foreground mb-4">
                You need to be signed in to view and manage your referrals.
              </p>
              <Button onClick={() => navigate("/")}>Go to Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Referral Program">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Gift className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Referral Program</h1>
              <p className="text-muted-foreground">
                Earn rewards by referring friends and colleagues
              </p>
            </div>
          </div>
        </div>

        {/* Program Benefits Alert */}
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Gift className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Special Offer:</strong>{" "}
            {profile?.has_seller_access
              ? "Get one month of seller fees waived for every successful referral!"
              : "Refer friends and earn credits when they sign up!"}
          </AlertDescription>
        </Alert>

        {/* Referral Dashboard */}
        <ReferralDashboard
          userId={user.id}
          userEmail={user.email || ""}
          isSellerMode={profile?.has_seller_access || false}
        />
      </div>
    </Layout>
  );
};

export default Referrals;
