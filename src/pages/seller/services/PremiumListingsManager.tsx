import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";
import { PremiumListingsService } from "@/components/services/PremiumListingsService";

export default function PremiumListingsManager() {
  const navigate = useNavigate();

  const headerContent = (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/subscriptions")}
        className="p-2"
      >
        <ArrowLeft size={18} />
      </Button>
      <div>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Premium Listings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your boosted products and events
        </p>
      </div>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={false}>
      <PremiumListingsService />
    </Layout>
  );
}
