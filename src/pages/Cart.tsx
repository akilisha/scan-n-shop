import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Scanner } from "@/components/Scanner";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Minus,
  X,
  ShoppingBag,
  Scan,
  Camera,
  AlertTriangle,
  Wifi,
  WifiOff,
  MapPin,
} from "lucide-react";
import { mockProducts } from "@/data/mockData";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import { nativeService } from "@/lib/native";

export default function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeItem,
    getTotalItems,
    getSubtotal,
    getTotal,
  } = useCart();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [suggestedProducts] = useState<Product[]>(
    mockProducts.filter(
      (p) => !cartItems.some((item) => item.product.id === p.id),
    ),
  );

  useEffect(() => {
    checkCameraAvailability();
    initializeNativeFeatures();
    saveCartToOfflineStorage();
  }, []);

  useEffect(() => {
    saveCartToOfflineStorage();
  }, [cartItems]);

  const initializeNativeFeatures = async () => {
    // Check network status
    const online = await nativeService.isOnline();
    setIsOnline(online);

    // Get current location for market tracking (optional feature)
    const locationPermission =
      await nativeService.getLocationPermissionStatus();

    if (locationPermission === "denied") {
      console.log(
        "Location access previously denied - continuing without location features",
      );
    } else if (locationPermission === "unsupported") {
      console.log(
        "Location not supported - continuing without location features",
      );
    } else {
      try {
        const location = await nativeService.getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
          console.log("Location acquired for market tracking");
        } else {
          console.log(
            "Location not available - continuing without location features",
          );
        }
      } catch (error) {
        console.log("Location not available - this is optional");
        // Location is optional, continue without it
      }
    }

    // Load offline cart if available
    const offlineCart = await nativeService.getOfflineCart();
    if (offlineCart && offlineCart.items && offlineCart.items.length > 0) {
      // Merge offline cart with current cart
      console.log("Offline cart found:", offlineCart);
      // Could implement cart merging logic here
    }
  };

  const saveCartToOfflineStorage = async () => {
    try {
      await nativeService.saveOfflineCart({
        items: cartItems,
        timestamp: Date.now(),
        location: currentLocation,
      });
    } catch (error) {
      console.error("Failed to save cart offline:", error);
    }
  };

  const checkCameraAvailability = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraAvailable(false);
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((device) => device.kind === "videoinput");
      setCameraAvailable(hasCamera);
    } catch {
      setCameraAvailable(false);
    }
  };

  const findProductByBarcode = (barcode: string): Product | null => {
    return mockProducts.find((product) => product.barcode === barcode) || null;
  };

  const parseScannedData = (data: string): Product | null => {
    // Try to find by barcode first
    let product = findProductByBarcode(data);
    if (product) return product;

    // Try to parse as JSON (for QR codes with product data)
    try {
      const parsed = JSON.parse(data);
      if (parsed.barcode) {
        product = findProductByBarcode(parsed.barcode);
        if (product) return product;
      }
      // Could also handle custom QR code formats here
    } catch {
      // Not JSON, continue
    }

    // For demo purposes, randomly assign a product if barcode not found
    // In a real app, this would call an API to lookup the product
    const randomProduct =
      mockProducts[Math.floor(Math.random() * mockProducts.length)];
    return randomProduct;
  };

  const handleScan = (data: string) => {
    const product = parseScannedData(data);
    if (product) {
      handleAddToCart(product);
      setScannerOpen(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    addToCart(product);
    setRecentlyAdded(product.id);

    // Provide haptic feedback for successful add
    await nativeService.hapticImpact("light");

    setTimeout(() => setRecentlyAdded(null), 3000);
  };

  const subtotal = getSubtotal();
  const tax = subtotal * 0.08;
  const total = getTotal();

  const headerContent = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Scan & Shop</h1>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
          </p>
          {!isOnline && (
            <Badge
              variant="outline"
              className="text-xs flex items-center space-x-1"
            >
              <WifiOff size={10} />
              <span>Offline</span>
            </Badge>
          )}
          {currentLocation && (
            <Badge
              variant="outline"
              className="text-xs flex items-center space-x-1"
            >
              <MapPin size={10} />
              <span>Located</span>
            </Badge>
          )}
        </div>
      </div>
      <div className="relative">
        <ShoppingBag className="h-6 w-6 text-primary" />
        {cartItems.length > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
            {getTotalItems()}
          </Badge>
        )}
      </div>
    </div>
  );

  // Show camera not available message
  if (cameraAvailable === false) {
    return (
      <Layout headerContent={headerContent}>
        <div className="flex flex-col items-center justify-center py-12">
          <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Camera Required</h2>
              <p className="text-muted-foreground text-center mb-6">
                This app requires a camera to scan barcodes and QR codes. Please
                use a device with camera support.
              </p>
              <Alert variant="destructive" className="text-left">
                <Camera className="h-4 w-4" />
                <AlertDescription>
                  No camera detected on this device. Please switch to a mobile
                  device or laptop with a built-in camera.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout headerContent={headerContent}>
        <div className="space-y-6">
          {/* Scan Button - Primary Action */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-coral-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <Scan className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Add Items</h3>
                  <p className="text-sm text-muted-foreground">
                    Scan barcodes, QR codes, or price tags
                  </p>
                </div>
              </div>
              <Button
                className="w-full mt-4"
                size="lg"
                onClick={() => setScannerOpen(true)}
                disabled={cameraAvailable !== true}
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Scanning
              </Button>
            </CardContent>
          </Card>

          {/* Cart Items */}
          {cartItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Ready to scan!</h2>
                <p className="text-muted-foreground text-center mb-6">
                  Use the scanner above to add items to your cart
                </p>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Supported formats:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="secondary">Barcodes</Badge>
                    <Badge variant="secondary">QR Codes</Badge>
                    <Badge variant="secondary">Price Tags</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card
                  key={item.id}
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    recentlyAdded === item.product.id &&
                      "border-primary bg-primary/5 animate-pulse",
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-foreground flex items-center">
                              {item.product.name}
                              {recentlyAdded === item.product.id && (
                                <Badge className="ml-2 text-xs animate-bounce">
                                  Added!
                                </Badge>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.product.description}
                            </p>
                            <p className="text-lg font-semibold text-primary mt-2">
                              ${item.product.price.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive p-1"
                          >
                            <X size={16} />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                              className="h-8 w-8 p-0"
                            >
                              <Minus size={14} />
                            </Button>
                            <span className="font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="h-8 w-8 p-0"
                            >
                              <Plus size={14} />
                            </Button>
                          </div>
                          <p className="font-semibold">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Order Summary */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-6"
                    size="lg"
                    onClick={() => navigate("/checkout")}
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Add Options (for demo) */}
          {cartItems.length === 0 && (
            <>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">Or try these demo items:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {mockProducts.slice(0, 4).map((product) => (
                      <Button
                        key={product.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        className="text-xs p-2 h-auto"
                      >
                        <Plus size={12} className="mr-1" />
                        {product.name}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    For demo purposes - normally you'd scan these items
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3 flex items-center">
                    <Scan size={16} className="mr-2 text-primary" />
                    How to Test Scanning
                  </h3>
                  <div className="text-sm space-y-2 text-muted-foreground">
                    <p>
                      <strong>1. Generate test codes:</strong> Use an online
                      barcode/QR generator
                    </p>
                    <p>
                      <strong>2. Sample barcodes:</strong> 123456789012,
                      234567890123, 456789012345
                    </p>
                    <p>
                      <strong>3. Display on screen:</strong> Show the code on
                      another device and scan it
                    </p>
                    <p className="text-xs mt-2">
                      💡 The scanner works with UPC, EAN, and QR codes
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* You might also like */}
          {cartItems.length > 0 && suggestedProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                You might also like
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {suggestedProducts.slice(0, 2).map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">
                            {product.name}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {product.description}
                          </p>
                          <p className="text-lg font-semibold text-primary mt-1">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddToCart(product)}
                          className="shrink-0"
                        >
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>

      {/* Scanner Modal */}
      <Scanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </>
  );
}
