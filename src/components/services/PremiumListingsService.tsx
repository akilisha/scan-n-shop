import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Clock, Eye, DollarSign } from "lucide-react";

interface BoostHistory {
  id: string;
  productName: string;
  type: "product" | "event";
  boostedAt: Date;
  duration: number;
  views: number;
  cost: number;
  status: "active" | "completed" | "expired";
}

const mockBoostHistory: BoostHistory[] = [];

export function PremiumListingsService() {
  const [boostHistory] = useState<BoostHistory[]>(mockBoostHistory);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [boostDuration, setBoostDuration] = useState("24");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBoost = async () => {
    if (!selectedProduct) return;
    
    setIsProcessing(true);
    try {
      // TODO: Implement real boost functionality
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("Boosting product:", selectedProduct, "for", boostDuration, "hours");
    } catch (error) {
      console.error("Boost failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getBoostCost = (duration: string) => {
    const costs = { "24": 4.99, "48": 8.99, "72": 12.99 };
    return costs[duration as keyof typeof costs] || 4.99;
  };

  return (
    <div className="space-y-6">
      {/* Boost Product */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Boost Product Visibility</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="product">Select Product to Boost</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a product or event..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" disabled>No products available</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="duration">Boost Duration</Label>
            <Select value={boostDuration} onValueChange={setBoostDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 hours - $4.99</SelectItem>
                <SelectItem value="48">48 hours - $8.99</SelectItem>
                <SelectItem value="72">72 hours - $12.99</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Cost:</span>
              <span className="text-xl font-bold text-blue-600">
                ${getBoostCost(boostDuration)}
              </span>
            </div>
          </div>

          <Button 
            onClick={handleBoost} 
            disabled={!selectedProduct || isProcessing}
            className="w-full"
          >
            {isProcessing ? "Processing..." : "Boost Now"}
          </Button>
        </CardContent>
      </Card>

      {/* Boost History */}
      <Card>
        <CardHeader>
          <CardTitle>Boost History</CardTitle>
        </CardHeader>
        <CardContent>
          {boostHistory.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No boosts yet</h3>
              <p className="text-sm text-muted-foreground">
                Start boosting your products to increase visibility and sales.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {boostHistory.map((boost) => (
                <div
                  key={boost.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{boost.productName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {boost.type === "product" ? "Product" : "Event"} • {boost.duration}h boost
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">{boost.views}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">${boost.cost}</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        boost.status === "active"
                          ? "default"
                          : boost.status === "completed"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {boost.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
