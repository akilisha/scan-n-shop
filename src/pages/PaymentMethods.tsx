import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { Layout } from "@/components/Layout";
import { PaymentForm } from "@/components/PaymentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  CreditCard,
  Plus,
  MoreVertical,
  Trash2,
  History,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { stripePromise } from "@/lib/stripe";
import { mockPaymentMethods } from "@/data/mockData";
import { PaymentMethod } from "@/types";

export default function PaymentMethods() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>(mockPaymentMethods);
  const [showAddForm, setShowAddForm] = useState(
    searchParams.get("add") === "true",
  );
  const [success, setSuccess] = useState<string | null>(null);

  const deletePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter((method) => method.id !== id));
    setSuccess("Payment method removed successfully");
    setTimeout(() => setSuccess(null), 3000);
  };

  const setDefaultPaymentMethod = (id: string) => {
    setPaymentMethods(
      paymentMethods.map((method) => ({
        ...method,
        isDefault: method.id === id,
      })),
    );
    setSuccess("Default payment method updated");
    setTimeout(() => setSuccess(null), 3000);
  };

  const handlePaymentSuccess = () => {
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: "card",
      last4: "4242",
      brand: "visa",
      expiryMonth: 12,
      expiryYear: 2027,
      isDefault: paymentMethods.length === 0,
      nickname: "New Card",
    };
    setPaymentMethods([...paymentMethods, newMethod]);
    setShowAddForm(false);
    setSuccess("Payment method added successfully");
    setTimeout(() => setSuccess(null), 3000);
  };

  const headerContent = (
    <div>
      <h1 className="text-xl font-semibold">Payment Methods</h1>
      <p className="text-sm text-muted-foreground">
        Manage your saved payment methods
      </p>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={true}>
      <div className="space-y-6">
        {success && (
          <Alert className="border-success text-success">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Add Payment Method Form */}
        {showAddForm && (
          <Elements stripe={stripePromise}>
            <PaymentForm
              amount={0}
              onSuccess={handlePaymentSuccess}
              onError={(error) => console.error("Payment error:", error)}
            />
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </Elements>
        )}

        {/* Existing Payment Methods */}
        {!showAddForm && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Cards</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Card</span>
              </Button>
            </div>

            {paymentMethods.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No payment methods</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Add a payment method to make purchases easier
                  </p>
                  <Button onClick={() => setShowAddForm(true)}>
                    Add Payment Method
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <Card key={method.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-8 bg-gradient-to-r from-primary to-coral-500 rounded flex items-center justify-center">
                            <CreditCard size={20} className="text-white" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">
                                {method.brand?.toUpperCase()} ••••{method.last4}
                              </p>
                              {method.isDefault && (
                                <Badge variant="secondary" className="text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {method.nickname} • Expires {method.expiryMonth}/
                              {method.expiryYear}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!method.isDefault && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setDefaultPaymentMethod(method.id)
                                }
                              >
                                Set as Default
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => deletePaymentMethod(method.id)}
                              className="text-destructive"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/payment-history")}
                  >
                    <History size={16} className="mr-2" />
                    View Payment History
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Security</h3>
                <p className="text-sm text-muted-foreground">
                  Your payment information is encrypted and securely stored by
                  Stripe. We never store your full card details on our servers.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
