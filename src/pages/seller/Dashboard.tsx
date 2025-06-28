import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SellerBottomNavigation } from "@/components/SellerBottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Package,
  CreditCard,
  Users,
  Plus,
  Eye,
  ArrowUpRight,
  DollarSign,
  Calendar,
  QrCode,
} from "lucide-react";
import { useAppMode } from "@/contexts/AppModeContext";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user } = useAppMode();

  // Mock seller data
  const [dashboardData] = useState({
    todayRevenue: 1247.5,
    todayOrders: 23,
    totalProducts: 45,
    totalCustomers: 234,
    recentPayments: [
      {
        id: "1",
        customer: "John Doe",
        amount: 49.99,
        product: "Wireless Earbuds",
        time: "2 min ago",
        status: "completed" as const,
      },
      {
        id: "2",
        customer: "Sarah Wilson",
        amount: 24.99,
        product: "Premium Coffee",
        time: "15 min ago",
        status: "completed" as const,
      },
      {
        id: "3",
        customer: "Mike Johnson",
        amount: 89.99,
        product: "Yoga Mat + Water Bottle",
        time: "1 hr ago",
        status: "pending" as const,
      },
    ],
    topProducts: [
      { name: "Wireless Earbuds", sales: 12, revenue: 1799.88 },
      { name: "Premium Coffee", sales: 8, revenue: 199.92 },
      { name: "Yoga Mat", sales: 6, revenue: 275.94 },
    ],
  });

  const headerContent = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Seller Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user?.name || "Seller"}
        </p>
      </div>
      <Button onClick={() => navigate("/seller/products/new")} size="sm">
        <Plus size={16} className="mr-1" />
        Add Product
      </Button>
    </div>
  );

  return (
    <Layout
      headerContent={headerContent}
      showBottomNav={false}
      className="pb-20"
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Today's Revenue
                  </p>
                  <p className="text-lg font-bold text-success">
                    ${dashboardData.todayRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Orders Today</p>
                  <p className="text-lg font-bold">
                    {dashboardData.todayOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-coral-500/10 rounded-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-coral-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Products</p>
                  <p className="text-lg font-bold">
                    {dashboardData.totalProducts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-peach-500/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-peach-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customers</p>
                  <p className="text-lg font-bold">
                    {dashboardData.totalCustomers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                className="h-16 flex flex-col justify-center"
                onClick={() => navigate("/seller/products")}
              >
                <Package size={20} className="mb-1" />
                <span className="text-sm">My Products</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col justify-center"
                onClick={() => navigate("/seller/products/new")}
              >
                <Plus size={20} className="mb-1" />
                <span className="text-sm">Add Product</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button
                variant="outline"
                className="h-16 flex flex-col justify-center"
                onClick={() => navigate("/seller/codes")}
              >
                <QrCode size={20} className="mb-1" />
                <span className="text-sm">Generate Codes</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col justify-center"
                onClick={() => navigate("/seller/events")}
              >
                <Calendar size={20} className="mb-1" />
                <span className="text-sm">My Events</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Payments</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/seller/payments")}
              >
                <Eye size={14} className="mr-1" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {payment.customer}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {payment.product}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">${payment.amount}</p>
                    <div className="flex items-center space-x-1">
                      <Badge
                        variant={
                          payment.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Top Products Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sales} sales
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      ${product.revenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-success flex items-center">
                      <ArrowUpRight size={10} className="mr-1" />+
                      {product.sales}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <SellerBottomNavigation />
    </Layout>
  );
}
