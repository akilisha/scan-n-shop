import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // First, try to get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          navigate("/?auth=error&message=" + encodeURIComponent(error.message));
          return;
        }

        if (data.session) {
          // Successfully authenticated
          console.log("Authentication successful, redirecting to home");
          navigate("/?auth=success");
        } else {
          // Try to handle the callback from URL parameters
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1),
          );
          const urlParams = new URLSearchParams(window.location.search);

          // Check for error in URL
          const error_code = hashParams.get("error") || urlParams.get("error");
          const error_description =
            hashParams.get("error_description") ||
            urlParams.get("error_description");

          if (error_code) {
            console.error("OAuth error:", error_code, error_description);
            navigate(
              "/?auth=error&message=" +
                encodeURIComponent(error_description || error_code),
            );
            return;
          }

          // No session and no error, likely cancelled
          console.log("No session found, redirecting as cancelled");
          navigate("/?auth=cancelled");
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error);
        navigate(
          "/?auth=error&message=" +
            encodeURIComponent("Unexpected authentication error"),
        );
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <Layout showBottomNav={false}>
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Completing sign in...
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we complete your authentication.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
