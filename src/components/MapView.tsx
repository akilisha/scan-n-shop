import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { Icon, LatLngExpression, DivIcon } from "leaflet";
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
  Locate,
  ZoomIn,
  ZoomOut,
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

// Custom marker icons
const createCustomIcon = (
  type: "product" | "event",
  isSelected: boolean = false,
) => {
  const iconHtml =
    type === "event"
      ? `<div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg ${isSelected ? "bg-blue-600 ring-2 ring-blue-400" : "bg-blue-500"} text-white">
         <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
           <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
         </svg>
       </div>`
      : `<div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg ${isSelected ? "bg-orange-600 ring-2 ring-orange-400" : "bg-orange-500"} text-white text-xs font-bold">
         $
       </div>`;

  return new DivIcon({
    html: iconHtml,
    className: "custom-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

const userLocationIcon = new DivIcon({
  html: `<div class="flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
  className: "user-location-marker",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Map event handlers
function MapEventHandler({
  onLocationChange,
  userLocation,
  setUserLocation,
}: {
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  userLocation: { latitude: number; longitude: number } | null;
  setUserLocation: (
    location: { latitude: number; longitude: number } | null,
  ) => void;
}) {
  const map = useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const newLocation = { latitude: lat, longitude: lng };
      setUserLocation(newLocation);
      onLocationChange?.(newLocation);
      await nativeService.hapticImpact("light");
    },
  });

  return null;
}

// Map updater component to handle center changes
function MapUpdater({ center }: { center: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

// Map controls component
function MapControls({ onLocate }: { onLocate: () => void }) {
  const map = useMap();

  return (
    <div className="absolute top-4 right-4 z-[1000] space-y-2">
      <Button
        size="sm"
        variant="secondary"
        className="w-10 h-10 p-0 shadow-md"
        onClick={() => map.zoomIn()}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="secondary"
        className="w-10 h-10 p-0 shadow-md"
        onClick={() => map.zoomOut()}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="secondary"
        className="w-10 h-10 p-0 shadow-md"
        onClick={onLocate}
      >
        <Locate className="h-4 w-4" />
      </Button>
    </div>
  );
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
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(
    center ? [center.latitude, center.longitude] : [40.7128, -74.006],
  );
  const mapRef = useRef<HTMLDivElement>(null);

  // Update map center when center prop changes
  useEffect(() => {
    if (center) {
      setMapCenter([center.latitude, center.longitude]);
    }
  }, [center]);

  // Get user's current location
  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await nativeService.getCurrentLocation();
      if (location) {
        const newLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
        setUserLocation(newLocation);
        setMapCenter([location.latitude, location.longitude]);
        onLocationChange?.(newLocation);
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
            <div className="w-full h-96 rounded-lg border overflow-hidden relative">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Map updater for center changes */}
                <MapUpdater center={mapCenter} />

                {/* Event handlers */}
                <MapEventHandler
                  onLocationChange={onLocationChange}
                  userLocation={userLocation}
                  setUserLocation={setUserLocation}
                />

                {/* Item markers */}
                {sortedItems.map((item) => (
                  <Marker
                    key={item.id}
                    position={[item.latitude, item.longitude]}
                    icon={createCustomIcon(
                      item.type,
                      selectedItem?.id === item.id,
                    )}
                    eventHandlers={{
                      click: () => handleItemClick(item),
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-semibold text-sm mb-1">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-gray-600 mb-2">
                            {item.description}
                          </p>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
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
                            {item.price && (
                              <span className="font-bold text-primary text-sm">
                                ${item.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {item.distance && (
                            <p className="text-xs text-gray-500">
                              {item.distance.toFixed(1)} km away
                            </p>
                          )}
                          {item.startDate && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-500">
                                {formatDate(item.startDate)}
                              </span>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToItem(item);
                            }}
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            Get Directions
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* User location marker */}
                {userLocation && (
                  <Marker
                    position={[userLocation.latitude, userLocation.longitude]}
                    icon={userLocationIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="text-sm font-semibold">Your Location</p>
                        <p className="text-xs text-gray-600">
                          {userLocation.latitude.toFixed(4)},{" "}
                          {userLocation.longitude.toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Map controls */}
                <MapControls onLocate={getCurrentLocation} />
              </MapContainer>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-2 space-y-1 z-[1000] shadow-md">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span>Products</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Events</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
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
