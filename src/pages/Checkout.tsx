import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { Layout } from "@/components/Layout";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CreditCard, Check, Loader2, User } from "lucide-react";
import { stripePromise, STRIPE_CONFIG, confirmPayment } from "@/lib/stripe";
import { mockCartItems, mockPaymentMethods } from "@/data/mockData";
import { CheckoutState, PaymentMethod } from "@/types";

export default function Checkout() {
  const navigate = useNavigate();
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    step: "cart",
    processing: false,
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(mockPaymentMethods[0]);
  const [cartItems] = useState(mockCartItems);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);

  // Check if user is authenticated on component mount
  useEffect(() => {
    // In a real app, check if user is logged in from localStorage/context
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCheckoutState({ step: "payment", processing: false });
    } else {
      setShowAuth(true);
    }
  }, []);

  const handleAuthSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
    localStorage.setItem("user", JSON.stringify(authenticatedUser));
    setShowAuth(false);
    setCheckoutState({ step: "payment", processing: false });
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handlePayment = async () => {
    setCheckoutState({ ...checkoutState, processing: true, error: undefined });

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real app, you would create and confirm a payment intent here
      // const result = await confirmPayment(clientSecret);

      setCheckoutState({ step: "confirmation", processing: false });
    } catch (error) {
      setCheckoutState({
        ...checkoutState,
        processing: false,
        error: "Payment failed. Please try again.",
      });
    }
  };

  const headerContent = (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          checkoutState.step === "confirmation" ? navigate("/") : navigate(-1)
        }
        className="p-2"
      >
        <ArrowLeft size={20} />
      </Button>
      <div>
        <h1 className="text-xl font-semibold">
          {checkoutState.step === "confirmation"
            ? "Order Complete"
            : "Checkout"}
        </h1>
        {checkoutState.step === "payment" && (
          <p className="text-sm text-muted-foreground">
            Secure payment with Stripe
          </p>
        )}
      </div>
    </div>
  );

  // Show authentication modal
  if (showAuth) {
    return (
      <>
        <Layout headerContent={headerContent} showBottomNav={false}>
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
      <Layout headerContent={headerContent} showBottomNav={false}>
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
        {user && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold">
                    {user.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{user.name || "User"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
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
            {mockPaymentMethods.map((method) => (
              <div
                key={method.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPaymentMethod.id === method.id
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
                        {method.nickname}
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
              onClick={() => navigate("/payment-methods?add=true")}
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

        {/* Payment Button */}
        <div className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
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

          <p className="text-xs text-center text-muted-foreground">
            Powered by <span className="text-primary font-medium">Stripe</span>.
            Your payment information is secure and encrypted.
          </p>
        </div>
      </div>
    </Layout>
  );
}
