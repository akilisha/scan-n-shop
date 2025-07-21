import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, TrendingUp, Eye, MapPin, Calendar } from "lucide-react";

interface BoostHistory {
  id: string;
  productName: string;
  type: "product" | "event";
  boostedAt: Date;
  duration: number; // hours
  views: number;
  cost: number;
  status: "active" | "completed" | "expired";
}

const mockBoostHistory: BoostHistory[] = [];
  {
    id: "1",
    productName: "Vintage Bicycle",
    type: "product",
    boostedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    duration: 24,
    views: 47,
    cost: 4.99,
    status: "active",
  },
  {
    id: "2",
    productName: "Community Garage Sale",
    type: "event",
    boostedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    duration: 48,
    views: 156,
    cost: 4.99,
    status: "completed",
  },
];

export function PremiumListingsService() {
  const [boostHistory] = useState<BoostHistory[]>(mockBoostHistory);

  const activeBoosts = boostHistory.filter(
    (boost) => boost.status === "active",
  );
  const totalViews = boostHistory.reduce((sum, boost) => sum + boost.views, 0);
  const totalSpent = boostHistory.reduce((sum, boost) => sum + boost.cost, 0);

  const getStatusBadge = (status: BoostHistory["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="border-primary text-primary">
            Completed
          </Badge>
        );
      case "expired":
        return (
          <Badge
            variant="outline"
            className="border-muted text-muted-foreground"
          >
            Expired
          </Badge>
        );
    }
  };

  const getTimeRemaining = (boostedAt: Date, duration: number) => {
    const endTime = new Date(boostedAt.getTime() + duration * 60 * 60 * 1000);
    const now = new Date();
    const remaining = endTime.getTime() - now.getTime();

    if (remaining <= 0) return "Expired";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{activeBoosts.length}</p>
            <p className="text-xs text-muted-foreground">Active Boosts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalViews}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-coral-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Spent</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Boost Your Listings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button className="h-auto p-4 flex flex-col gap-2">
              <MapPin size={20} />
              <span className="text-sm">Boost Product</span>
              <span className="text-xs text-muted-foreground">$4.99/24h</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col gap-2"
            >
              <Calendar size={20} />
              <span className="text-sm">Boost Event</span>
              <span className="text-xs text-muted-foreground">$4.99/48h</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Premium listings get 3x more visibility and appear at the top of
            search results
          </p>
        </CardContent>
      </Card>

      {/* Boost History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Boosts</CardTitle>
        </CardHeader>
        <CardContent>
          {boostHistory.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No boost history yet. Start boosting your listings to increase
                visibility!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {boostHistory.map((boost) => (
                <div key={boost.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{boost.productName}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {boost.type} • {boost.duration}h duration
                      </p>
                    </div>
                    {getStatusBadge(boost.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="font-medium">{boost.views}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cost</p>
                      <p className="font-medium">${boost.cost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium text-xs">
                        {boost.status === "active"
                          ? getTimeRemaining(boost.boostedAt, boost.duration)
                          : boost.status === "completed"
                            ? "Finished"
                            : "Expired"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Boost Guidelines */}
      <Card className="border-dashed border-2">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Premium Listing Guidelines</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Boosted listings appear with a star badge and golden highlight
            </p>
            <p>• Products get 24-hour boosts, events get 48-hour boosts</p>
            <p>• Fair rotation ensures all premium listings get visibility</p>
            <p>• Analytics show real-time performance during boost period</p>
            <p>• One active boost per item to maintain fairness</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}