import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Package,
  QrCode,
  CreditCard,
  BarChart3,
  Settings,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppMode } from "@/contexts/AppModeContext";

const sellerNavItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    path: "/seller",
  },
  {
    id: "products",
    label: "Products",
    icon: Package,
    path: "/seller/products",
  },
  {
    id: "codes",
    label: "Codes",
    icon: QrCode,
    path: "/seller/codes",
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
    path: "/seller/payments",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/seller/settings",
  },
];

export function SellerBottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setMode } = useAppMode();

  const switchToBuyerMode = () => {
    setMode("buyer");
    navigate("/");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2 max-w-sm mx-auto">
        {sellerNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all duration-200",
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
              <span className="text-xs font-medium mt-1 truncate">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Mode Switch Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={switchToBuyerMode}
          className="flex flex-col items-center justify-center py-2 px-2 min-w-0 max-w-[60px] h-auto"
        >
          <ArrowLeftRight size={18} />
          <span className="text-xs font-medium mt-1">Buyer</span>
        </Button>
      </div>
    </div>
  );
}
