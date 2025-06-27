import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { CartProvider } from "@/contexts/CartContext";
import { DemoProvider } from "@/contexts/DemoContext";

// Buyer Mode Pages
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import PaymentMethods from "./pages/PaymentMethods";
import PaymentHistory from "./pages/PaymentHistory";
import Subscriptions from "./pages/Subscriptions";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import SellerSubscription from "./pages/SellerSubscription";

// Seller Mode Pages
import SellerDashboard from "./pages/seller/Dashboard";
import CodeGenerator from "./pages/seller/CodeGenerator";
import PaymentManagement from "./pages/seller/PaymentManagement";
import AddProduct from "./pages/seller/AddProduct";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Elements stripe={stripePromise}>
        <DemoProvider>
          <CartProvider>
            <AppModeProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Buyer Mode Routes */}
                  <Route path="/" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/payment-methods" element={<PaymentMethods />} />
                  <Route path="/payment-history" element={<PaymentHistory />} />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route
                    path="/seller-subscription"
                    element={<SellerSubscription />}
                  />

                  {/* Seller Mode Routes */}
                  <Route path="/seller" element={<SellerDashboard />} />
                  <Route path="/seller/products/new" element={<AddProduct />} />
                  <Route path="/seller/codes" element={<CodeGenerator />} />
                  <Route
                    path="/seller/payments"
                    element={<PaymentManagement />}
                  />
                  {/* Add more seller routes as they're created */}

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </AppModeProvider>
          </CartProvider>
        </DemoProvider>
      </Elements>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
