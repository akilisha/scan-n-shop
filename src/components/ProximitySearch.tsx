import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MapPin,
  Filter,
  Target,
  Calendar,
  DollarSign,
  Clock,
  Settings,
  Bookmark,
  History,
  Loader2,
  Navigation,
} from "lucide-react";
import { MapView, MapItem } from "@/components/MapView";
import { nativeService } from "@/lib/native";
import { cn } from "@/lib/utils";

export interface SearchFilters {
  query: string;
  category: string;
  eventType: string;
  priceRange: [number, number];
  timeFrame: string;
  radius: number;
  sortBy: string;
}

export interface SearchLocation {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
}

interface ProximitySearchProps {
  onSearch: (
    location: SearchLocation,
    filters: SearchFilters,
  ) => Promise<MapItem[]>;
  onItemClick?: (item: MapItem) => void;
  savedLocations?: SearchLocation[];
  recentSearches?: string[];
  className?: string;
}

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "electronics", label: "Electronics" },
  { value: "furniture", label: "Furniture" },
  { value: "clothing", label: "Clothing" },
  { value: "books", label: "Books" },
  { value: "tools", label: "Tools" },
  { value: "jewelry", label: "Jewelry" },
  { value: "toys", label: "Toys & Games" },
  { value: "sports", label: "Sports & Outdoors" },
  { value: "art", label: "Art & Collectibles" },
  { value: "kitchenware", label: "Kitchen & Dining" },
  { value: "automotive", label: "Automotive" },
];

const EVENT_TYPES = [
  { value: "all", label: "All Events" },
  { value: "garage_sale", label: "Garage Sales" },
  { value: "farmers_market", label: "Farmers Markets" },
  { value: "auction", label: "Auctions" },
  { value: "estate_sale", label: "Estate Sales" },
  { value: "flea_market", label: "Flea Markets" },
  { value: "pop_up", label: "Pop-up Shops" },
];

const TIME_FRAMES = [
  { value: "all", label: "Any Time" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this_week", label: "This Week" },
  { value: "this_weekend", label: "This Weekend" },
  { value: "next_week", label: "Next Week" },
];

const SORT_OPTIONS = [
  { value: "distance", label: "Distance" },
  { value: "date", label: "Date" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "popular", label: "Most Popular" },
];

export function ProximitySearch({
  onSearch,
  onItemClick,
  savedLocations = [],
  recentSearches = [],
  className,
}: ProximitySearchProps) {
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(
    null,
  );
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "all",
    eventType: "all",
    priceRange: [0, 1000],
    timeFrame: "all",
    radius: 10,
    sortBy: "distance",
  });
  const [searchResults, setSearchResults] = useState<MapItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Get current location
  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await nativeService.getCurrentLocation();
      if (location) {
        const searchLoc: SearchLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          name: "Current Location",
          address: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
        };
        setSearchLocation(searchLoc);
        setLocationInput("Current Location");
        await nativeService.hapticImpact("light");
        // Auto-search when location is set
        performSearch(searchLoc, filters);
      }
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Perform search
  const performSearch = async (
    location: SearchLocation,
    searchFilters: SearchFilters,
  ) => {
    setIsSearching(true);
    try {
      const results = await onSearch(location, searchFilters);
      setSearchResults(results);
      await nativeService.hapticImpact("light");

      // Save search to history
      await nativeService.setData("recent_search", {
        location: location.name,
        query: searchFilters.query,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Search error:", error);
      await nativeService.hapticError();
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search submission
  const handleSearch = () => {
    if (searchLocation) {
      performSearch(searchLocation, filters);
    } else if (filters.query.trim()) {
      // If no location is set but user has a search query, use a default location
      const defaultLocation: SearchLocation = {
        latitude: 40.7128, // Default to NYC for demo
        longitude: -74.006,
        name: "Search Area",
        address: "General search area",
      };
      setSearchLocation(defaultLocation);
      setLocationInput("General Area");
      performSearch(defaultLocation, filters);
    }
  };

  // Use saved location
  const useSavedLocation = (location: SearchLocation) => {
    setSearchLocation(location);
    setLocationInput(location.name);
    performSearch(location, filters);
  };

  // Update filter
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Auto-search if location is set
    if (searchLocation) {
      performSearch(searchLocation, newFilters);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: "",
      category: "all",
      eventType: "all",
      priceRange: [0, 1000],
      timeFrame: "all",
      radius: 10,
      sortBy: "distance",
    };
    setFilters(clearedFilters);

    if (searchLocation) {
      performSearch(searchLocation, clearedFilters);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-primary" />
            <span>Discover Local Items & Events</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Find garage sales, markets, and items near you
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Input */}
          <div className="space-y-2">
            <Label>Search Location</Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Enter address, city, or zip code"
                  className="pl-10"
                />
              </div>
              <Button
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
                variant="outline"
              >
                {isLoadingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Target className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Saved Locations */}
            {savedLocations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {savedLocations.map((location, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => useSavedLocation(location)}
                    className="text-xs"
                  >
                    <Bookmark className="h-3 w-3 mr-1" />
                    {location.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Search Query */}
          <div className="space-y-2">
            <Label>What are you looking for?</Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filters.query}
                  onChange={(e) => updateFilter("query", e.target.value)}
                  placeholder="Search for items, brands, or keywords..."
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={
                  (!searchLocation && !filters.query.trim()) || isSearching
                }
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilter("query", search)}
                    className="text-xs"
                  >
                    <History className="h-3 w-3 mr-1" />
                    {search}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.category}
              onValueChange={(value) => updateFilter("category", value)}
            >
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.timeFrame}
              onValueChange={(value) => updateFilter("timeFrame", value)}
            >
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_FRAMES.map((timeFrame) => (
                  <SelectItem key={timeFrame.value} value={timeFrame.value}>
                    {timeFrame.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Settings className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-4">
                {/* Event Type Filter */}
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={filters.eventType}
                    onValueChange={(value) => updateFilter("eventType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((eventType) => (
                        <SelectItem
                          key={eventType.value}
                          value={eventType.value}
                        >
                          {eventType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <div className="px-3">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) =>
                        updateFilter("priceRange", value)
                      }
                      max={1000}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>${filters.priceRange[0]}</span>
                      <span>${filters.priceRange[1]}+</span>
                    </div>
                  </div>
                </div>

                {/* Search Radius */}
                <div className="space-y-2">
                  <Label>Search Radius: {filters.radius} km</Label>
                  <Slider
                    value={[filters.radius]}
                    onValueChange={(value) => updateFilter("radius", value[0])}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => updateFilter("sortBy", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Search Stats */}
          {searchResults.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Found {searchResults.length} items
                {searchLocation && ` near ${searchLocation.name}`}
              </span>
              <Badge variant="outline">
                <Navigation className="h-3 w-3 mr-1" />
                {filters.radius} km radius
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results Map */}
      {searchLocation && (
        <MapView
          items={searchResults}
          center={searchLocation}
          onItemClick={onItemClick}
          onLocationChange={(location) => {
            setSearchLocation({
              latitude: location.latitude,
              longitude: location.longitude,
              name: "Selected Location",
            });
          }}
          showSearch={false}
          showFilters={false}
        />
      )}

      {/* No Results State */}
      {!isSearching && searchResults.length === 0 && searchLocation && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No Items Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No items or events match your search criteria. Try:
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Expanding your search radius</p>
              <p>• Changing your search terms</p>
              <p>• Clearing some filters</p>
              <p>• Searching for a different time frame</p>
            </div>
            <Button
              onClick={() => updateFilter("radius", filters.radius + 10)}
              variant="outline"
              className="mt-4"
            >
              Expand Search to {filters.radius + 10} km
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
