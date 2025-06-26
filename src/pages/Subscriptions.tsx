import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Pause,
  Play,
  X,
  Plus,
} from "lucide-react";
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
import { mockSubscriptions } from "@/data/mockData";
import { Subscription } from "@/types";
import { format } from "date-fns";

export default function Subscriptions() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(mockSubscriptions);

  const cancelSubscription = (id: string) => {
    setSubscriptions(
      subscriptions.map((sub) =>
        sub.id === id ? { ...sub, status: "canceled" } : sub,
      ),
    );
  };

  const pauseSubscription = (id: string) => {
    setSubscriptions(
      subscriptions.map((sub) =>
        sub.id === id ? { ...sub, status: "past_due" } : sub,
      ),
    );
  };

  const resumeSubscription = (id: string) => {
    setSubscriptions(
      subscriptions.map((sub) =>
        sub.id === id ? { ...sub, status: "active" } : sub,
      ),
    );
  };

  const getStatusBadge = (status: Subscription["status"]) => {
    const variants: Record<Subscription["status"], string> = {
      active: "bg-success/10 text-success border-success/20",
      canceled: "bg-muted text-muted-foreground border-border",
      past_due: "bg-warning/10 text-warning border-warning/20",
      trialing: "bg-primary/10 text-primary border-primary/20",
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {status === "active" && "Active"}
        {status === "canceled" && "Canceled"}
        {status === "past_due" && "Paused"}
        {status === "trialing" && "Trial"}
      </Badge>
    );
  };

  const totalMonthlySpend = subscriptions
    .filter((sub) => sub.status === "active")
    .reduce((sum, sub) => {
      const monthlyAmount =
        sub.interval === "year" ? sub.price / 12 : sub.price;
      return sum + monthlyAmount;
    }, 0);

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
        <h1 className="text-xl font-semibold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Manage your active subscriptions
        </p>
      </div>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={false}>
      <div className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Monthly Spending
              </p>
              <p className="text-3xl font-bold text-primary">
                ${totalMonthlySpend.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {subscriptions.filter((s) => s.status === "active").length}{" "}
                active subscriptions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Add New Subscription */}
        <Card className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Browse Subscriptions</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Discover new services and subscription plans
            </p>
            <Button onClick={() => navigate("/")}>Browse Plans</Button>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No subscriptions yet</h3>
              <p className="text-sm text-muted-foreground text-center">
                Start a subscription to access premium content and services
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {subscription.name}
                    </CardTitle>
                    {getStatusBadge(subscription.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscription.description}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Pricing */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Price
                      </span>
                      <span className="font-semibold">
                        ${subscription.price.toFixed(2)}/{subscription.interval}
                      </span>
                    </div>

                    {/* Current Period */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Current Period
                      </span>
                      <span className="text-sm">
                        {format(subscription.currentPeriodStart, "MMM dd")} -{" "}
                        {format(subscription.currentPeriodEnd, "MMM dd, yyyy")}
                      </span>
                    </div>

                    {/* Next Billing */}
                    {subscription.status === "active" &&
                      subscription.nextBillingDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Next Billing
                          </span>
                          <span className="text-sm">
                            {format(
                              subscription.nextBillingDate,
                              "MMM dd, yyyy",
                            )}
                          </span>
                        </div>
                      )}

                    {/* Payment Method */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Payment Method
                      </span>
                      <div className="flex items-center space-x-2">
                        <CreditCard size={14} />
                        <span className="text-sm">
                          {subscription.paymentMethod.brand?.toUpperCase()} ••••
                          {subscription.paymentMethod.last4}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {subscription.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pauseSubscription(subscription.id)}
                            className="flex items-center space-x-1"
                          >
                            <Pause size={14} />
                            <span>Pause</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center space-x-1 text-destructive hover:text-destructive"
                              >
                                <X size={14} />
                                <span>Cancel</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Cancel Subscription
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel your{" "}
                                  {subscription.name} subscription? You'll lose
                                  access at the end of your current billing
                                  period.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  Keep Subscription
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    cancelSubscription(subscription.id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Cancel Subscription
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}

                      {subscription.status === "past_due" && (
                        <Button
                          size="sm"
                          onClick={() => resumeSubscription(subscription.id)}
                          className="flex items-center space-x-1"
                        >
                          <Play size={14} />
                          <span>Resume</span>
                        </Button>
                      )}

                      {subscription.status === "canceled" && (
                        <Button
                          size="sm"
                          onClick={() => resumeSubscription(subscription.id)}
                          className="flex items-center space-x-1"
                        >
                          <Play size={14} />
                          <span>Reactivate</span>
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/payment-methods")}
                      >
                        Update Payment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
