import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { EventCreator, EventData } from "@/components/EventCreator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
  Star,
  Info,
} from "lucide-react";
import { nativeService } from "@/lib/native";
import { cn } from "@/lib/utils";

// Mock events for demo
const mockEvents: (EventData & { id: string })[] = [
  {
    id: "1",
    title: "Weekend Moving Sale",
    description: "Everything must go! Furniture, electronics, books, and more.",
    eventType: "garage_sale",
    location: {
      latitude: 40.7128,
      longitude: -74.006,
      address: "123 Main St, New York, NY",
      locationName: "My Garage",
      searchRadius: 5,
    },
    startDate: new Date(Date.now() + 86400000), // Tomorrow
    endDate: new Date(Date.now() + 172800000), // Day after
    isRecurring: false,
    entryFee: 0,
    tags: ["furniture", "electronics", "books"],
    images: [],
    status: "active",
  },
];

export default function EventManager() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(mockEvents);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<
    (EventData & { id: string }) | null
  >(null);

  const handleCreateEvent = async (eventData: EventData) => {
    try {
      // In real app, this would call the API
      console.log("Creating event:", eventData);

      const newEvent = {
        ...eventData,
        id: Date.now().toString(),
      };

      setEvents([newEvent, ...events]);
      setShowCreateForm(false);

      await nativeService.hapticSuccess();
      await nativeService.sendLocalNotification(
        "Event Created!",
        `Your ${getEventTypeLabel(eventData.eventType)} is now live`,
      );
    } catch (error) {
      console.error("Error creating event:", error);
      await nativeService.hapticError();
    }
  };

  const handleEditEvent = async (eventData: EventData) => {
    try {
      console.log("Updating event:", eventData);

      setEvents(
        events.map((event) =>
          event.id === editingEvent?.id
            ? { ...eventData, id: event.id }
            : event,
        ),
      );
      setEditingEvent(null);

      await nativeService.hapticSuccess();
    } catch (error) {
      console.error("Error updating event:", error);
      await nativeService.hapticError();
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      setEvents(events.filter((event) => event.id !== eventId));
      await nativeService.hapticSuccess();
    } catch (error) {
      console.error("Error deleting event:", error);
      await nativeService.hapticError();
    }
  };

  const getEventTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      garage_sale: "Garage Sale",
      farmers_market: "Farmers Market",
      auction: "Auction",
      estate_sale: "Estate Sale",
      flea_market: "Flea Market",
      pop_up: "Pop-up Shop",
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "draft":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const headerContent = (
    <div>
      <h1 className="text-xl font-semibold">Event Manager</h1>
      <p className="text-sm text-muted-foreground">
        Create and manage your garage sales, markets, and events
      </p>
    </div>
  );

  if (showCreateForm || editingEvent) {
    return (
      <Layout headerContent={headerContent} showBottomNav={true}>
        <EventCreator
          initialData={editingEvent || undefined}
          onSave={editingEvent ? handleEditEvent : handleCreateEvent}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingEvent(null);
          }}
        />
      </Layout>
    );
  }

  return (
    <Layout headerContent={headerContent} showBottomNav={true}>
      <div className="space-y-6">
        {/* Feature Introduction */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-coral-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg mb-2">
                  🎪 Create Location-Based Events
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Set up garage sales, markets, or auctions that customers can
                  discover by location. Perfect for weekend sales and pop-up
                  markets!
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    GPS Discovery
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Customer Notifications
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Featured Events
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Event Button */}
        <Card className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent
            className="flex flex-col items-center justify-center py-8"
            onClick={() => setShowCreateForm(true)}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Create New Event</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Set up a garage sale, market, or auction that customers can find
              by location
            </p>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </CardContent>
        </Card>

        {/* Events List */}
        {events.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Ready to get started?</strong> Create your first
              location-based event! Customers will be able to discover your
              garage sale, market, or auction by searching their area.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Events</h2>
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            getStatusColor(event.status),
                          )}
                        >
                          {event.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getEventTypeLabel(event.eventType)}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground mb-4">
                        {event.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="text-sm">
                            {event.startDate.toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-sm">
                            {event.startDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-sm">
                            {event.location.locationName ||
                              event.location.address}
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {event.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>🗺️ {event.location.searchRadius}km radius</span>
                        {event.entryFee > 0 && (
                          <span>💰 ${event.entryFee} entry</span>
                        )}
                        {event.isRecurring && <span>🔄 Recurring</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingEvent(event)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          console.log("View event analytics:", event.id)
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteEvent(event.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium text-sm">Add detailed photos</p>
                <p className="text-xs text-muted-foreground">
                  Events with photos get 3x more visitors
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium text-sm">Set the right radius</p>
                <p className="text-xs text-muted-foreground">
                  5-10km works best for garage sales, 15-25km for markets
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium text-sm">Use relevant tags</p>
                <p className="text-xs text-muted-foreground">
                  Help customers find you with tags like "vintage",
                  "electronics", "furniture"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
