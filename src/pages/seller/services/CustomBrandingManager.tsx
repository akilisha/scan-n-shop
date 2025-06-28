import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Palette } from "lucide-react";
import { CustomBrandingService } from "@/components/services/CustomBrandingService";

export default function CustomBrandingManager() {
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
          <Palette className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Custom Branding</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Personalize your seller profile
        </p>
      </div>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={false}>
      <CustomBrandingService />
    </Layout>
  );
}
