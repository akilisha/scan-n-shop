import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { SellerBottomNavigation } from "./SellerBottomNavigation";

import { DevelopmentNotice } from "./DevelopmentNotice";
import { useAppMode } from "@/contexts/AppModeContext";

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {headerContent && (
        <header
          className={cn(
            "sticky z-40 bg-background/80 backdrop-blur-sm border-b border-border safe-area-top top-0",
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
          className,
        )}
      >
        <DevelopmentNotice />
        {children}
      </main>

      {/* Bottom Navigation - Always show based on mode */}
      {showBottomNav &&
        (mode === "seller" ? <SellerBottomNavigation /> : <BottomNavigation />)}
    </div>
  );
}
