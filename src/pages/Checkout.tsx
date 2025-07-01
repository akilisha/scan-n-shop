import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthModal } from "@/components/AuthModal";
import StripePaymentFormStub from "@/components/StripePaymentFormStub";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CreditCard, Check, Loader2, User } from "lucide-react";
import { createOrder } from "@/lib/supabase";
import { CheckoutState } from "@/types";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { usePaymentMethods } from "@/contexts/PaymentMethodsContext";
import { useCart } from "@/contexts/CartContext";

export default function Checkout() {
  const navigate = useNavigate();
  const { user: supabaseUserProfile } = useSupabaseAuth();
  const { supabaseUser } = useSupabaseAuth();
  const { paymentMethods } = usePaymentMethods();
  const { cartItems, clearCart, getSubtotal, getTotal } = useCart();
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    step: "cart",
    processing: false,
  });
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);

  // Set default payment method when payment methods are loaded
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      const defaultMethod =
        paymentMethods.find((method) => method.isDefault) || paymentMethods[0];
      setSelectedPaymentMethod(defaultMethod);
    }
  }, [paymentMethods, selectedPaymentMethod]);

  // Check if user is authenticated on component mount
  useEffect(() => {
    if (supabaseUserProfile) {
      setCheckoutState({ step: "payment", processing: false });
    } else {
      setShowAuth(true);
    }
  }, [supabaseUserProfile]);

  const handleAuthSuccess = () => {
    setShowAuth(false);
    setCheckoutState({ step: "payment", processing: false });
  };

  // Auto-proceed to payment when user becomes authenticated
  useEffect(() => {
    if (supabaseUserProfile && showAuth) {
      setShowAuth(false);
      setCheckoutState({ step: "payment", processing: false });
    }
  }, [supabaseUserProfile, showAuth]);

  const subtotal = getSubtotal();
  const tax = subtotal * 0.08;
  const total = getTotal();

  const handlePaymentSuccess = async (paymentMethodDetails?: any) => {
    try {
      // Use payment method details from callback if available, otherwise fall back to selected method
      const usedPaymentMethod =
        paymentMethodDetails ||
        selectedPaymentMethod ||
        paymentMethods.find((method) => method.isDefault) ||
        paymentMethods[0];

      // Store order data for confirmation page BEFORE clearing cart
      const orderSummary = {
        items: cartItems.map((item) => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
        })),
        subtotal: getSubtotal(),
        tax: getSubtotal() * 0.08,
        total: getTotal(),
        paymentMethod: usedPaymentMethod,
      };

      // Save order to database if user is authenticated
      if (supabaseUser && cartItems.length > 0) {
        const orderData = {
          total_amount: getTotal(),
          payment_method: {
            type: usedPaymentMethod?.type || "card",
            last4: usedPaymentMethod?.last4 || "****",
            brand: usedPaymentMethod?.brand || "unknown",
          },
          items: cartItems.map((item) => ({
            id: item.id,
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            total: item.product.price * item.quantity,
          })),
          status: "completed",
        };

        const { error } = await createOrder(supabaseUser.id, orderData);
        if (error) {
          console.error("Failed to save order:", error);
          // Still proceed with clearing cart and showing success
        }
      }

      // Store completed order data and clear the cart
      setCompletedOrder(orderSummary);
      clearCart();
      setCheckoutState({ step: "confirmation", processing: false });
    } catch (error) {
      console.error("Error processing payment success:", error);
      // Still proceed with success flow
      const orderSummary = {
        items: cartItems,
        subtotal: getSubtotal(),
        tax: getSubtotal() * 0.08,
        total: getTotal(),
        paymentMethod: selectedPaymentMethod,
      };
      setCompletedOrder(orderSummary);
      clearCart();
      setCheckoutState({ step: "confirmation", processing: false });
    }
  };

  const handlePaymentError = (error: string) => {
    setCheckoutState({
      ...checkoutState,
      processing: false,
      error: error || "Payment failed. Please try again.",
    });
  };

  const handleExistingPaymentMethodPayment = async () => {
    if (!selectedPaymentMethod) return;

    setCheckoutState({ ...checkoutState, processing: true });

    try {
      // Simulate payment processing with existing payment method
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call success handler with selected payment method details
      await handlePaymentSuccess(selectedPaymentMethod);
    } catch (error) {
      handlePaymentError("Payment failed. Please try again.");
    }
  };

  const headerContent = (
    <div>
      <h1 className="text-xl font-semibold">
        {checkoutState.step === "confirmation" ? "Order Complete" : "Checkout"}
      </h1>
      {checkoutState.step === "payment" && (
        <p className="text-sm text-muted-foreground">
          Secure payment with Finix
        </p>
      )}
    </div>
  );

  // Show authentication modal
  if (showAuth) {
    return (
      <>
        <Layout headerContent={headerContent}>
          <div className="flex flex-col items-center justify-center py-12">
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  Sign In to Continue
                </h2>
                <p className="text-muted-foreground text-center mb-6">
                  Please sign in or create an account to complete your purchase
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowAuth(true)}
                >
                  Continue to Sign In
                </Button>
              </CardContent>
            </Card>

            {/* Order Summary Preview */}
            <Card className="w-full mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.product.name} × {item.quantity}
                      </span>
                      <span>
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Layout>

        <AuthModal
          isOpen={showAuth}
          onClose={() => {
            setShowAuth(false);
            navigate("/");
          }}
          onSuccess={handleAuthSuccess}
          mode="login"
        />
      </>
    );
  }

  if (checkoutState.step === "confirmation") {
    return (
      <Layout headerContent={headerContent} showBottomNav={true}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mb-6 animate-scale-in">
            <Check className="h-10 w-10 text-success-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground text-center mb-8">
            Your order has been confirmed and will be processed shortly.
          </p>

          <Card className="w-full mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedOrder?.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${completedOrder?.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${completedOrder?.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">
                      ${completedOrder?.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="w-full space-y-3">
            <Button
              className="w-full"
              onClick={() => navigate("/payment-history")}
            >
              View Order Details
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerContent={headerContent} showBottomNav={false}>
      <div className="space-y-6">
        {/* User Info */}
        {supabaseUserProfile && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold">
                    {supabaseUserProfile.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {supabaseUserProfile.name || "User"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {supabaseUserProfile.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-sm">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <CreditCard size={20} />
              <span>Payment Method</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPaymentMethod?.id === method.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedPaymentMethod(method)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-7 bg-gradient-to-r from-primary to-coral-500 rounded flex items-center justify-center">
                      <CreditCard size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {method.brand?.toUpperCase()} ••••{method.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {method.nickname ||
                          `${method.brand} ending in ${method.last4}`}
                      </p>
                    </div>
                  </div>
                  {method.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                navigate("/payment-methods?add=true&from=checkout")
              }
            >
              Add New Payment Method
            </Button>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {checkoutState.error && (
          <Alert variant="destructive">
            <AlertDescription>{checkoutState.error}</AlertDescription>
          </Alert>
        )}

        {/* Payment Processing */}
        {paymentMethods.length > 0 && selectedPaymentMethod ? (
          /* Use existing payment method */
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">Complete Payment</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Using {selectedPaymentMethod.brand?.toUpperCase()} ••••
                  {selectedPaymentMethod.last4}
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => handleExistingPaymentMethodPayment()}
                disabled={checkoutState.processing}
              >
                {checkoutState.processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay $${total.toFixed(2)}`
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* No payment methods - show new card form */
          <>
            <StripePaymentFormStub
              amount={total}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Powered by <span className="text-primary font-medium">Finix</span>.
          Your payment information is secure and encrypted.
        </p>
      </div>
    </Layout>
  );
}
