import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Package,
  CreditCard,
  Calendar,
  Download,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

interface OrderDetailsProps {
  // For when navigating directly from checkout completion
  orderData?: {
    items: any[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: any;
  };
}

export default function OrderDetails({ orderData }: OrderDetailsProps) {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState<any>(null);

  // Use passed orderData (from checkout completion) or location state or fetch by orderId
  useEffect(() => {
    const stateOrderData = location.state?.orderData;
    if (orderData || stateOrderData) {
      const dataToUse = orderData || stateOrderData;
      // Create a mock order from the checkout data
      const mockOrder = {
        id: `order_${Date.now()}`,
        date: new Date(),
        status: "completed",
        items: dataToUse.items,
        subtotal: dataToUse.subtotal,
        tax: dataToUse.tax,
        total: dataToUse.total,
        paymentMethod: dataToUse.paymentMethod,
      };
      setOrder(mockOrder);
    } else if (orderId) {
      // In a real app, you would fetch the order by ID from your backend
      // For now, we'll show a placeholder
      setOrder({
        id: orderId,
        date: new Date(),
        status: "completed",
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        paymentMethod: { brand: "visa", last4: "4242" },
      });
    }
  }, [orderData, orderId, location.state]);

  if (!order) {
    return (
      <Layout
        headerContent={
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
              <h1 className="text-xl font-semibold">Order Details</h1>
            </div>
          </div>
        }
        showBottomNav={false}
      >
        <div className="flex items-center justify-center py-12">
          <p>Loading order details...</p>
        </div>
      </Layout>
    );
  }

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
        <h1 className="text-xl font-semibold">Order Details</h1>
        <p className="text-sm text-muted-foreground">
          Order #{order.id.slice(-8)}
        </p>
      </div>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={false}>
      <div className="space-y-6">
        {/* Order Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Order Completed</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(order.date, "MMMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-success/10 text-success border-success/20"
              >
                Completed
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Order ID</p>
                <p className="font-medium font-mono">{order.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium">
                  {order.paymentMethod?.brand?.toUpperCase()} ••••
                  {order.paymentMethod?.last4}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package size={20} />
              <span>Items Ordered</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {item.product.description}
                    </p>
                    <p className="text-sm font-medium">
                      Qty: {item.quantity} × ${item.product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/payment-history")}
              >
                <Calendar size={16} className="mr-2" />
                View All Orders
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/")}
              >
                <RotateCcw size={16} className="mr-2" />
                Shop Again
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <Download size={16} className="mr-2" />
                Download Receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
