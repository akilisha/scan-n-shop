import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Plus,
  Trash2,
  Navigation,
  Clock,
  CheckCircle,
} from "lucide-react";

interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  hours?: string;
  notes?: string;
  isDefault: boolean;
}

const mockLocations: Location[] = [];
  {
    id: "1",
    name: "Main Workshop",
    address: "123 Main St, Downtown",
    coordinates: { lat: 40.7128, lng: -74.006 },
    hours: "Mon-Fri 9AM-5PM",
    isDefault: true,
  },
  {
    id: "2",
    name: "Weekend Market",
    address: "Central Park Farmers Market",
    coordinates: { lat: 40.7829, lng: -73.9654 },
    hours: "Sat-Sun 8AM-2PM",
    isDefault: false,
  },
];

export function MultiLocationService() {
  const [locations, setLocations] = useState<Location[]>(mockLocations);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: "",
    address: "",
    hours: "",
    notes: "",
  });

  const handleAddLocation = () => {
    if (!newLocation.name || !newLocation.address) return;

    const location: Location = {
      id: Date.now().toString(),
      name: newLocation.name,
      address: newLocation.address,
      coordinates: { lat: 0, lng: 0 }, // Would be geocoded in real app
      hours: newLocation.hours,
      notes: newLocation.notes,
      isDefault: false,
    };

    setLocations([...locations, location]);
    setNewLocation({ name: "", address: "", hours: "", notes: "" });
    setIsAddingLocation(false);
  };

  const handleDeleteLocation = (id: string) => {
    setLocations(locations.filter((loc) => loc.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setLocations(
      locations.map((loc) => ({
        ...loc,
        isDefault: loc.id === id,
      })),
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{locations.length}</p>
            <p className="text-xs text-muted-foreground">Active Locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Navigation className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {locations.filter((loc) => loc.isDefault).length}
            </p>
            <p className="text-xs text-muted-foreground">Default Location</p>
          </CardContent>
        </Card>
      </div>

      {/* Add New Location */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus size={20} />
              Add Location
            </CardTitle>
            {!isAddingLocation && (
              <Button
                size="sm"
                onClick={() => setIsAddingLocation(true)}
                className="flex items-center gap-1"
              >
                <Plus size={16} />
                Add Location
              </Button>
            )}
          </div>
        </CardHeader>
        {isAddingLocation && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location-name">Location Name</Label>
                <Input
                  id="location-name"
                  value={newLocation.name}
                  onChange={(e) =>
                    setNewLocation({ ...newLocation, name: e.target.value })
                  }
                  placeholder="e.g., Main Workshop"
                />
              </div>
              <div>
                <Label htmlFor="location-hours">Hours (Optional)</Label>
                <Input
                  id="location-hours"
                  value={newLocation.hours}
                  onChange={(e) =>
                    setNewLocation({ ...newLocation, hours: e.target.value })
                  }
                  placeholder="e.g., Mon-Fri 9AM-5PM"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location-address">Address</Label>
              <Input
                id="location-address"
                value={newLocation.address}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, address: e.target.value })
                }
                placeholder="Full address for accurate map positioning"
              />
            </div>
            <div>
              <Label htmlFor="location-notes">Notes (Optional)</Label>
              <Input
                id="location-notes"
                value={newLocation.notes}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, notes: e.target.value })
                }
                placeholder="Pickup instructions, parking info, etc."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddLocation}>Add Location</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingLocation(false);
                  setNewLocation({
                    name: "",
                    address: "",
                    hours: "",
                    notes: "",
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Existing Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Locations</CardTitle>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No locations added yet. Add your first pickup location to get
                started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{location.name}</h4>
                        {location.isDefault && (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {location.address}
                      </p>
                      {location.hours && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock size={14} />
                          <span>{location.hours}</span>
                        </div>
                      )}
                      {location.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Note: {location.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!location.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(location.id)}
                          className="text-xs"
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteLocation(location.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Products using this location: 3
                    </span>
                    <Button size="sm" variant="ghost" className="text-xs">
                      View on Map
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card className="border-dashed border-2">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Multi-Location Guidelines</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Each product can be available at multiple pickup locations</p>
            <p>• Customers can choose their preferred pickup location</p>
            <p>• Set realistic hours and clear pickup instructions</p>
            <p>• Default location is used for new products automatically</p>
            <p>• Consider parking and accessibility for each location</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}