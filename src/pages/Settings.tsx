import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Bell,
  Shield,
  Palette,
  Globe,
  Eye,
  Smartphone,
  HelpCircle,
  ExternalLink,
  Trash2,
  Crown,
  Store,
} from "lucide-react";
import { useAppMode } from "@/contexts/AppModeContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { mockAppSettings } from "@/data/mockData";
import { AppSettings } from "@/types";

export default function Settings() {
  const navigate = useNavigate();
  const { user, canAccessSellerMode, setMode } = useAppMode();
  const [settings, setSettings] = useState<AppSettings>(mockAppSettings);

  const updateSetting = (
    category: keyof AppSettings,
    key: string,
    value: any,
  ) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    });
  };

  const resetAllSettings = () => {
    setSettings(mockAppSettings);
  };

  const headerContent = (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/profile")}
        className="p-2"
      >
        <ArrowLeft size={20} />
      </Button>
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Customize your app experience
        </p>
      </div>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={true}>
      <div className="space-y-6">
        {/* Seller Mode - Only show if signed in */}
        {user && (
          <Card className={canAccessSellerMode ? "border-primary/20" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {canAccessSellerMode ? (
                  <Crown size={18} className="text-primary" />
                ) : (
                  <Store size={18} />
                )}
                <span>Seller Mode</span>
                {canAccessSellerMode && <Badge className="ml-2">Active</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canAccessSellerMode ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    You have access to seller tools. Switch to seller mode to
                    manage your products and view payment analytics.
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setMode("seller");
                        navigate("/seller");
                      }}
                      className="flex-1"
                    >
                      <Crown size={16} className="mr-2" />
                      Switch to Seller Mode
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/subscriptions")}
                    >
                      Manage
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Unlock powerful seller tools to create products, manage
                    payments, and grow your business.
                  </p>
                  <Button
                    onClick={() => navigate("/seller-subscription")}
                    className="w-full"
                  >
                    <Crown size={16} className="mr-2" />
                    Upgrade to Seller
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell size={18} />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about order updates and new features
                </p>
              </div>
              <Switch
                checked={settings.notifications.push}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "push", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive order confirmations and receipts via email
                </p>
              </div>
              <Switch
                checked={settings.notifications.email}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "email", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get text messages for important order updates
                </p>
              </div>
              <Switch
                checked={settings.notifications.sms}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "sms", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing Communications</p>
                <p className="text-sm text-muted-foreground">
                  Receive promotional offers and product updates
                </p>
              </div>
              <Switch
                checked={settings.notifications.marketing}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "marketing", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield size={18} />
              <span>Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Biometric Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Use fingerprint or face unlock for quick access
                </p>
              </div>
              <Switch
                checked={settings.security.biometric}
                onCheckedChange={(checked) =>
                  updateSetting("security", "biometric", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.security.twoFactor}
                  onCheckedChange={(checked) =>
                    updateSetting("security", "twoFactor", checked)
                  }
                />
                {settings.security.twoFactor && (
                  <Badge variant="secondary" className="text-xs">
                    Enabled
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/profile")}
            >
              Manage Account Security
            </Button>
          </CardContent>
        </Card>

        {/* Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette size={18} />
              <span>Display</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Switch to a darker theme for better viewing at night
                </p>
              </div>
              <Switch
                checked={settings.display.darkMode}
                onCheckedChange={(checked) =>
                  updateSetting("display", "darkMode", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Currency</p>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred currency for pricing
                </p>
              </div>
              <Select
                value={settings.display.currency}
                onValueChange={(value) =>
                  updateSetting("display", "currency", value)
                }
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Language</p>
                <p className="text-sm text-muted-foreground">
                  Set your preferred language for the app
                </p>
              </div>
              <Select
                value={settings.display.language}
                onValueChange={(value) =>
                  updateSetting("display", "language", value)
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">EN</SelectItem>
                  <SelectItem value="Spanish">ES</SelectItem>
                  <SelectItem value="French">FR</SelectItem>
                  <SelectItem value="German">DE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye size={18} />
              <span>Privacy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Analytics</p>
                <p className="text-sm text-muted-foreground">
                  Help us improve the app by sharing usage data
                </p>
              </div>
              <Switch
                checked={settings.privacy.analytics}
                onCheckedChange={(checked) =>
                  updateSetting("privacy", "analytics", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Data Sharing</p>
                <p className="text-sm text-muted-foreground">
                  Share data with partners for personalized experiences
                </p>
              </div>
              <Switch
                checked={settings.privacy.dataSharing}
                onCheckedChange={(checked) =>
                  updateSetting("privacy", "dataSharing", checked)
                }
              />
            </div>
            <Button variant="outline" className="w-full">
              <ExternalLink size={14} className="mr-2" />
              View Privacy Policy
            </Button>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone size={18} />
              <span>App Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Version</span>
              <Badge variant="secondary">v1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Build</span>
              <span className="text-muted-foreground text-sm">2024.01.15</span>
            </div>
            <Separator />
            <Button variant="outline" className="w-full">
              <HelpCircle size={14} className="mr-2" />
              Help & Support
            </Button>
            <Button variant="outline" className="w-full">
              <ExternalLink size={14} className="mr-2" />
              Terms of Service
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full text-warning">
                  Reset All Settings
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset All Settings</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all your app settings to their default
                    values. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={resetAllSettings}
                    className="bg-warning text-warning-foreground hover:bg-warning/90"
                  >
                    Reset Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and all associated
                    data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
