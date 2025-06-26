import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Layout showBottomNav={false}>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground text-center mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="space-y-3 w-full">
              <Button className="w-full" onClick={() => navigate("/")}>
                <ArrowLeft size={16} className="mr-2" />
                Back to Cart
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
