import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Search,
  Download,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockPaymentHistory } from "@/data/mockData";
import { PaymentHistory } from "@/types";
import { format } from "date-fns";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useDemo } from "@/contexts/DemoContext";
import { getUserOrders } from "@/lib/supabase";

export default function PaymentHistoryPage() {
  const navigate = useNavigate();
  const { supabaseUser } = useSupabaseAuth();
  const { isDemoMode } = useDemo();
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Use mock data in demo mode, real data for authenticated users
  const effectivePayments = isDemoMode ? mockPaymentHistory : payments;

  useEffect(() => {
    if (supabaseUser && !isDemoMode) {
      loadUserOrders();
    }
  }, [supabaseUser, isDemoMode]);

  const loadUserOrders = async () => {
    if (!supabaseUser) return;

    setLoading(true);
    try {
      const { data, error } = await getUserOrders(supabaseUser.id);

      if (error) {
        console.error("Error loading orders:", error);
        return;
      }

      // Convert orders to payment history format
      const convertedPayments: PaymentHistory[] = (data || []).map((order) => ({
        id: order.id,
        amount: order.total_amount,
        currency: "usd",
        status:
          order.status === "completed"
            ? "succeeded"
            : (order.status as PaymentHistory["status"]),
        description: `Order #${order.id.slice(0, 8)}`,
        date: new Date(order.created_at),
        paymentMethod: {
          type: order.payment_method.type || "card",
          brand: order.payment_method.brand || "unknown",
          last4: order.payment_method.last4 || "****",
        },
        items: order.items || [],
        receiptUrl: null,
      }));

      setPayments(convertedPayments);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: PaymentHistory["status"]) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "refunded":
        return <RotateCcw className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: PaymentHistory["status"]) => {
    const variants: Record<PaymentHistory["status"], string> = {
      succeeded: "bg-success/10 text-success border-success/20",
      pending: "bg-warning/10 text-warning border-warning/20",
      failed: "bg-destructive/10 text-destructive border-destructive/20",
      refunded: "bg-muted text-muted-foreground border-border",
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const totalAmount = payments
    .filter((p) => p.status === "succeeded")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const headerContent = (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/payment-methods")}
        className="p-2"
      >
        <ArrowLeft size={20} />
      </Button>
      <div>
        <h1 className="text-xl font-semibold">Payment History</h1>
        <p className="text-sm text-muted-foreground">
          Track all your transactions
        </p>
      </div>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={false}>
      <div className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-primary">
                ${totalAmount.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {payments.filter((p) => p.status === "succeeded").length}{" "}
                successful transactions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="flex space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="px-3">
                <Filter size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All Transactions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("succeeded")}>
                Successful
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("failed")}>
                Failed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("refunded")}>
                Refunded
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Payment History List */}
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No transactions found</h3>
              <p className="text-sm text-muted-foreground text-center">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Your payment history will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium truncate">
                          {payment.description}
                        </h3>
                        {getStatusBadge(payment.status)}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-semibold">
                            ${payment.amount.toFixed(2)}{" "}
                            {payment.currency.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Date</span>
                          <span>{format(payment.date, "MMM dd, yyyy")}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Payment Method
                          </span>
                          <span>
                            {payment.paymentMethod.brand?.toUpperCase()} ••••
                            {payment.paymentMethod.last4}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Transaction ID
                          </span>
                          <span className="font-mono text-xs">
                            {payment.id}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      {payment.items.length > 0 && (
                        <>
                          <Separator className="my-3" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Items</p>
                            {payment.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center space-x-3"
                              >
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {item.product.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {item.quantity} • $
                                    {item.product.price.toFixed(2)} each
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 mt-4">
                    {payment.receiptUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Download size={14} />
                        <span>Receipt</span>
                      </Button>
                    )}
                    {payment.status === "succeeded" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/checkout")}
                      >
                        Buy Again
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
