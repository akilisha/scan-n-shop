import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  Star,
  Clock,
  X,
  Heart,
  Share,
  Package,
} from "lucide-react";
import { MapItem } from "@/components/MapView";
import { nativeService } from "@/lib/native";
import { cn } from "@/lib/utils";

interface ProductDetailModalProps {
  product: MapItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const [isContacting, setIsContacting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!product || product.type !== "product") return null;

  const handleContactSeller = async () => {
    setIsContacting(true);
    try {
      await nativeService.hapticImpact("medium");

      // Simulate contacting seller
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real app, this would open messaging or phone
      await nativeService.sendLocalNotification(
        "Contact Seller",
        `Opening contact for ${product.sellerName}`,
      );

      await nativeService.hapticSuccess();
    } catch (error) {
      console.error("Error contacting seller:", error);
      await nativeService.hapticError();
    } finally {
      setIsContacting(false);
    }
  };

  const handleGetDirections = async () => {
    await nativeService.hapticSuccess();

    const query = encodeURIComponent(
      `${product.title} - ${product.latitude},${product.longitude}`,
    );

    const mapUrls = [
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      `maps://maps.google.com/maps?q=${product.latitude},${product.longitude}`,
      `https://maps.google.com/?q=${product.latitude},${product.longitude}`,
    ];

    try {
      const mapWindow = window.open(mapUrls[0], "_blank");
      if (!mapWindow) {
        window.location.href = mapUrls[0];
      }
    } catch (error) {
      console.error("Error opening maps:", error);
      try {
        await navigator.clipboard.writeText(
          `${product.latitude}, ${product.longitude}`,
        );
        alert(
          `Coordinates copied: ${product.latitude}, ${product.longitude}\nPaste into your maps app to navigate to ${product.title}`,
        );
      } catch (clipboardError) {
        alert(
          `Navigate to: ${product.title}\nCoordinates: ${product.latitude}, ${product.longitude}`,
        );
      }
    }
  };

  const handleSaveProduct = async () => {
    setIsSaved(!isSaved);
    await nativeService.hapticImpact("light");

    if (!isSaved) {
      await nativeService.sendLocalNotification(
        "Product Saved",
        `${product.title} added to your saved items`,
      );
    }
  };

  const handleShareProduct = async () => {
    await nativeService.hapticImpact("light");

    const shareData = {
      title: product.title,
      text: `Check out this ${product.category.toLowerCase()} for $${product.price} from ${product.sellerName}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy link
        await navigator.clipboard.writeText(
          `${shareData.title} - ${shareData.text}`,
        );
        alert("Product details copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-green-600" />
            <span>Product Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Image */}
          <div className="relative">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            {/* Action buttons overlay */}
            <div className="absolute top-2 right-2 flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                className="w-8 h-8 p-0"
                onClick={handleSaveProduct}
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    isSaved ? "fill-red-500 text-red-500" : "text-gray-600",
                  )}
                />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="w-8 h-8 p-0"
                onClick={handleShareProduct}
              >
                <Share className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  ${product.price?.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                {product.category}
              </Badge>
              {product.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <Separator />

            {/* Seller Info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {product.sellerName?.charAt(0) || "S"}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium">{product.sellerName}</p>
                <p className="text-sm text-muted-foreground">Local Seller</p>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">4.8</span>
              </div>
            </div>

            {/* Location Info */}
            {product.distance && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{product.distance.toFixed(1)} km away</span>
                <Clock className="h-4 w-4 ml-2" />
                <span>Available now</span>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleContactSeller}
                disabled={isContacting}
                className="w-full"
                size="lg"
              >
                {isContacting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Seller
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleGetDirections}
                  className="flex-1"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Directions
                </Button>
                <Button variant="outline" className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              </div>
            </div>

            {/* Safety Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>💡 Safety First:</strong> Meet in public places for
                pickup. Check the item before payment. Trust your instincts.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
