import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ShoppingCart,
  CreditCard,
  User,
  Crown,
  ArrowLeftRight,
} from "lucide-react";
import { useAppMode } from "@/contexts/AppModeContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navItems = [
  {
    id: "cart",
    label: "Cart",
    icon: ShoppingCart,
    path: "/",
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
    path: "/payment-methods",
  },
  {
    id: "subscriptions",
    label: "Plans",
    icon: Crown,
    path: "/subscriptions",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    path: "/profile",
  },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccessSellerMode, setMode, user } = useAppMode();
  const { getTotalItems } = useCart();

  const switchToSellerMode = () => {
    if (canAccessSellerMode) {
      setMode("seller");
      navigate("/seller");
    } else {
      // Navigate to seller subscription if no access
      navigate("/seller-subscription");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2 max-w-sm mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all duration-200 relative",
                "min-w-0 flex-1 max-w-[60px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "transition-all duration-200",
                  isActive ? "scale-110" : "scale-100",
                )}
              />
              {item.id === "cart" && getTotalItems() > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                  {getTotalItems()}
                </Badge>
              )}
              <span className="text-xs font-medium mt-1 truncate">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Mode Switch Tab - Always visible */}
        <button
          onClick={switchToSellerMode}
          className={cn(
            "flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all duration-200 relative",
            "min-w-0 flex-1 max-w-[60px]",
            "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            canAccessSellerMode && "text-coral-600 hover:text-coral-700",
          )}
        >
          {canAccessSellerMode ? (
            <Crown size={18} className="transition-all duration-200" />
          ) : (
            <ArrowLeftRight size={18} className="transition-all duration-200" />
          )}
          {canAccessSellerMode && (
            <Badge className="absolute -top-1 -right-1 h-3 w-3 p-0 bg-coral-500" />
          )}
          <span className="text-xs font-medium mt-1 truncate">
            {canAccessSellerMode ? "Seller" : "Upgrade"}
          </span>
        </button>
      </div>
    </div>
  );
}
