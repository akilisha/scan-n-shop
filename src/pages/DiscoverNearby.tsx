import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProximitySearch } from "@/components/ProximitySearch";
import { MapView, MapItem } from "@/components/MapView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Calendar,
  Star,
  Navigation,
  Clock,
  DollarSign,
  Info,
} from "lucide-react";
import { nativeService } from "@/lib/native";

import { ProductDetailModal } from "@/components/ProductDetailModal";

// Mock location-based data for demo (events + products)
const generateMockLocationData = (): MapItem[] => {
  const baseLocation = { lat: 40.7128, lng: -74.006 }; // NYC

  const events: MapItem[] = [
    {
      id: "event-1",
      type: "event",
      latitude: baseLocation.lat + 0.01,
      longitude: baseLocation.lng + 0.008,
      title: "Weekend Garage Sale - Moving Sale!",
      description: "Everything must go! Furniture, electronics, clothes, books",
      eventType: "garage_sale",
      startDate: new Date(Date.now() + 86400000), // Tomorrow
      endDate: new Date(Date.now() + 172800000), // Day after tomorrow
      tags: ["furniture", "electronics", "vintage"],
      sellerName: "Sarah Johnson",
      distance: 1.2,
    },
    {
      id: "event-2",
      type: "event",
      latitude: baseLocation.lat - 0.015,
      longitude: baseLocation.lng + 0.012,
      title: "Downtown Farmers Market",
      description: "Fresh produce, local crafts, artisan goods",
      eventType: "farmers_market",
      startDate: new Date(Date.now() + 259200000), // 3 days
      tags: ["fresh", "local", "organic"],
      sellerName: "Market Collective",
      distance: 2.1,
    },
    {
      id: "event-3",
      type: "event",
      latitude: baseLocation.lat + 0.008,
      longitude: baseLocation.lng - 0.018,
      title: "Estate Sale - Antique Treasures",
      description: "Rare antiques, vintage jewelry, collectibles",
      eventType: "estate_sale",
      startDate: new Date(Date.now() + 518400000), // 6 days
      tags: ["antiques", "vintage", "jewelry"],
      sellerName: "Heritage Estates",
      distance: 1.8,
    },
  ];

  // Real local products will be fetched from database
  const localProducts: MapItem[] = [];

  return [...events, ...localProducts];
};

type DiscoveryMode = "all" | "events" | "products";

export default function DiscoverNearby() {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<MapItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>("all");
  const [allItems, setAllItems] = useState<MapItem[]>([]);
  const [showProductDetail, setShowProductDetail] = useState(false);

  useEffect(() => {
    // Load initial nearby items
    const mockData = generateMockLocationData();
    setAllItems(mockData);
    setSearchResults(mockData);

    // Load saved locations from storage
    loadSavedLocations();
  }, []);

  // Filter items based on discovery mode
  useEffect(() => {
    let filteredItems = allItems;

    if (discoveryMode === "events") {
      filteredItems = allItems.filter((item) => item.type === "event");
    } else if (discoveryMode === "products") {
      filteredItems = allItems.filter((item) => item.type === "product");
    }

    setSearchResults(filteredItems);
  }, [discoveryMode, allItems]);

  const loadSavedLocations = async () => {
    try {
      const saved = await nativeService.getData("saved_locations");
      if (saved && Array.isArray(saved)) {
        setSavedLocations(saved);
      } else {
        // Default locations for demo - these would normally be empty
        const defaultLocations = [
          {
            latitude: 40.7128,
            longitude: -74.006,
            name: "Home",
            address: "New York, NY",
          },
          {
            latitude: 40.7589,
            longitude: -73.9851,
            name: "Work",
            address: "Times Square, NY",
          },
        ];
        setSavedLocations(defaultLocations);
        await nativeService.setData("saved_locations", defaultLocations);
      }
    } catch (error) {
      console.error("Error loading saved locations:", error);
      setSavedLocations([]);
    }
  };

  const handleSearch = async (location: any, filters: any) => {
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Start with all items or discovery mode filtered items
    let results = allItems;

    // Apply discovery mode filter
    if (discoveryMode === "events") {
      results = results.filter((item) => item.type === "event");
    } else if (discoveryMode === "products") {
      results = results.filter((item) => item.type === "product");
    }

    // Apply search query
    if (filters.query) {
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          item.description
            ?.toLowerCase()
            .includes(filters.query.toLowerCase()) ||
          item.tags?.some((tag) =>
            tag.toLowerCase().includes(filters.query.toLowerCase()),
          ),
      );
    }

    // Apply category filter
    if (filters.category !== "all") {
      results = results.filter(
        (item) =>
          item.category === filters.category ||
          item.eventType === filters.category,
      );
    }

    setSearchResults(results);
    setIsLoading(false);

    return results;
  };

  const handleItemClick = async (item: MapItem) => {
    setSelectedItem(item);
    await nativeService.hapticImpact("light");

    // Show product detail modal for products
    if (item.type === "product") {
      setShowProductDetail(true);
    }
  };

  const navigateToItem = async (item: MapItem) => {
    await nativeService.hapticSuccess();

    // Create the navigation URL with item details
    const query = encodeURIComponent(
      `${item.title} - ${item.latitude},${item.longitude}`,
    );
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    try {
      // Try to open in new tab/window
      const mapWindow = window.open(mapUrl, "_blank");

      if (!mapWindow) {
        // If popup blocked, try direct navigation
        window.location.href = mapUrl;
      }

      // Show success notification
      await nativeService.sendLocalNotification(
        "Navigation Started",
        `Opening directions to ${item.title}`,
      );
    } catch (error) {
      console.error("Error opening maps:", error);

      // Fallback: copy coordinates and show alert
      try {
        await navigator.clipboard.writeText(
          `${item.latitude}, ${item.longitude}`,
        );
        alert(
          `Coordinates copied: ${item.latitude}, ${item.longitude}\nPaste into your maps app to navigate to ${item.title}`,
        );
      } catch (clipboardError) {
        alert(
          `Navigate to: ${item.title}\nCoordinates: ${item.latitude}, ${item.longitude}`,
        );
      }

      await nativeService.hapticError();
    }
  };

  const headerContent = (
    <div>
      <h1 className="text-xl font-semibold">Discover Nearby</h1>
      <p className="text-sm text-muted-foreground">
        Find local garage sales, markets, and items
      </p>
    </div>
  );

  return (
    <Layout headerContent={headerContent} showBottomNav={true}>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-coral-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg mb-2">
                  🗺️ Local Discovery Hub
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Find events, products, and local businesses near you! Your
                  hyperlocal marketplace for everything nearby.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Events & Markets
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Local Products
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Navigation className="h-3 w-3 mr-1" />
                    GPS Navigation
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discovery Mode Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                What are you looking for?
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={discoveryMode === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDiscoveryMode("all")}
                  className="text-xs"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Everything
                </Button>
                <Button
                  variant={discoveryMode === "events" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDiscoveryMode("events")}
                  className="text-xs"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Events
                </Button>
                <Button
                  variant={discoveryMode === "products" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDiscoveryMode("products")}
                  className="text-xs"
                >
                  <Star className="h-3 w-3 mr-1" />
                  Products
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {discoveryMode === "all" &&
                  `Showing ${searchResults.length} events & products nearby`}
                {discoveryMode === "events" &&
                  `Showing ${searchResults.length} events nearby`}
                {discoveryMode === "products" &&
                  `Showing ${searchResults.length} products nearby`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Interface */}
        <ProximitySearch
          onSearch={handleSearch}
          onItemClick={handleItemClick}
          savedLocations={savedLocations}
          recentSearches={[
            "exercise equipment",
            "vintage furniture",
            "electronics",
          ]}
        />

        {/* Selected Item Details */}
        {selectedItem && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  Selected {selectedItem.type === "event" ? "Event" : "Item"}
                </span>
                <Badge
                  variant={
                    selectedItem.type === "event" ? "default" : "secondary"
                  }
                >
                  {selectedItem.type === "event"
                    ? selectedItem.eventType
                    : selectedItem.category}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedItem.title}</h3>
                <p className="text-muted-foreground">
                  {selectedItem.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedItem.price && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-semibold">
                      ${selectedItem.price.toFixed(2)}
                    </span>
                  </div>
                )}

                {selectedItem.distance && (
                  <div className="flex items-center space-x-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span>{selectedItem.distance.toFixed(1)} km away</span>
                  </div>
                )}

                {selectedItem.startDate && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{selectedItem.startDate.toLocaleDateString()}</span>
                  </div>
                )}

                {selectedItem.sellerName && (
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span>{selectedItem.sellerName}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => navigateToItem(selectedItem)}
                  className="flex-1"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Get Directions
                </Button>

                {selectedItem.type === "product" && (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/cart")}
                    className="flex-1"
                  >
                    View Details
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {searchResults.filter((item) => item.type === "event").length}
              </div>
              <div className="text-sm text-muted-foreground">Events Nearby</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {searchResults.filter((item) => item.type === "product").length}
              </div>
              <div className="text-sm text-muted-foreground">
                Items Available
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">5km</div>
              <div className="text-sm text-muted-foreground">Search Radius</div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Explanation */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>🎯 How it works:</strong> This discovers garage sales,
            farmers markets, and individual items near your location. Set your
            search radius, browse on the map, and get directions to sales and
            events happening around you!
          </AlertDescription>
        </Alert>

        {/* Product Detail Modal */}
        <ProductDetailModal
          product={selectedItem}
          isOpen={showProductDetail}
          onClose={() => setShowProductDetail(false)}
        />
      </div>
    </Layout>
  );
}
