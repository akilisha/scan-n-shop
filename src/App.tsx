import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { PaymentMethodsProvider } from "@/contexts/PaymentMethodsContext";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { CartProvider } from "@/contexts/CartContext";
import { DemoProvider } from "@/contexts/DemoContext";

// Buyer Mode Pages
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import PaymentMethods from "./pages/PaymentMethods";
import PaymentHistory from "./pages/PaymentHistory";
import Plans from "./pages/Plans";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import SellerSubscription from "./pages/SellerSubscription";
import AuthCallback from "./pages/AuthCallback";
import DiscoverNearby from "./pages/DiscoverNearby";
import EventManager from "./pages/seller/EventManager";

// Seller Mode Pages
import SellerDashboard from "./pages/seller/Dashboard";
import CodeGenerator from "./pages/seller/CodeGenerator";
import PaymentManagement from "./pages/seller/PaymentManagement";
import AddProduct from "./pages/seller/AddProduct";
import EditProduct from "./pages/seller/EditProduct";
import ProductManager from "./pages/seller/ProductManager";
import PremiumListingsManager from "./pages/seller/services/PremiumListingsManager";
import CustomBrandingManager from "./pages/seller/services/CustomBrandingManager";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SupabaseAuthProvider>
        <DemoProvider>
          <PaymentMethodsProvider>
            <CartProvider>
              <AppModeProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Buyer Mode Routes */}
                    <Route path="/" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route
                      path="/payment-methods"
                      element={<PaymentMethods />}
                    />
                    <Route
                      path="/payment-history"
                      element={<PaymentHistory />}
                    />
                    <Route path="/subscriptions" element={<Plans />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route
                      path="/seller-subscription"
                      element={<SellerSubscription />}
                    />
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Location-Based Discovery Routes */}
                    <Route path="/discover" element={<DiscoverNearby />} />

                    {/* Seller Mode Routes */}
                    <Route path="/seller" element={<SellerDashboard />} />
                    <Route
                      path="/seller/products"
                      element={<ProductManager />}
                    />
                    <Route
                      path="/seller/products/new"
                      element={<AddProduct />}
                    />
                    <Route
                      path="/seller/products/edit/:productId"
                      element={<EditProduct />}
                    />
                    <Route path="/seller/codes" element={<CodeGenerator />} />
                    <Route
                      path="/seller/payments"
                      element={<PaymentManagement />}
                    />
                    <Route path="/seller/events" element={<EventManager />} />

                    {/* Value-Added Service Management Routes */}
                    <Route
                      path="/seller/services/premium_listings"
                      element={<PremiumListingsManager />}
                    />
                    <Route
                      path="/seller/services/custom_branding"
                      element={<CustomBrandingManager />}
                    />
                    {/* Add more seller routes as they're created */}

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </AppModeProvider>
            </CartProvider>
          </PaymentMethodsProvider>
        </DemoProvider>
      </SupabaseAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
