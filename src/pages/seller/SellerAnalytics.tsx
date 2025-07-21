import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Eye,
  CalendarDays,
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { AuthModal } from "@/components/AuthModal";

export default function SellerAnalytics() {
  const navigate = useNavigate();
  const { supabaseUser, user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [stats] = useState({
    // Real analytics will be loaded from database
    revenue: {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      growth: 0,
    },
    orders: {
      total: 0,
      thisMonth: 0,
      pending: 0,
      completed: 0,
    },
    products: {
      total: 0,
      active: 0,
      outOfStock: 0,
    },
    customers: {
      total: 0,
      returning: 0,
      new: 0,
    },
  });

  useEffect(() => {
    if (supabaseUser) {
      loadAnalytics();
    } else {
      setLoading(false);
    }
  }, [supabaseUser]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // TODO: Load real analytics from database
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const headerContent = (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/seller")}
        className="p-2"
      >
        <ArrowLeft size={20} />
      </Button>
      <div>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track your store performance
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
                  <BarChart3 className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
                <p className="text-muted-foreground text-center mb-8">
                  Please sign in to view your analytics
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
        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.revenue.total)}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    {stats.revenue.growth >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-success" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    <span
                      className={`text-xs ${
                        stats.revenue.growth >= 0
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {formatPercentage(stats.revenue.growth)}
                    </span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Orders</p>
                  <p className="text-2xl font-bold">{stats.orders.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.orders.thisMonth} this month
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="text-2xl font-bold">{stats.products.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.products.active} active
                  </p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Customers</p>
                  <p className="text-2xl font-bold">{stats.customers.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.customers.new} new
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty State for Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Performance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No data yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Start selling products to see your analytics and performance
                metrics.
              </p>
              <div className="space-y-3">
                <Button onClick={() => navigate("/seller/products/new")}>
                  Add Your First Product
                </Button>
                <div className="text-xs text-muted-foreground">
                  Once you have orders, you'll see:
                  <div className="mt-2 space-y-1">
                    <div>• Revenue trends and growth</div>
                    <div>• Customer behavior patterns</div>
                    <div>• Product performance metrics</div>
                    <div>• Order fulfillment data</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Analytics Sections */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5" />
                <span>Sales Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  Sales charts and trends will appear here once you have
                  transaction data.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Top Products</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  Your best-performing products will be highlighted here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/seller/products")}
            >
              <Package className="h-4 w-4 mr-2" />
              Manage Products
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/seller/events")}
            >
              <Users className="h-4 w-4 mr-2" />
              View Events
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/seller")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
