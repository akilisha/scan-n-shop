import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Plus, Edit, Trash2, Clock } from "lucide-react";

interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  hours: string;
  isDefault: boolean;
}

const mockLocations: Location[] = [];

export function MultiLocationService() {
  const [locations, setLocations] = useState<Location[]>(mockLocations);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: "",
    address: "",
    hours: "",
  });

  const handleAddLocation = () => {
    if (!newLocation.name || !newLocation.address) return;

    const location: Location = {
      id: Date.now().toString(),
      name: newLocation.name,
      address: newLocation.address,
      coordinates: { lat: 0, lng: 0 }, // TODO: Geocode address
      hours: newLocation.hours || "9AM-5PM",
      isDefault: locations.length === 0,
    };

    setLocations([...locations, location]);
    setNewLocation({ name: "", address: "", hours: "" });
    setIsAddingLocation(false);
  };

  const handleSetDefault = (id: string) => {
    setLocations(
      locations.map((loc) => ({
        ...loc,
        isDefault: loc.id === id,
      }))
    );
  };

  const handleDeleteLocation = (id: string) => {
    const location = locations.find((loc) => loc.id === id);
    if (location?.isDefault && locations.length > 1) {
      // Set first remaining location as default
      const remaining = locations.filter((loc) => loc.id !== id);
      remaining[0].isDefault = true;
    }
    setLocations(locations.filter((loc) => loc.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Add Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Manage Locations</span>
            </div>
            <Dialog open={isAddingLocation} onOpenChange={setIsAddingLocation}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Location</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Location Name</Label>
                    <Input
                      id="name"
                      value={newLocation.name}
                      onChange={(e) =>
                        setNewLocation({ ...newLocation, name: e.target.value })
                      }
                      placeholder="Main Store, Workshop, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newLocation.address}
                      onChange={(e) =>
                        setNewLocation({ ...newLocation, address: e.target.value })
                      }
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hours">Hours</Label>
                    <Input
                      id="hours"
                      value={newLocation.hours}
                      onChange={(e) =>
                        setNewLocation({ ...newLocation, hours: e.target.value })
                      }
                      placeholder="Mon-Fri 9AM-5PM"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingLocation(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddLocation}>Add Location</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No locations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your business locations to manage inventory and events across multiple sites.
              </p>
              <Button onClick={() => setIsAddingLocation(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Location
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <Card key={location.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{location.name}</h4>
                          {location.isDefault && (
                            <Badge variant="default">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {location.address}
                        </p>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{location.hours}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!location.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(location.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLocation(location.id)}
                          disabled={location.isDefault && locations.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Location Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2" />
              <p>Manage inventory across multiple locations</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2" />
              <p>Schedule events and activities at different sites</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2" />
              <p>Track performance metrics by location</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2" />
              <p>Offer location-specific promotions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
