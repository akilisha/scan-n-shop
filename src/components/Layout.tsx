import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
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
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {headerContent && (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border safe-area-top">
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
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNavigation />}
    </div>
  );
}
