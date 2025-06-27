import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
  mode?: "login" | "signup";
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  mode: initialMode = "login",
}: AuthModalProps) {
  const {
    signIn,
    signUp,
    signInWithGoogle,
    loading: authLoading,
  } = useSupabaseAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  // Clean up states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset states when modal opens
      setLoading(false);
      setError(null);
      setFormData({ email: "", password: "", name: "" });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;

      if (mode === "signup") {
        if (!formData.name.trim()) {
          setError("Full name is required");
          setLoading(false);
          return;
        }
        result = await signUp(formData.email, formData.password, formData.name);

        if (!result.error) {
          // Signup successful - close modal and let auth state handle the rest
          onClose();
          if (onSuccess) {
            onSuccess(null);
          }
          return;
        }
      } else {
        result = await signIn(formData.email, formData.password);
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        // Success for login - close modal
        onClose();
        if (onSuccess) {
          onSuccess(null); // User will be available through context
        }
      }
    } catch (err) {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        // Success - the redirect will happen automatically
        // The modal will close when the user returns and auth state changes
      }
    } catch (err) {
      setError("Google authentication failed. Please try again.");
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError(null);
    setLoading(false); // Reset loading state when switching modes
    setFormData({ email: "", password: "", name: "" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-200">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-2 top-2 p-2"
          >
            <X size={16} />
          </Button>
          <CardTitle className="text-center">
            {mode === "login" ? "Welcome back" : "Create account"}
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to your account"
              : "Sign up to get started"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert
              variant={
                error.includes("verification") ? "default" : "destructive"
              }
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="John Doe"
                    className="pl-10"
                    required
                    disabled={loading || authLoading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john@example.com"
                  className="pl-10"
                  required
                  disabled={loading || authLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  disabled={loading || authLoading}
                  minLength={6}
                />
              </div>
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || authLoading}
            >
              {loading || authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleAuth}
            disabled={loading || authLoading}
          >
            {loading || authLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <div className="w-4 h-4 mr-2 bg-gradient-to-r from-red-500 to-yellow-500 rounded-sm" />
            )}
            Continue with Google
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={switchMode}
              disabled={loading || authLoading}
              className="text-sm"
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </div>

          {mode === "signup" && (
            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Button variant="link" className="p-0 h-auto text-xs">
                Terms of Service
              </Button>{" "}
              and{" "}
              <Button variant="link" className="p-0 h-auto text-xs">
                Privacy Policy
              </Button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
