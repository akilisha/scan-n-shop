import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Share2,
  Copy,
  Users,
  DollarSign,
  Gift,
  TrendingUp,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { generateReferralCode, getReferralStats } from "@/lib/stripe";

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalCredits: number;
  availableCredits: number;
  usedCredits: number;
  referralCode: string;
  recentReferrals: ReferralRecord[];
}

interface ReferralRecord {
  id: string;
  referredEmail: string;
  status: "pending" | "completed" | "failed";
  creditAwarded: number;
  createdAt: string;
  completedAt?: string;
}

interface ReferralDashboardProps {
  userId: string;
  userEmail: string;
  isSellerMode?: boolean;
}

const ReferralDashboard: React.FC<ReferralDashboardProps> = ({
  userId,
  userEmail,
  isSellerMode = false,
}) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReferralStats();
  }, [userId]);

  const loadReferralStats = async () => {
    try {
      setIsLoading(true);
      const response = await getReferralStats(userId);
      setStats(response);
    } catch (error) {
      console.error("Failed to load referral stats:", error);
      toast({
        title: "Error",
        description: "Failed to load referral information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      setIsGenerating(true);
      const response = await generateReferralCode(userId);
      setStats((prev) => ({
        ...prev!,
        referralCode: response.code,
      }));
      toast({
        title: "Success",
        description: "New referral code generated!",
      });
    } catch (error) {
      console.error("Failed to generate referral code:", error);
      toast({
        title: "Error",
        description: "Failed to generate referral code.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Referral information copied to clipboard.",
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast({
        title: "Copied!",
        description: "Referral information copied to clipboard.",
      });
    }
  };

  const shareReferral = () => {
    if (navigator.share && stats) {
      navigator.share({
        title: "Join KerbDrop",
        text: `Use my referral code ${stats.referralCode} when signing up for KerbDrop and we both get a month free!`,
        url: `${window.location.origin}/signup?ref=${stats.referralCode}`,
      });
    } else {
      copyToClipboard(
        `Use my referral code ${stats?.referralCode} when signing up for KerbDrop and we both get a month free! ${window.location.origin}/signup?ref=${stats?.referralCode}`,
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-muted rounded-lg animate-pulse" />
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Unable to load referral information. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const referralUrl = `${window.location.origin}/signup?ref=${stats.referralCode}`;

  return (
    <div className="space-y-6">
      {/* Main Referral Card */}
      <Card className="referral-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Referral Program
            {isSellerMode && (
              <Badge variant="outline" className="text-xs">
                Seller Benefits
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isSellerMode
              ? "Refer new sellers and get one month of seller fees waived for each successful referral!"
              : "Refer friends and get rewards when they sign up!"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Code Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Your Referral Code</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateCode}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate New"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={stats.referralCode}
                readOnly
                className="referral-code"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(stats.referralCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Referral URL Section */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Referral Link
            </label>
            <div className="flex gap-2">
              <Input value={referralUrl} readOnly className="text-xs" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(referralUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={shareReferral}
                className="hidden sm:flex"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <Button onClick={shareReferral} className="flex-1">
              <Share2 className="mr-2 h-4 w-4" />
              Share Referral
            </Button>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(referralUrl)}
              className="flex-1"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="referral-stats-grid">
        <Card className="referral-stat-card">
          <div className="referral-stat-value">{stats.totalReferrals}</div>
          <div className="referral-stat-label">Total Referrals</div>
        </Card>
        <Card className="referral-stat-card">
          <div className="referral-stat-value">{stats.successfulReferrals}</div>
          <div className="referral-stat-label">Successful</div>
        </Card>
        <Card className="referral-stat-card">
          <div className="referral-stat-value">{stats.availableCredits}</div>
          <div className="referral-stat-label">
            {isSellerMode ? "Free Months" : "Credits"}
          </div>
        </Card>
      </div>

      {/* Credits Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {isSellerMode ? "Fee Waivers" : "Credits"} Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Total Earned:
              </span>
              <span className="font-medium">
                {isSellerMode
                  ? `${stats.totalCredits} months`
                  : `$${stats.totalCredits.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Available:</span>
              <span className="font-medium text-green-600">
                {isSellerMode
                  ? `${stats.availableCredits} months`
                  : `$${stats.availableCredits.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Used:</span>
              <span className="font-medium">
                {isSellerMode
                  ? `${stats.usedCredits} months`
                  : `$${stats.usedCredits.toFixed(2)}`}
              </span>
            </div>
            <Separator />
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                {isSellerMode
                  ? "Each successful referral earns you one month of seller fees waived!"
                  : "Earn credits for each friend who signs up using your referral code!"}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      {stats.recentReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentReferrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        referral.status === "completed"
                          ? "bg-green-500"
                          : referral.status === "pending"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium">
                        {referral.referredEmail}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        referral.status === "completed"
                          ? "default"
                          : referral.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {referral.status}
                    </Badge>
                    {referral.status === "completed" && (
                      <div className="text-xs text-green-600 mt-1">
                        +
                        {isSellerMode
                          ? "1 month"
                          : `$${referral.creditAwarded}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <strong>Share your code:</strong> Send your referral code or
                link to friends and colleagues.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <strong>They sign up:</strong> Your referral creates an account
                using your code.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <strong>You both benefit:</strong>
                {isSellerMode
                  ? " You get one month of seller fees waived, they get their first month free!"
                  : " You both receive credits or benefits when they complete their first action!"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralDashboard;
