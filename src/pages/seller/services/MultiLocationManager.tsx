import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { MultiLocationService } from "@/components/services/MultiLocationService";

export default function MultiLocationManager() {
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
          <MapPin className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Multi-Location</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your pickup locations
        </p>
      </div>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={false}>
      <MultiLocationService />
    </Layout>
  );
}
