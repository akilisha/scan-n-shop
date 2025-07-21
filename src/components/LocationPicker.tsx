import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Search,
  Target,
  Navigation,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { nativeService } from "@/lib/native";
import { cn } from "@/lib/utils";

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  locationName?: string;
  zipCode?: string;
  searchRadius?: number;
}

interface LocationPickerProps {
  onLocationSelected: (location: LocationData) => void;
  initialLocation?: LocationData;
  showRadiusSelector?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

export function LocationPicker({
  onLocationSelected,
  initialLocation,
  showRadiusSelector = true,
  title = "Set Location",
  description = "Choose where customers can find this item",
  className,
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null,
  );
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [locationName, setLocationName] = useState(
    initialLocation?.locationName || "",
  );
  const [searchRadius, setSearchRadius] = useState(
    initialLocation?.searchRadius || 10,
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);

  // Get current location
  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setError(null);

    // Check permission status first
    const permissionStatus = await nativeService.getLocationPermissionStatus();

    if (permissionStatus === 'denied') {
      setError("Location access was previously denied. You can still search by entering an address below, or enable location in your browser settings.");
      setIsLoadingLocation(false);
      return;
    }

    if (permissionStatus === 'unsupported') {
      setError("Location services are not supported. Please enter an address manually.");
      setIsLoadingLocation(false);
      return;
    }

    try {
      await nativeService.hapticImpact("light");
      const location = await nativeService.getCurrentLocation();

      if (location) {
        const locationData: LocationData = {
          latitude: location.latitude,
          longitude: location.longitude,
          searchRadius,
        };

        // Try to get address from coordinates (reverse geocoding)
        try {
          const addressData = await reverseGeocode(
            location.latitude,
            location.longitude,
          );
          if (addressData) {
            locationData.address = addressData.formatted_address;
            locationData.locationName = addressData.name;
            locationData.zipCode = addressData.postal_code;
            setAddress(addressData.formatted_address || "");
            setLocationName(addressData.name || "");
          }
        } catch (geoError) {
          console.log("Reverse geocoding failed:", geoError);
        }

        setSelectedLocation(locationData);
        onLocationSelected(locationData);
        await nativeService.hapticSuccess();
      } else {
        setError(
          "Unable to get your current location. Please enter an address manually.",
        );
      }
    } catch (error) {
      console.log("Location not available:", error);
      setError("No problem! Location access isn't required. Just enter your address below and we'll help customers find you.");
      // Don't show haptic error for location denial - it's not an error
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Reverse geocoding (coordinates to address)
  const reverseGeocode = async (lat: number, lng: number) => {
    // In a real app, you'd use Google Maps Geocoding API or similar
    // For now, return a mock response
    return {
      formatted_address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      name: "Current Location",
      postal_code: "12345",
    };
  };

  // Forward geocoding (address to coordinates)
  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // In a real app, you'd use Google Places API or similar
      // Return empty suggestions until real API integration
      const suggestions: any[] = [];
      setSuggestions(suggestions);
    } catch (error) {
      console.error("Geocoding error:", error);
      setError("Failed to search for addresses. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Select address from suggestions
  const selectSuggestion = async (suggestion: any) => {
    const locationData: LocationData = {
      latitude: suggestion.geometry.location.lat,
      longitude: suggestion.geometry.location.lng,
      address: suggestion.formatted_address,
      locationName: suggestion.name,
      searchRadius,
    };

    setSelectedLocation(locationData);
    setAddress(suggestion.formatted_address);
    setLocationName(suggestion.name);
    setSuggestions([]);
    onLocationSelected(locationData);

    await nativeService.hapticImpact("light");
  };

  // Handle radius change
  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius);
    if (selectedLocation) {
      const updatedLocation = { ...selectedLocation, searchRadius: newRadius };
      setSelectedLocation(updatedLocation);
      onLocationSelected(updatedLocation);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (address && address !== selectedLocation?.address) {
        searchAddress(address);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [address, selectedLocation?.address]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span>{title}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Location Button */}
        <div className="flex space-x-2">
          <Button
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            className="flex-1"
            variant="outline"
          >
            {isLoadingLocation ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Target className="h-4 w-4 mr-2" />
            )}
            Use Current Location
          </Button>
          {nativeService.isLocationPermissionDenied() && (
            <Button
              onClick={() => {
                nativeService.clearLocationPermissionStatus();
                setError(null);
              }}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Try Again
            </Button>
          )}
        </div>

        {/* Helpful tip for location */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          💡 <strong>Pro tip:</strong> You don't need to enable location! Just type your address, neighborhood, or nearby landmark below. Customers will still be able to find you easily.
        </div>

        {/* Address Search */}
        <div className="space-y-2">
          <Label htmlFor="address">Search Address</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address, business name, or landmark"
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Address Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <Label>Suggestions</Label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion.place_id}
                  variant="ghost"
                  className="w-full justify-start text-left p-3 h-auto"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{suggestion.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {suggestion.formatted_address}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Location Name */}
        <div className="space-y-2">
          <Label htmlFor="locationName">Location Name (Optional)</Label>
          <Input
            id="locationName"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g., 'My Garage', 'Corner of Main St', 'Blue House'"
          />
          <p className="text-xs text-muted-foreground">
            Help customers identify your location easily
          </p>
        </div>

        {/* Search Radius */}
        {showRadiusSelector && (
          <div className="space-y-3">
            <Label>Search Visibility Radius</Label>
            <div className="flex space-x-2">
              {[5, 10, 25, 50].map((radius) => (
                <Button
                  key={radius}
                  variant={searchRadius === radius ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRadiusChange(radius)}
                >
                  {radius} km
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Customers within this radius can discover your item
            </p>
          </div>
        )}

        {/* Selected Location Summary */}
        {selectedLocation && (
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4 text-success-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-success">Location Set!</p>
                  {locationName && (
                    <p className="text-sm font-medium">{locationName}</p>
                  )}
                  {address && (
                    <p className="text-sm text-muted-foreground truncate">
                      {address}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline" className="text-xs">
                      <Navigation className="h-3 w-3 mr-1" />
                      {selectedLocation.latitude.toFixed(4)},{" "}
                      {selectedLocation.longitude.toFixed(4)}
                    </Badge>
                    {showRadiusSelector && (
                      <Badge variant="outline" className="text-xs">
                        {searchRadius} km radius
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Preview Placeholder */}
        <div
          ref={mapRef}
          className="w-full h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25"
        >
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">
              {selectedLocation ? "Location Selected" : "Map Preview"}
            </p>
            <p className="text-xs">Interactive map coming soon</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
