import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  CreditCard,
  Building2,
  FileText,
  Shield,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  createConnectAccount,
  createAccountLink,
  getConnectAccount,
} from "@/lib/stripe";

interface ConnectAccount {
  id: string;
  type: "express" | "standard";
  business_type: "individual" | "company";
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
  capabilities: {
    card_payments: "active" | "inactive" | "pending";
    transfers: "active" | "inactive" | "pending";
  };
  created: number;
}

interface StripeConnectOnboardingProps {
  userId: string;
  onComplete: (accountId: string) => void;
  onError: (error: any) => void;
  existingAccountId?: string;
}

const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({
  userId,
  onComplete,
  onError,
  existingAccountId,
}) => {
  const [account, setAccount] = useState<ConnectAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (existingAccountId) {
      loadAccount(existingAccountId);
    } else {
      setIsLoading(false);
    }
  }, [existingAccountId]);

  const loadAccount = async (accountId: string) => {
    try {
      setIsLoading(true);
      const accountData = await getConnectAccount(accountId);
      setAccount(accountData);
    } catch (error) {
      console.error("Failed to load Connect account:", error);
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAccount = async (
    accountType: "express" | "standard" = "express",
    businessType: "individual" | "company" = "individual",
  ) => {
    try {
      setIsCreating(true);
      const accountData = await createConnectAccount(accountType, businessType);
      setAccount(accountData);
      await startOnboarding(accountData.id);
    } catch (error) {
      console.error("Failed to create Connect account:", error);
      onError(error);
    } finally {
      setIsCreating(false);
    }
  };

  const startOnboarding = async (accountId: string) => {
    try {
      const refreshUrl = `${window.location.origin}/seller/onboarding?refresh=true`;
      const returnUrl = `${window.location.origin}/seller/onboarding?success=true`;

      const linkData = await createAccountLink(
        accountId,
        refreshUrl,
        returnUrl,
      );
      setOnboardingUrl(linkData.url);
    } catch (error) {
      console.error("Failed to create onboarding link:", error);
      onError(error);
    }
  };

  const getAccountStatus = () => {
    if (!account) return "not_started";

    if (account.charges_enabled && account.payouts_enabled) {
      return "active";
    }

    if (account.details_submitted) {
      if (
        account.requirements.currently_due.length > 0 ||
        account.requirements.past_due.length > 0
      ) {
        return "restricted";
      }
      return "pending";
    }

    return "incomplete";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "restricted":
        return "bg-red-500";
      case "incomplete":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "pending":
        return "Under Review";
      case "restricted":
        return "Restricted";
      case "incomplete":
        return "Incomplete";
      default:
        return "Not Started";
    }
  };

  const calculateProgress = () => {
    if (!account) return 0;

    const status = getAccountStatus();
    switch (status) {
      case "active":
        return 100;
      case "pending":
        return 80;
      case "restricted":
        return 60;
      case "incomplete":
        return 40;
      default:
        return 0;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Connect Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading account information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = getAccountStatus();

  return (
    <div className="space-y-6">
      {/* Account Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Account Setup
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect your Stripe account to accept payments and manage
            transactions
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Badge and Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}
              />
              <span className="font-medium">{getStatusText(status)}</span>
              {account && (
                <Badge variant="outline" className="text-xs">
                  {account.type} account
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {calculateProgress()}% complete
            </div>
          </div>

          <Progress value={calculateProgress()} className="w-full" />

          {/* Account Information */}
          {account && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm font-medium">Account ID</div>
                <div className="text-xs font-mono text-muted-foreground">
                  {account.id}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Business Type</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {account.business_type}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Charges</div>
                <div className="text-xs">
                  {account.charges_enabled ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Enabled
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Disabled
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Payouts</div>
                <div className="text-xs">
                  {account.payouts_enabled ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Enabled
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Disabled
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onboarding Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Step 1: Create Account */}
            <div
              className={`connect-onboarding-step ${
                account
                  ? "connect-onboarding-step--completed"
                  : "connect-onboarding-step--current"
              }`}
            >
              <div
                className={`connect-onboarding-icon ${
                  account
                    ? "connect-onboarding-icon--completed"
                    : "connect-onboarding-icon--current"
                }`}
              >
                {account ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Create Stripe Account</h3>
                <p className="text-sm text-muted-foreground">
                  Set up your Stripe Connect account for payment processing
                </p>
                {!account && (
                  <div className="mt-3 space-x-2">
                    <Button
                      onClick={() => createAccount("express", "individual")}
                      disabled={isCreating}
                      size="sm"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Individual Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => createAccount("express", "company")}
                      disabled={isCreating}
                      size="sm"
                    >
                      Business Account
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Complete Onboarding */}
            <div
              className={`connect-onboarding-step ${
                account && account.details_submitted
                  ? "connect-onboarding-step--completed"
                  : account
                    ? "connect-onboarding-step--current"
                    : "connect-onboarding-step--pending"
              }`}
            >
              <div
                className={`connect-onboarding-icon ${
                  account && account.details_submitted
                    ? "connect-onboarding-icon--completed"
                    : account
                      ? "connect-onboarding-icon--current"
                      : "connect-onboarding-icon--pending"
                }`}
              >
                {account && account.details_submitted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Complete Information</h3>
                <p className="text-sm text-muted-foreground">
                  Provide required business and banking information
                </p>
                {account && !account.details_submitted && onboardingUrl && (
                  <div className="mt-3">
                    <Button asChild size="sm">
                      <a
                        href={onboardingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Continue Setup
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Verification */}
            <div
              className={`connect-onboarding-step ${
                status === "active"
                  ? "connect-onboarding-step--completed"
                  : account && account.details_submitted
                    ? "connect-onboarding-step--current"
                    : "connect-onboarding-step--pending"
              }`}
            >
              <div
                className={`connect-onboarding-icon ${
                  status === "active"
                    ? "connect-onboarding-icon--completed"
                    : account && account.details_submitted
                      ? "connect-onboarding-icon--current"
                      : "connect-onboarding-icon--pending"
                }`}
              >
                {status === "active" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Account Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Stripe reviews and activates your account for payments
                </p>
                {status === "pending" && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      Under Review (1-2 business days)
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements and Issues */}
      {account && account.requirements && (
        <Card>
          <CardHeader>
            <CardTitle>Account Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Currently Due */}
              {account.requirements.currently_due.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Action Required:</strong> The following information
                    is required to activate your account:
                    <ul className="mt-2 list-disc list-inside text-sm">
                      {account.requirements.currently_due.map((req) => (
                        <li key={req} className="capitalize">
                          {req.replace(/_/g, " ")}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Eventually Due */}
              {account.requirements.eventually_due.length > 0 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Eventually Required:</strong> The following
                    information will be required in the future:
                    <ul className="mt-2 list-disc list-inside text-sm">
                      {account.requirements.eventually_due.map((req) => (
                        <li key={req} className="capitalize">
                          {req.replace(/_/g, " ")}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* No Issues */}
              {account.requirements.currently_due.length === 0 &&
                account.requirements.past_due.length === 0 && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      All required information has been provided. Your account
                      is in good standing.
                    </AlertDescription>
                  </Alert>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {status === "active" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  Account Setup Complete!
                </h3>
                <p className="text-sm text-green-700">
                  Your Stripe account is active and ready to accept payments.
                </p>
              </div>
            </div>
            <Button
              onClick={() => onComplete(account!.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              Continue to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StripeConnectOnboarding;
