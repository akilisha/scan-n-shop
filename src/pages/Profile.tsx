import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
import {
  ArrowLeft,
  Camera,
  Mail,
  Phone,
  Shield,
  Bell,
  Globe,
  Edit,
  LogOut,
  User,
} from "lucide-react";
import { useAppMode } from "@/contexts/AppModeContext";
import { User as UserType } from "@/types";
import { mockUser } from "@/data/mockData";

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, setMode } = useAppMode();
  const [showAuth, setShowAuth] = useState(false);
  const [localUser, setLocalUser] = useState<UserType>(user || mockUser);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: localUser.name || "",
    email: localUser.email || "",
    phone: localUser.phone || "",
  });

  // Sync localUser with context user changes
  useEffect(() => {
    if (user) {
      setLocalUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleSave = () => {
    const updatedUser = {
      ...localUser,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    };
    setLocalUser(updatedUser);
    setUser(updatedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: localUser.name,
      email: localUser.email,
      phone: localUser.phone || "",
    });
    setIsEditing(false);
  };

  const updatePreference = (
    category: keyof UserType["preferences"],
    key: string,
    value: any,
  ) => {
    const updatedUser = {
      ...localUser,
      preferences: {
        ...localUser.preferences,
        [category]: {
          ...localUser.preferences?.[category],
          [key]: value,
        },
      },
    };
    setLocalUser(updatedUser);
    setUser(updatedUser);
  };

  const handleSignOut = () => {
    setUser(null);
    setMode("buyer");
    navigate("/");
  };

  const headerContent = (
    <div>
      <h1 className="text-xl font-semibold">Profile</h1>
      <p className="text-sm text-muted-foreground">
        Manage your account settings
      </p>
    </div>
  );

  // Show sign-in prompt if not logged in
  if (!user) {
    return (
      <>
        <Layout headerContent={headerContent} showBottomNav={true}>
          <div className="space-y-6">
            {/* Sign In Prompt */}
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
                <p className="text-muted-foreground text-center mb-8">
                  Please sign in to access your profile and manage your account
                  settings.
                </p>
                <div className="w-full space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setShowAuth(true)}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/")}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Layout>

        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
          mode="login"
        />
      </>
    );
  }

  return (
    <Layout headerContent={headerContent} showBottomNav={true}>
      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage
                    src={localUser.avatar}
                    alt={localUser.name || "User"}
                  />
                  <AvatarFallback className="text-xl">
                    {localUser.name
                      ? localUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0"
                >
                  <Camera size={14} />
                </Button>
              </div>
              <h2 className="text-xl font-semibold mt-4">
                {localUser.name || "User"}
              </h2>
              <p className="text-muted-foreground">
                {localUser.email || "No email"}
              </p>
              <Badge variant="secondary" className="mt-2">
                <Shield size={12} className="mr-1" />
                Verified Account
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Personal Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-1"
              >
                <Edit size={14} />
                <span>{isEditing ? "Cancel" : "Edit"}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button onClick={handleSave} className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <Mail size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {localUser.email}
                    </p>
                  </div>
                </div>
                {localUser.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {localUser.phone}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Google Account */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-coral-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">G</span>
                </div>
                <div>
                  <p className="font-medium">Google Account</p>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
              </div>
              <Badge variant="secondary">
                <Shield size={12} className="mr-1" />
                Verified
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
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
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive order updates via email
                </p>
              </div>
              <Switch
                checked={localUser.preferences?.notifications?.email || false}
                onCheckedChange={(checked) =>
                  updatePreference("notifications", "email", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get instant notifications on your device
                </p>
              </div>
              <Switch
                checked={localUser.preferences?.notifications?.push || false}
                onCheckedChange={(checked) =>
                  updatePreference("notifications", "push", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive text messages for important updates
                </p>
              </div>
              <Switch
                checked={localUser.preferences?.notifications?.sms || false}
                onCheckedChange={(checked) =>
                  updatePreference("notifications", "sms", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe size={18} />
              <span>Language & Region</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Language</span>
              <span className="text-muted-foreground">
                {localUser.preferences?.language || "English"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Currency</span>
              <span className="text-muted-foreground">
                {localUser.preferences?.currency || "USD"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/payment-methods")}
              >
                Manage Payment Methods
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/subscriptions")}
              >
                Manage Subscriptions
              </Button>
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-destructive hover:text-destructive"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign Out</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to sign out of your account?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSignOut}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
