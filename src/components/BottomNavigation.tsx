import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ShoppingCart,
  CreditCard,
  History,
  User,
  Settings,
  Crown,
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
    id: "payment",
    label: "Payment",
    icon: CreditCard,
    path: "/payment-methods",
  },
  {
    id: "history",
    label: "History",
    icon: History,
    path: "/payment-history",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    path: "/profile",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccessSellerMode, setMode } = useAppMode();
  const { getTotalItems } = useCart();

  const switchToSellerMode = () => {
    setMode("seller");
    navigate("/seller");
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

        {/* Seller Mode Button - Only show if user has access */}
        {canAccessSellerMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={switchToSellerMode}
            className="flex flex-col items-center justify-center py-2 px-2 min-w-0 max-w-[60px] h-auto text-primary"
          >
            <Crown size={18} />
            <span className="text-xs font-medium mt-1">Seller</span>
          </Button>
        )}
      </div>
    </div>
  );
}
