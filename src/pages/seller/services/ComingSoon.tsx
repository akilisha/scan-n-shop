import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BarChart3, Upload, Bell, Sparkles } from "lucide-react";
import { useState } from "react";

const serviceInfo = {
  analytics_package: {
    name: "Analytics Package",
    icon: BarChart3,
    description: "Get detailed insights into your sales performance",
    features: [
      "Real-time sales dashboard",
      "Customer demographics analysis",
      "Peak activity time tracking",
      "Revenue trend analysis",
      "Product performance metrics",
      "Geographic sales distribution",
    ],
    estimatedLaunch: "Q2 2024",
  },
  bulk_operations: {
    name: "Bulk Operations",
    icon: Upload,
    description: "Manage large inventories with powerful bulk tools",
    features: [
      "CSV import/export functionality",
      "Batch price updates",
      "Mass inventory adjustments",
      "Bulk product categorization",
      "Automated listing templates",
      "Multi-product image uploads",
    ],
    estimatedLaunch: "Q1 2024",
  },
};

export default function ComingSoon() {
  const navigate = useNavigate();
  const { serviceId } = useParams<{ serviceId: string }>();
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const service = serviceId
    ? serviceInfo[serviceId as keyof typeof serviceInfo]
    : null;

  if (!service) {
    return (
      <Layout headerContent={<h1>Service Not Found</h1>} showBottomNav={false}>
        <div className="text-center py-12">
          <p>The requested service was not found.</p>
          <Button onClick={() => navigate("/subscriptions")} className="mt-4">
            Back to Plans
          </Button>
        </div>
      </Layout>
    );
  }

  const handleNotifyMe = () => {
    if (!email) return;
    // Here you would save the email for notifications
    setIsSubscribed(true);
  };

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
          <service.icon className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">{service.name}</h1>
        </div>
        <p className="text-sm text-muted-foreground">Coming Soon</p>
      </div>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={false}>
      <div className="space-y-6">
        {/* Hero Section */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <service.icon size={32} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">{service.name}</h2>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              {service.description}
            </p>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
              <Sparkles size={14} />
              <span>Expected Launch: {service.estimatedLaunch}</span>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">What to Expect</h3>
            <div className="grid gap-3">
              {service.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-success rounded-full" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Signup */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Get Notified</h3>
            </div>

            {isSubscribed ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-6 w-6 text-success" />
                </div>
                <h4 className="font-semibold text-success mb-1">
                  You're on the list!
                </h4>
                <p className="text-sm text-muted-foreground">
                  We'll email you when {service.name} launches.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Be the first to know when {service.name} becomes available.
                  We'll send you an email with early access and special pricing.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleNotifyMe} disabled={!email}>
                    Notify Me
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Development Progress */}
        <Card className="border-dashed border-2">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Development Progress</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Feature Planning</span>
                <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">UI/UX Design</span>
                <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Backend Development</span>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">...</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Testing & Launch</span>
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">○</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
