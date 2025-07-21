import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Store,
  DollarSign,
  Package,
  TrendingUp,
  Plus,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Settings,
  BarChart3,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { getUserConnectAccount } from "@/lib/stripe-connect";
import { AuthModal } from "@/components/AuthModal";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { supabaseUser, user } = useSupabaseAuth();
  const [connectAccount, setConnectAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    productCount: 0,
    orderCount: 0,
    recentOrders: [],
  });

  useEffect(() => {
    if (supabaseUser) {
      loadSellerData();
    } else {
      setLoading(false);
    }
  }, [supabaseUser]);

  const loadSellerData = async () => {
    if (!supabaseUser) return;

    setLoading(true);
    setError(null);

    try {
      // Load Stripe Connect account with timeout
      const { data: accountData, error: accountError } = await Promise.race([
        getUserConnectAccount(supabaseUser.id),
        new Promise<{ data: any; error: any }>((_, reject) =>
          setTimeout(() => reject(new Error("Database query timeout")), 3000),
        ),
      ]).catch((error) => {
        console.log("Database query failed:", error);
        return { data: null, error: { message: error.message } };
      });

      if (accountData && !accountError) {
        setConnectAccount(accountData);

        // Check live status with Stripe API
        await checkLiveAccountStatus(accountData.stripe_account_id);
      } else if (accountError) {
        if (
          accountError.message?.includes(
            'relation "connect_accounts" does not exist',
          ) ||
          accountError.message?.includes("timeout") ||
          accountError.message?.includes("timed out")
        ) {
          console.log(
            "Database not set up yet, continuing without account data",
          );
          // Don't set error - just continue with empty state
        } else {
          setError(`Account error: ${accountError.message}`);
        }
      }

      // TODO: Load real seller stats from database
      // For now, show honest empty state
      setStats({
        totalEarnings: 0,
        productCount: 0,
        orderCount: 0,
        recentOrders: [],
      });
    } catch (error: any) {
      console.error("Error loading seller data:", error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkLiveAccountStatus = async (stripeAccountId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/stripe-connect/connect/account/${stripeAccountId}`,
        { signal: AbortSignal.timeout(10000) },
      );

      if (response.ok) {
        const liveAccountData = await response.json();
        setConnectAccount((prev: any) => ({
          ...prev,
          ...liveAccountData,
        }));
      }
    } catch (error) {
      console.warn("Could not fetch live account status:", error);
      // Continue with database data
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

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
        <h1 className="text-xl font-semibold">Seller Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage your store and earnings
        </p>
      </div>
    </div>
  );

  if (!supabaseUser) {
    return (
      <>
        <Layout headerContent={headerContent} showBottomNav={false}>
          <div className="flex flex-col items-center justify-center py-12">
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Store className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
                <p className="text-muted-foreground text-center mb-8">
                  Please sign in to access your seller dashboard
                </p>
                <div className="w-full space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setShowAuth(true)}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/")}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Layout>

        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
          mode="login"
        />
      </>
    );
  }

  return (
    <Layout headerContent={headerContent} showBottomNav={false}>
      <div className="space-y-6">
        {/* Loading State */}
        {loading && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <AlertDescription>
              Loading your seller dashboard...
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSellerData}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Account Status */}
        {connectAccount ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Store className="h-5 w-5" />
                  <span>Stripe Connect Account</span>
                </div>
                {getAccountStatusBadge()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Charges</div>
                  <div
                    className={`font-semibold ${
                      connectAccount.charges_enabled
                        ? "text-success"
                        : "text-muted-foreground"
                    }`}
                  >
                    {connectAccount.charges_enabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Payouts</div>
                  <div
                    className={`font-semibold ${
                      connectAccount.payouts_enabled
                        ? "text-success"
                        : "text-muted-foreground"
                    }`}
                  >
                    {connectAccount.payouts_enabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Account ID:</strong>{" "}
                  {connectAccount.stripe_account_id}
                </div>
                <div className="text-sm">
                  <strong>Business Type:</strong>{" "}
                  {connectAccount.business_type || "Individual"}
                </div>
                <div className="text-sm">
                  <strong>Country:</strong> {connectAccount.country || "US"}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  window.open(
                    `http://localhost:8000/api/stripe-connect/connect/dashboard-link/${connectAccount.stripe_account_id}`,
                    "_blank",
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Stripe Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          !loading && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Store className="h-5 w-5" />
                  <span>Get Started Selling</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Set up your seller account to start accepting payments and
                  managing products.
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate("/seller/onboarding")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Seller Account
                </Button>
              </CardContent>
            </Card>
          )
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(stats.totalEarnings)}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Earnings
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.productCount}
              </div>
              <div className="text-sm text-muted-foreground">Products</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.productCount === 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <Package className="h-4 w-4" />
                <AlertDescription>
                  <strong>Get started:</strong> Add your first product to begin
                  selling
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-3">
              <Button
                className="w-full justify-start"
                variant={stats.productCount === 0 ? "default" : "outline"}
                onClick={() => navigate("/seller/products/new")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/seller/products")}
              >
                <Package className="h-4 w-4 mr-2" />
                Manage Products
                <Badge variant="secondary" className="ml-auto">
                  {stats.productCount}
                </Badge>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/seller/analytics")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/seller/events")}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Events
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Recent Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.orderCount === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No orders yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Once customers start purchasing your products, their orders
                  will appear here.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/seller/products/new")}
                >
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Real orders will be displayed here */}
                <p className="text-sm text-muted-foreground">
                  Order history will be loaded from your actual transactions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Earnings Calculator</span>
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
                      <span className="font-medium">
                        {formatCurrency(amount)}
                      </span>{" "}
                      sale
                    </div>
                    <div className="text-sm space-x-4 text-right">
                      <span className="text-muted-foreground">
                        Fee: {formatCurrency(platformFee)}
                      </span>
                      <span className="font-semibold text-success">
                        You get: {formatCurrency(youReceive)}
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

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Account Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/seller/onboarding")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Account Setup
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/seller/codes")}
            >
              <Package className="h-4 w-4 mr-2" />
              QR Codes & Marketing
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
