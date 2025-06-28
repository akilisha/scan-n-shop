import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  MapPin,
  Camera,
  Tag,
  Users,
  DollarSign,
  Phone,
  Mail,
  Info,
  Plus,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { LocationPicker, LocationData } from "@/components/LocationPicker";
import { nativeService } from "@/lib/native";
import { cn } from "@/lib/utils";

export interface EventData {
  id?: string;
  title: string;
  description: string;
  eventType: string;
  location: LocationData;
  startDate: Date;
  endDate?: Date;
  isRecurring: boolean;
  recurrencePattern?: string;
  maxParticipants?: number;
  entryFee: number;
  contactPhone?: string;
  contactEmail?: string;
  specialInstructions?: string;
  tags: string[];
  images: string[];
  status: "draft" | "active";
}

interface EventCreatorProps {
  initialData?: Partial<EventData>;
  onSave: (eventData: EventData) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

const EVENT_TYPES = [
  { value: "garage_sale", label: "Garage Sale", icon: "🏠" },
  { value: "farmers_market", label: "Farmers Market", icon: "🚜" },
  { value: "auction", label: "Auction", icon: "🔨" },
  { value: "estate_sale", label: "Estate Sale", icon: "🏛️" },
  { value: "flea_market", label: "Flea Market", icon: "🛍️" },
  { value: "pop_up", label: "Pop-up Shop", icon: "🏪" },
];

const COMMON_TAGS = [
  "vintage",
  "electronics",
  "furniture",
  "clothes",
  "books",
  "toys",
  "tools",
  "kitchenware",
  "jewelry",
  "art",
  "collectibles",
  "sports",
];

export function EventCreator({
  initialData,
  onSave,
  onCancel,
  className,
}: EventCreatorProps) {
  const [eventData, setEventData] = useState<Partial<EventData>>({
    title: "",
    description: "",
    eventType: "garage_sale",
    startDate: new Date(),
    endDate: undefined,
    isRecurring: false,
    entryFee: 0,
    tags: [],
    images: [],
    status: "draft",
    ...initialData,
  });
  const [currentTag, setCurrentTag] = useState("");
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!eventData.title?.trim()) {
      newErrors.title = "Event title is required";
    }

    if (!eventData.description?.trim()) {
      newErrors.description = "Event description is required";
    }

    if (!eventData.location) {
      newErrors.location = "Location is required";
    }

    if (!eventData.startDate) {
      newErrors.startDate = "Start date is required";
    } else if (eventData.startDate < new Date()) {
      newErrors.startDate = "Start date cannot be in the past";
    }

    if (
      eventData.endDate &&
      eventData.startDate &&
      eventData.endDate < eventData.startDate
    ) {
      newErrors.endDate = "End date cannot be before start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSave = async (status: "draft" | "active") => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await nativeService.hapticImpact("medium");

      const completeEventData: EventData = {
        title: eventData.title!,
        description: eventData.description!,
        eventType: eventData.eventType!,
        location: eventData.location!,
        startDate: eventData.startDate!,
        endDate: eventData.endDate,
        isRecurring: eventData.isRecurring || false,
        recurrencePattern: eventData.recurrencePattern,
        maxParticipants: eventData.maxParticipants,
        entryFee: eventData.entryFee || 0,
        contactPhone: eventData.contactPhone,
        contactEmail: eventData.contactEmail,
        specialInstructions: eventData.specialInstructions,
        tags: eventData.tags || [],
        images: eventData.images || [],
        status,
      };

      await onSave(completeEventData);
      await nativeService.hapticSuccess();

      // Send notification for published events
      if (status === "active") {
        await nativeService.sendLocalNotification(
          "Event Published!",
          `Your ${getEventTypeLabel(eventData.eventType!)} is now live and discoverable by nearby customers.`,
        );
      }
    } catch (error) {
      console.error("Error saving event:", error);
      await nativeService.hapticError();
    } finally {
      setIsSaving(false);
    }
  };

  // Add tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !eventData.tags?.includes(trimmedTag)) {
      setEventData({
        ...eventData,
        tags: [...(eventData.tags || []), trimmedTag],
      });
      setCurrentTag("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setEventData({
      ...eventData,
      tags: eventData.tags?.filter((tag) => tag !== tagToRemove) || [],
    });
  };

  // Take photo
  const takePhoto = async () => {
    setIsLoadingImages(true);
    try {
      const photoUrl = await nativeService.takePicture();
      if (photoUrl) {
        setEventData({
          ...eventData,
          images: [...(eventData.images || []), photoUrl],
        });
        await nativeService.hapticSuccess();
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      await nativeService.hapticError();
    } finally {
      setIsLoadingImages(false);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setEventData({
      ...eventData,
      images: eventData.images?.filter((_, i) => i !== index) || [],
    });
  };

  // Helper function to get event type label
  const getEventTypeLabel = (type: string) => {
    return EVENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>{initialData?.id ? "Edit Event" : "Create New Event"}</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set up your garage sale, market, or auction for local discovery
          </p>
        </CardHeader>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type</Label>
            <Select
              value={eventData.eventType}
              onValueChange={(value) =>
                setEventData({ ...eventData, eventType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center space-x-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={eventData.title}
              onChange={(e) =>
                setEventData({ ...eventData, title: e.target.value })
              }
              placeholder="e.g., 'Moving Sale - Everything Must Go!'"
              className={cn(errors.title && "border-destructive")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={eventData.description}
              onChange={(e) =>
                setEventData({ ...eventData, description: e.target.value })
              }
              placeholder="Describe what you're selling, special deals, or what customers can expect..."
              rows={3}
              className={cn(errors.description && "border-destructive")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <LocationPicker
        onLocationSelected={(location) =>
          setEventData({ ...eventData, location })
        }
        initialLocation={eventData.location}
        title="Event Location"
        description="Where will customers find your event?"
        showRadiusSelector={true}
      />
      {errors.location && (
        <Alert variant="destructive">
          <AlertDescription>{errors.location}</AlertDescription>
        </Alert>
      )}

      {/* Date & Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Date & Time</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date & Time *</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={
                eventData.startDate
                  ? eventData.startDate.toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                setEventData({
                  ...eventData,
                  startDate: new Date(e.target.value),
                })
              }
              className={cn(errors.startDate && "border-destructive")}
            />
            {errors.startDate && (
              <p className="text-sm text-destructive">{errors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date & Time (Optional)</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={
                eventData.endDate
                  ? eventData.endDate.toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                setEventData({
                  ...eventData,
                  endDate: e.target.value
                    ? new Date(e.target.value)
                    : undefined,
                })
              }
              className={cn(errors.endDate && "border-destructive")}
            />
            {errors.endDate && (
              <p className="text-sm text-destructive">{errors.endDate}</p>
            )}
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isRecurring">Recurring Event</Label>
              <p className="text-sm text-muted-foreground">
                This event happens regularly
              </p>
            </div>
            <Switch
              id="isRecurring"
              checked={eventData.isRecurring}
              onCheckedChange={(checked) =>
                setEventData({ ...eventData, isRecurring: checked })
              }
            />
          </div>

          {eventData.isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="recurrencePattern">Recurrence Pattern</Label>
              <Select
                value={eventData.recurrencePattern || ""}
                onValueChange={(value) =>
                  setEventData({ ...eventData, recurrencePattern: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Additional Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Entry Fee */}
          <div className="space-y-2">
            <Label htmlFor="entryFee">Entry Fee</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="entryFee"
                type="number"
                step="0.01"
                min="0"
                value={eventData.entryFee}
                onChange={(e) =>
                  setEventData({
                    ...eventData,
                    entryFee: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave as $0.00 for free events
            </p>
          </div>

          {/* Max Participants */}
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">
              Maximum Participants (Optional)
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                value={eventData.maxParticipants || ""}
                onChange={(e) =>
                  setEventData({
                    ...eventData,
                    maxParticipants: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                placeholder="No limit"
                className="pl-10"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contactPhone"
                  type="tel"
                  value={eventData.contactPhone || ""}
                  onChange={(e) =>
                    setEventData({ ...eventData, contactPhone: e.target.value })
                  }
                  placeholder="(555) 123-4567"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contactEmail"
                  type="email"
                  value={eventData.contactEmail || ""}
                  onChange={(e) =>
                    setEventData({ ...eventData, contactEmail: e.target.value })
                  }
                  placeholder="your@email.com"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="specialInstructions">
              Special Instructions (Optional)
            </Label>
            <Textarea
              id="specialInstructions"
              value={eventData.specialInstructions || ""}
              onChange={(e) =>
                setEventData({
                  ...eventData,
                  specialInstructions: e.target.value,
                })
              }
              placeholder="Parking info, early bird specials, cash only, etc..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>Tags</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Help customers find your event by adding relevant tags
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Tags */}
          {eventData.tags && eventData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {eventData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>{tag}</span>
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Add New Tag */}
          <div className="flex space-x-2">
            <Input
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(currentTag);
                }
              }}
              placeholder="Add a tag..."
              className="flex-1"
            />
            <Button
              onClick={() => addTag(currentTag)}
              disabled={!currentTag.trim()}
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Common Tags */}
          <div className="space-y-2">
            <Label>Common Tags</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(tag)}
                  disabled={eventData.tags?.includes(tag)}
                  className="text-xs"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Photos</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add photos to attract more customers
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Images */}
          {eventData.images && eventData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {eventData.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Event photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 w-6 h-6 p-0"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add Photo Button */}
          <Button
            onClick={takePhoto}
            disabled={isLoadingImages}
            variant="outline"
            className="w-full"
          >
            {isLoadingImages ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            Add Photo
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {/* Primary Action */}
            <Button
              onClick={() => handleSave("active")}
              className="w-full"
              disabled={isSaving}
              size="lg"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Publish Event
                </>
              )}
            </Button>

            {/* Secondary Actions */}
            <div className="flex space-x-3">
              <Button
                onClick={() => handleSave("draft")}
                variant="outline"
                className="flex-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  "Save Draft"
                )}
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1"
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Published events are immediately discoverable by nearby customers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
