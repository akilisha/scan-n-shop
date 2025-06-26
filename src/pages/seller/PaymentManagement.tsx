import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SellerBottomNavigation } from "@/components/SellerBottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Download,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

export default function PaymentManagement() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refunding, setRefunding] = useState<string | null>(null);

  // Mock seller payment data
  const [payments] = useState([
    {
      id: "pay_1",
      buyerInfo: { name: "John Doe", email: "john@example.com" },
      amount: 149.99,
      fees: { stripe: 4.65, platform: 7.5 },
      netAmount: 137.84,
      currency: "USD",
      status: "succeeded" as const,
      date: new Date("2024-01-15"),
      description: "Wireless Earbuds",
      refundable: true,
    },
    {
      id: "pay_2",
      buyerInfo: { name: "Sarah Wilson", email: "sarah@example.com" },
      amount: 24.99,
      fees: { stripe: 1.02, platform: 1.25 },
      netAmount: 22.72,
      currency: "USD",
      status: "succeeded" as const,
      date: new Date("2024-01-14"),
      description: "Premium Coffee Blend",
      refundable: true,
    },
    {
      id: "pay_3",
      buyerInfo: { name: "Mike Johnson", email: "mike@example.com" },
      amount: 89.99,
      fees: { stripe: 2.9, platform: 4.5 },
      netAmount: 82.59,
      currency: "USD",
      status: "pending" as const,
      date: new Date("2024-01-13"),
      description: "Yoga Mat + Water Bottle",
      refundable: false,
    },
  ]);

  const [summary] = useState({
    totalRevenue: 2456.78,
    totalFees: 89.45,
    netRevenue: 2367.33,
    totalOrders: 87,
    avgOrderValue: 28.24,
  });

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.buyerInfo.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRefund = async (paymentId: string) => {
    setRefunding(paymentId);
    try {
      // Simulate refund process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log(`Refund processed for payment: ${paymentId}`);
    } catch (error) {
      console.error("Refund failed:", error);
    } finally {
      setRefunding(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      succeeded: "bg-success/10 text-success border-success/20",
      pending: "bg-warning/10 text-warning border-warning/20",
      failed: "bg-destructive/10 text-destructive border-destructive/20",
      refunded: "bg-muted text-muted-foreground border-border",
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const headerContent = (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="p-2"
      >
        <ArrowLeft size={20} />
      </Button>
      <div>
        <h1 className="text-xl font-semibold">Payment Management</h1>
        <p className="text-sm text-muted-foreground">
          Monitor and manage customer payments
        </p>
      </div>
    </div>
  );

  return (
    <Layout
      headerContent={headerContent}
      showBottomNav={false}
      className="pb-20"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net Revenue</p>
                  <p className="text-lg font-bold text-success">
                    ${summary.netRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Order</p>
                  <p className="text-lg font-bold">
                    ${summary.avgOrderValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-coral-500/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-coral-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-lg font-bold">{summary.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-peach-500/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-peach-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fees Paid</p>
                  <p className="text-lg font-bold">${summary.totalFees}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <Filter size={16} className="mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="succeeded">Succeeded</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Button */}
        <Button variant="outline" className="w-full">
          <Download size={16} className="mr-2" />
          Export Payment Report
        </Button>

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium truncate">
                          {payment.description}
                        </h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Customer: {payment.buyerInfo.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.buyerInfo.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(payment.date, "MMM dd, yyyy 'at' HH:mm")}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Payment Amount</span>
                      <span>${payment.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Stripe Fee</span>
                      <span className="text-muted-foreground">
                        -${payment.fees.stripe.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Platform Fee</span>
                      <span className="text-muted-foreground">
                        -${payment.fees.platform.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Net Amount</span>
                      <span className="text-success">
                        ${payment.netAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye size={14} className="mr-1" />
                      Details
                    </Button>

                    {payment.refundable && payment.status === "succeeded" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <RefreshCw size={14} className="mr-1" />
                            Refund
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Process Refund</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to refund $
                              {payment.amount.toFixed(2)} to{" "}
                              {payment.buyerInfo.name}? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRefund(payment.id)}
                              disabled={refunding === payment.id}
                              className="bg-warning text-warning-foreground hover:bg-warning/90"
                            >
                              {refunding === payment.id
                                ? "Processing..."
                                : "Process Refund"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPayments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No payments found</h3>
              <p className="text-sm text-muted-foreground text-center">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <SellerBottomNavigation />
    </Layout>
  );
}
