import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { SellerBottomNavigation } from "./SellerBottomNavigation";
import { DemoButton } from "./DemoButton";
import { useAppMode } from "@/contexts/AppModeContext";
import { useDemo } from "@/contexts/DemoContext";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  className?: string;
  showBottomNav?: boolean;
  headerContent?: ReactNode;
}

export function Layout({
  children,
  className,
  showBottomNav = true,
  headerContent,
}: LayoutProps) {
  const { mode } = useAppMode();
  const { isDemoMode } = useDemo();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {headerContent && (
        <header
          className={cn(
            "sticky z-40 bg-background/80 backdrop-blur-sm border-b border-border safe-area-top",
            isDemoMode ? "top-10" : "top-0",
          )}
        >
          <div className="mobile-container py-4">{headerContent}</div>
        </header>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 mobile-container",
          showBottomNav ? "pb-20" : "pb-4",
          !headerContent && "pt-4 safe-area-top",
          isDemoMode && !headerContent && "pt-14", // Extra padding for demo banner
          isDemoMode && headerContent && "pt-4", // Header already accounts for demo banner
          className,
        )}
      >
        {children}
      </main>

      {/* Bottom Navigation - Always show based on mode */}
      {showBottomNav &&
        (mode === "seller" ? <SellerBottomNavigation /> : <BottomNavigation />)}

      {/* Demo Button - Only show for non-signed-in users */}
      <DemoButton />
    </div>
  );
}
