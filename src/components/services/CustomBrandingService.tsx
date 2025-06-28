import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Palette,
  Upload,
  Eye,
  RotateCcw,
  CheckCircle,
  ImageIcon,
} from "lucide-react";

interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  businessName: string;
  isActive: boolean;
}

const defaultBranding: BrandingSettings = {
  primaryColor: "#3b82f6",
  secondaryColor: "#f1f5f9",
  businessName: "My Local Business",
  isActive: false,
};

const presetColors = [
  { name: "Ocean Blue", primary: "#3b82f6", secondary: "#dbeafe" },
  { name: "Forest Green", primary: "#059669", secondary: "#dcfce7" },
  { name: "Sunset Orange", primary: "#ea580c", secondary: "#fed7aa" },
  { name: "Royal Purple", primary: "#7c3aed", secondary: "#e9d5ff" },
  { name: "Cherry Red", primary: "#dc2626", secondary: "#fecaca" },
  { name: "Gold", primary: "#d97706", secondary: "#fef3c7" },
];

export function CustomBrandingService() {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [isUploading, setIsUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleColorChange = (type: "primary" | "secondary", color: string) => {
    setBranding((prev) => ({
      ...prev,
      [type === "primary" ? "primaryColor" : "secondaryColor"]: color,
    }));
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      setBranding((prev) => ({
        ...prev,
        logoUrl: URL.createObjectURL(file),
      }));
      setIsUploading(false);
    }, 2000);
  };

  const resetToDefaults = () => {
    setBranding(defaultBranding);
  };

  const saveBranding = () => {
    setBranding((prev) => ({ ...prev, isActive: true }));
    // Here you would save to the backend
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Branding Status</h3>
              <p className="text-sm text-muted-foreground">
                {branding.isActive
                  ? "Custom branding is active on your seller profile"
                  : "Using default branding"}
              </p>
            </div>
            <Badge
              className={
                branding.isActive
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-muted text-muted-foreground"
              }
            >
              {branding.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Color Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette size={20} />
            Brand Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Presets */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Quick Presets
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {presetColors.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    handleColorChange("primary", preset.primary);
                    handleColorChange("secondary", preset.secondary);
                  }}
                  className="flex items-center gap-2 p-3 rounded-lg border hover:border-primary transition-colors"
                >
                  <div className="flex gap-1">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <span className="text-xs">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary-color" className="text-sm font-medium">
                Primary Color
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => handleColorChange("primary", e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={branding.primaryColor}
                  onChange={(e) => handleColorChange("primary", e.target.value)}
                  placeholder="#3b82f6"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="secondary-color" className="text-sm font-medium">
                Secondary Color
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) =>
                    handleColorChange("secondary", e.target.value)
                  }
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={branding.secondaryColor}
                  onChange={(e) =>
                    handleColorChange("secondary", e.target.value)
                  }
                  placeholder="#f1f5f9"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon size={20} />
            Business Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {branding.logoUrl ? (
              <div className="w-16 h-16 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                <img
                  src={branding.logoUrl}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg border border-dashed border-muted-foreground/25 flex items-center justify-center">
                <ImageIcon size={24} className="text-muted-foreground" />
              </div>
            )}

            <div className="flex-1">
              <Label
                htmlFor="logo-upload"
                className="cursor-pointer inline-flex items-center gap-2"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    <Upload size={16} />
                    {isUploading ? "Uploading..." : "Upload Logo"}
                  </span>
                </Button>
              </Label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Square images work best. Max 2MB. PNG, JPG, or SVG.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Name */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="business-name" className="text-sm font-medium">
              Business Name
            </Label>
            <Input
              id="business-name"
              value={branding.businessName}
              onChange={(e) =>
                setBranding((prev) => ({
                  ...prev,
                  businessName: e.target.value,
                }))
              }
              placeholder="Enter your business name"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This name will appear on your seller profile and listings
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye size={20} />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="p-4 rounded-lg border-2"
            style={{
              backgroundColor: branding.secondaryColor,
              borderColor: branding.primaryColor + "40",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt="Logo"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {branding.businessName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="font-semibold">{branding.businessName}</h4>
                <p className="text-sm text-muted-foreground">Seller Profile</p>
              </div>
            </div>
            <Button
              size="sm"
              style={{
                backgroundColor: branding.primaryColor,
                borderColor: branding.primaryColor,
              }}
              className="text-white hover:opacity-90"
            >
              View Products
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={saveBranding} className="flex-1">
          <CheckCircle size={16} className="mr-2" />
          Save & Apply Branding
        </Button>
        <Button variant="outline" onClick={resetToDefaults}>
          <RotateCcw size={16} className="mr-2" />
          Reset
        </Button>
      </div>

      {/* Guidelines */}
      <Card className="border-dashed border-2">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Branding Guidelines</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Colors should have good contrast for accessibility</p>
            <p>• Logo should be recognizable at small sizes</p>
            <p>• Business name should be professional and memorable</p>
            <p>• Changes take effect immediately on your seller profile</p>
            <p>• Branding applies to all your listings and communications</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
