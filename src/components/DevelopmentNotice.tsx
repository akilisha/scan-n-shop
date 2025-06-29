import { Alert, AlertDescription } from "@/components/ui/alert";
import { isUsingFallbackCredentials } from "@/lib/supabase";
import { AlertTriangle } from "lucide-react";

export function DevelopmentNotice() {
  if (!isUsingFallbackCredentials) {
    return null;
  }

  return (
    <Alert className="mb-4 border-warning/20 bg-warning/5">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertDescription className="text-warning">
        <strong>Development Mode:</strong> Using fallback Supabase credentials.{" "}
        <span className="text-xs">
          Add real credentials to .env for full functionality.
        </span>
      </AlertDescription>
    </Alert>
  );
}
