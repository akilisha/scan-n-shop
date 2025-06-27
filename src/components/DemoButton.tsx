import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Play,
  X,
  Sparkles,
  ShoppingCart,
  Store,
  CreditCard,
  QrCode,
} from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { cn } from "@/lib/utils";

export function DemoButton() {
  const { supabaseUser } = useSupabaseAuth(); // Use real Supabase auth state
  const {
    isDemoMode,
    enterDemoMode,
    exitDemoMode,
    showDemoButton,
    hideDemoButton,
  } = useDemo();
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-exit demo mode when real user signs in
  useState(() => {
    if (supabaseUser && isDemoMode) {
      exitDemoMode();
    }
  });

  // Don't show if real user is signed in or demo button was dismissed
  if (supabaseUser || !showDemoButton) {
    return null;
  }

  if (isDemoMode) {
    return (
      <>
        {/* Top banner for demo mode - always visible */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 max-w-sm mx-auto">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span className="font-semibold text-sm">Demo Mode Active</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={exitDemoMode}
              className="h-7 px-2 text-xs text-white hover:bg-white/20"
            >
              Exit Demo
            </Button>
          </div>
        </div>

        {/* Bottom floating indicator */}
        <div className="fixed bottom-24 right-4 z-40 animate-fade-in">
          <Card className="border-amber-500 bg-amber-50 border-2 shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-amber-900">
                    Demo Mode
                  </p>
                  <p className="text-xs text-amber-700">Sample data active</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exitDemoMode}
                  className="h-8 px-2 text-xs border-amber-500 text-amber-700 hover:bg-amber-100"
                >
                  Exit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-50">
      {!isExpanded ? (
        <Button
          onClick={() => setIsExpanded(true)}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg animate-bounce",
            "bg-gradient-to-r from-primary to-coral-500 hover:from-primary/90 hover:to-coral-500/90",
            "border-2 border-white",
          )}
        >
          <Play className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-72 animate-scale-in border-primary/20 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-coral-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Try Demo Mode</h3>
                  <Badge variant="secondary" className="text-xs">
                    No signup required
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="p-1 h-auto"
              >
                <X size={16} />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Experience the full app with sample data. Explore scanning,
              payments, and seller features instantly!
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm">
                <ShoppingCart size={14} className="text-primary" />
                <span>Pre-loaded shopping cart</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <QrCode size={14} className="text-primary" />
                <span>Barcode scanning simulator</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CreditCard size={14} className="text-primary" />
                <span>Payment & checkout flow</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Store size={14} className="text-primary" />
                <span>Seller dashboard & tools</span>
              </div>
            </div>

            <div className="space-y-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" size="lg">
                    <Play className="w-4 h-4 mr-2" />
                    Start Demo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Start Demo Mode?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You'll experience the app with sample data including a
                      pre-loaded cart, payment methods, and seller features. You
                      can exit demo mode anytime.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={enterDemoMode}>
                      Start Demo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="flex-1"
                >
                  Maybe Later
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={hideDemoButton}
                  className="flex-1 text-xs"
                >
                  Don't Show Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
