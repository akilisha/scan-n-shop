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
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          navigate("/?auth=error");
          return;
        }

        if (data.session) {
          // Successfully authenticated
          navigate("/?auth=success");
        } else {
          // No session, redirect to login
          navigate("/?auth=cancelled");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        navigate("/?auth=error");
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
