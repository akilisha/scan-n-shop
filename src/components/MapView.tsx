import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Navigation,
  Filter,
  Search,
  Calendar,
  Clock,
  Star,
  Route,
  Target,
  Layers,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { nativeService } from "@/lib/native";
import { cn } from "@/lib/utils";

export interface MapItem {
  id: string;
  type: "product" | "event";
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  sellerName?: string;
  distance?: number;
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  tags?: string[];
  status?: string;
}

interface MapViewProps {
  items: MapItem[];
  center?: { latitude: number; longitude: number };
  onItemClick?: (item: MapItem) => void;
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  showSearch?: boolean;
  showFilters?: boolean;
  className?: string;
}

export function MapView({
  items,
  center,
  onItemClick,
  onLocationChange,
  showSearch = true,
  showFilters = true,
  className,
}: MapViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(center || null);
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Get user's current location
  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await nativeService.getCurrentLocation();
      if (location) {
        setUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        onLocationChange?.(location);
        await nativeService.hapticImpact("light");
      }
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Filter items based on search and filters
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "products" && item.type === "product") ||
      (selectedFilter === "events" && item.type === "event") ||
      (selectedFilter === "today" &&
        item.startDate &&
        isToday(item.startDate)) ||
      (selectedFilter === "this-week" &&
        item.startDate &&
        isThisWeek(item.startDate)) ||
      item.category === selectedFilter ||
      item.eventType === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  // Calculate distance for each item
  const itemsWithDistance = filteredItems.map((item) => {
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        item.latitude,
        item.longitude,
      );
      return { ...item, distance };
    }
    return item;
  });

  // Sort by distance
  const sortedItems = itemsWithDistance.sort((a, b) => {
    if (a.distance && b.distance) {
      return a.distance - b.distance;
    }
    return 0;
  });

  // Handle item click
  const handleItemClick = (item: MapItem) => {
    setSelectedItem(item);
    onItemClick?.(item);
    nativeService.hapticImpact("light");
  };

  // Navigate to item location
  const navigateToItem = async (item: MapItem) => {
    await nativeService.hapticSuccess();

    // Create the navigation URL with item details
    const query = encodeURIComponent(
      `${item.title} - ${item.latitude},${item.longitude}`,
    );

    // Try different map apps in order of preference
    const mapUrls = [
      // Google Maps (most universal)
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      // Apple Maps (for iOS devices)
      `maps://maps.google.com/maps?q=${item.latitude},${item.longitude}`,
      // Generic coordinates fallback
      `https://maps.google.com/?q=${item.latitude},${item.longitude}`,
    ];

    try {
      // Try to open in new tab/window (works on web)
      const mapWindow = window.open(mapUrls[0], "_blank");

      if (!mapWindow) {
        // If popup blocked, try direct navigation
        window.location.href = mapUrls[0];
      }

      // Show success feedback
      await nativeService.sendLocalNotification(
        "Navigation Started",
        `Opening directions to ${item.title}`,
      );
    } catch (error) {
      console.error("Error opening maps:", error);

      // Fallback: copy coordinates to clipboard
      try {
        await navigator.clipboard.writeText(
          `${item.latitude}, ${item.longitude}`,
        );
        alert(
          `Coordinates copied to clipboard: ${item.latitude}, ${item.longitude}\nYou can paste these into any maps app.`,
        );
      } catch (clipboardError) {
        // Final fallback: show coordinates in alert
        alert(
          `Navigate to: ${item.title}\nCoordinates: ${item.latitude}, ${item.longitude}\n\nCopy these coordinates into your preferred maps app.`,
        );
      }

      await nativeService.hapticError();
    }
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Search Bar */}
              {showSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items, events, or categories..."
                    className="pl-10"
                  />
                </div>
              )}

              {/* Filter and View Controls */}
              <div className="flex items-center justify-between">
                {showFilters && (
                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Type</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setSelectedFilter("all")}
                        >
                          All Items
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSelectedFilter("products")}
                        >
                          Products Only
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSelectedFilter("events")}
                        >
                          Events Only
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Time</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setSelectedFilter("today")}
                        >
                          Today
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSelectedFilter("this-week")}
                        >
                          This Week
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Categories</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setSelectedFilter("electronics")}
                        >
                          Electronics
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSelectedFilter("furniture")}
                        >
                          Furniture
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSelectedFilter("garage_sale")}
                        >
                          Garage Sales
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                      disabled={isLoadingLocation}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      My Location
                    </Button>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === "map" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Map
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    List
                  </Button>
                </div>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {sortedItems.length} items found
                  {userLocation && " near you"}
                </span>
                {selectedFilter !== "all" && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSelectedFilter("all")}
                    className="h-auto p-0"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map View */}
      {viewMode === "map" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Local Items & Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Map Container */}
            <div
              ref={mapRef}
              className="w-full h-96 bg-muted rounded-lg border relative overflow-hidden"
            >
              {/* Realistic Map Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-green-50 to-blue-50">
                {/* Street Grid Pattern */}
                <div className="absolute inset-0">
                  {/* Horizontal Streets */}
                  {[20, 35, 50, 65, 80].map((top) => (
                    <div
                      key={`h-${top}`}
                      className="absolute w-full h-1 bg-gray-300"
                      style={{ top: `${top}%` }}
                    />
                  ))}
                  {/* Vertical Streets */}
                  {[15, 30, 45, 60, 75, 90].map((left) => (
                    <div
                      key={`v-${left}`}
                      className="absolute h-full w-1 bg-gray-300"
                      style={{ left: `${left}%` }}
                    />
                  ))}
                  {/* Parks/Green Areas */}
                  <div className="absolute w-16 h-12 bg-green-200 rounded-lg top-4 left-4 opacity-60" />
                  <div className="absolute w-20 h-16 bg-green-200 rounded-lg bottom-8 right-6 opacity-60" />
                  {/* Buildings */}
                  <div className="absolute w-8 h-6 bg-gray-400 top-8 left-20 opacity-40" />
                  <div className="absolute w-6 h-8 bg-gray-400 top-12 right-20 opacity-40" />
                  <div className="absolute w-10 h-6 bg-gray-400 bottom-20 left-12 opacity-40" />
                </div>
              </div>

              {/* Map Items as Pins */}
              <div className="absolute inset-0 p-4">
                {sortedItems.slice(0, 20).map((item, index) => (
                  <div
                    key={item.id}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-full"
                    style={{
                      left: `${20 + (index % 5) * 15}%`,
                      top: `${30 + Math.floor(index / 5) * 20}%`,
                    }}
                    onClick={() => handleItemClick(item)}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold",
                        item.type === "event" ? "bg-primary" : "bg-orange-500",
                        selectedItem?.id === item.id && "ring-2 ring-primary",
                      )}
                    >
                      {item.type === "event" ? (
                        <Calendar className="h-4 w-4" />
                      ) : (
                        "$"
                      )}
                    </div>
                    <div className="w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-white mx-auto" />
                  </div>
                ))}

                {/* User Location Pin */}
                {userLocation && (
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: "50%", top: "50%" }}
                  >
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                  </div>
                )}
              </div>

              {/* Map Controls */}
              <div className="absolute top-4 right-4 space-y-2">
                <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
                  +
                </Button>
                <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
                  -
                </Button>
              </div>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-2 space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span>Products</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                  <span>Events</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>You</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {sortedItems.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedItem?.id === item.id && "ring-2 ring-primary",
              )}
              onClick={() => handleItemClick(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Item Image */}
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : item.type === "event" ? (
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <MapPin className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        {item.price && (
                          <p className="font-bold text-primary">
                            ${item.price.toFixed(2)}
                          </p>
                        )}
                        {item.distance && (
                          <p className="text-xs text-muted-foreground">
                            {item.distance.toFixed(1)} km away
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tags and Actions */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            item.type === "event" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {item.type === "event"
                            ? item.eventType || "Event"
                            : item.category || "Product"}
                        </Badge>
                        {item.startDate && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(item.startDate)}
                          </Badge>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToItem(item);
                        }}
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Directions
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {sortedItems.length === 0 && (
            <Alert>
              <AlertDescription>
                No items found matching your search criteria. Try expanding your
                search radius or clearing filters.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isThisWeek(date: Date): boolean {
  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  return date >= weekStart && date <= weekEnd;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
