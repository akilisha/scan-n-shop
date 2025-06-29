import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Star,
  Palette,
  MapPin,
  BarChart3,
  Upload,
  Crown,
  Sparkles,
  Globe,
  TrendingUp,
  Zap,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

interface ValueAddedService {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
  price: number;
  billingType: "monthly" | "per_use" | "annual";
  status: "available" | "active" | "coming_soon";
  category: "premium_features" | "backend_services" | "tools";
  features: string[];
  popular?: boolean;
}

const valueAddedServices: ValueAddedService[] = [
  {
    id: "premium_listings",
    name: "Premium Listings",
    description: "Boost your products and events for better visibility",
    icon: Star,
    price: 4.99,
    billingType: "per_use",
    status: "available",
    category: "premium_features",
    features: [
      "Featured placement in discovery radius",
      "Highlighted pins on map view",
      "Priority in search results",
      "Enhanced listing appearance",
      "Performance analytics included",
    ],
    popular: true,
  },
  {
    id: "custom_branding",
    name: "Custom Branding",
    description: "Personalize your seller profile with colors and logo",
    icon: Palette,
    price: 9.99,
    billingType: "monthly",
    status: "available",
    category: "premium_features",
    features: [
      "Custom theme colors",
      "Upload your logo",
      "Branded seller profile",
      "Enhanced storefront appearance",
      "Professional look and feel",
    ],
  },
  {
    id: "multi_location",
    name: "Multi-Location",
    description: "Multiple pickup points for your products",
    icon: MapPin,
    price: 7.99,
    billingType: "monthly",
    status: "available",
    category: "premium_features",
    features: [
      "Multiple pickup locations per product",
      "Location-specific inventory",
      "Flexible meetup options",
      "Enhanced customer convenience",
      "Broader market reach",
    ],
  },
  {
    id: "analytics_package",
    name: "Analytics Package",
    description: "Detailed insights and reporting dashboard",
    icon: BarChart3,
    price: 19.99,
    billingType: "monthly",
    status: "coming_soon",
    category: "backend_services",
    features: [
      "Sales performance tracking",
      "Customer demographics",
      "Peak activity times",
      "Revenue analytics",
      "Desktop dashboard access",
    ],
  },
  {
    id: "bulk_operations",
    name: "Bulk Operations",
    description: "Manage large inventories with ease",
    icon: Upload,
    price: 14.99,
    billingType: "monthly",
    status: "coming_soon",
    category: "backend_services",
    features: [
      "CSV import/export",
      "Batch price updates",
      "Bulk inventory management",
      "Mass product edits",
      "Time-saving automations",
    ],
  },
];

export default function Plans() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Services", count: valueAddedServices.length },
    {
      id: "premium_features",
      label: "Premium Features",
      count: valueAddedServices.filter((s) => s.category === "premium_features")
        .length,
    },
    {
      id: "backend_services",
      label: "Analytics & Tools",
      count: valueAddedServices.filter((s) => s.category === "backend_services")
        .length,
    },
  ];

  const filteredServices =
    selectedCategory === "all"
      ? valueAddedServices
      : valueAddedServices.filter(
          (service) => service.category === selectedCategory,
        );

  const getStatusBadge = (status: ValueAddedService["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            Active
          </Badge>
        );
      case "coming_soon":
        return (
          <Badge variant="outline" className="border-warning text-warning">
            Coming Soon
          </Badge>
        );
      default:
        return null;
    }
  };

  const getServiceIcon = (status: ValueAddedService["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle size={16} className="text-success" />;
      case "coming_soon":
        return <Clock size={16} className="text-warning" />;
      default:
        return <Zap size={16} className="text-primary" />;
    }
  };

  const getPriceDisplay = (service: ValueAddedService) => {
    switch (service.billingType) {
      case "per_use":
        return `$${service.price}/boost`;
      case "monthly":
        return `$${service.price}/month`;
      case "annual":
        return `$${service.price}/year`;
      default:
        return `$${service.price}`;
    }
  };

  const handleServiceAction = (service: ValueAddedService) => {
    if (service.status === "coming_soon") {
      navigate(`/seller/services/${service.id}/coming-soon`);
      return;
    }

    if (service.status === "active") {
      // Navigate to manage/configure service
      navigate(`/seller/services/${service.id}`);
    } else {
      // Navigate to purchase/enable service (for now, same as manage)
      navigate(`/seller/services/${service.id}`);
    }
  };

  const headerContent = (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Crown className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Value-Added Services</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Enhance your selling experience with premium features
      </p>
    </div>
  );

  if (!user) {
    return (
      <Layout headerContent={headerContent} showBottomNav={true}>
        <div className="flex flex-col items-center justify-center py-12">
          <Globe className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Please sign in to access value-added services and enhance your
            selling experience.
          </p>
          <Button onClick={() => navigate("/profile")}>Sign In</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerContent={headerContent} showBottomNav={true}>
      <div className="space-y-6">
        {/* Summary Card */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Seller Enhancement Hub
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Unlock advanced features to grow your local business and reach
                  more customers.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} className="text-success" />
                    <span className="text-muted-foreground">
                      Boost visibility
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-muted-foreground">Stand out</span>
                  </div>
                </div>
              </div>
              <Crown className="h-12 w-12 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.label}
              <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="space-y-4">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className={`transition-all duration-200 ${
                service.popular
                  ? "ring-2 ring-primary/20 border-primary/30"
                  : ""
              } ${
                service.status === "coming_soon"
                  ? "opacity-75"
                  : "hover:shadow-md"
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        service.status === "active"
                          ? "bg-success/10"
                          : service.status === "coming_soon"
                            ? "bg-warning/10"
                            : "bg-primary/10"
                      }`}
                    >
                      <service.icon
                        size={20}
                        className={
                          service.status === "active"
                            ? "text-success"
                            : service.status === "coming_soon"
                              ? "text-warning"
                              : "text-primary"
                        }
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {service.name}
                        </CardTitle>
                        {service.popular && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            Popular
                          </Badge>
                        )}
                        {getStatusBadge(service.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {getPriceDisplay(service)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {service.billingType.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Features List */}
                <div className="space-y-2 mb-4">
                  {service.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle
                        size={14}
                        className="text-success flex-shrink-0"
                      />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Action Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getServiceIcon(service.status)}
                    <span className="text-sm font-medium">
                      {service.status === "active"
                        ? "Active Service"
                        : service.status === "coming_soon"
                          ? "Coming Soon"
                          : "Available Now"}
                    </span>
                  </div>

                  <Button
                    onClick={() => handleServiceAction(service)}
                    disabled={service.status === "coming_soon"}
                    variant={
                      service.status === "active" ? "outline" : "default"
                    }
                    size="sm"
                  >
                    {service.status === "active"
                      ? "Manage"
                      : service.status === "coming_soon"
                        ? "Notify Me"
                        : "Get Started"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Info */}
        <Card className="border-dashed border-2">
          <CardContent className="p-6 text-center">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Need Something Custom?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Have specific requirements? We're always looking to add features
              that help our sellers succeed.
            </p>
            <Button variant="outline" onClick={() => navigate("/profile")}>
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
