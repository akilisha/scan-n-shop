import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  X,
  Scan,
  Flashlight,
  FlashlightOff,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { nativeService } from "@/lib/native";

interface ScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function Scanner({ onScan, onClose, isOpen }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [useNativeScanner, setUseNativeScanner] = useState(false);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  useEffect(() => {
    checkDeviceCapabilities();
  }, []);

  const checkDeviceCapabilities = async () => {
    try {
      const deviceInfo = await nativeService.getDeviceInfo();
      const isNative = deviceInfo.platform !== "web";
      setUseNativeScanner(isNative);
    } catch (error) {
      console.log("Device capability check failed, using web scanner");
      setUseNativeScanner(false);
    }
  };

  const checkCameraPermissions = async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      return result.state === "granted" || result.state === "prompt";
    } catch {
      // Fallback: try to access camera directly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  };

  const getCameras = async (): Promise<MediaDeviceInfo[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === "videoinput");
    } catch {
      return [];
    }
  };

  const initializeScanner = async () => {
    if (useNativeScanner) {
      await startNativeScanning();
    } else {
      await startWebScanning();
    }
  };

  const startNativeScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Provide haptic feedback when starting scan
      await nativeService.hapticImpact("light");

      const result = await nativeService.scanBarcode();

      if (result) {
        // Provide success haptic feedback
        await nativeService.hapticSuccess();
        onScan(result.text);
        onClose();
      } else {
        setIsScanning(false);
        // User cancelled scanning
        onClose();
      }
    } catch (error) {
      console.error("Native scanning error:", error);
      setError("Failed to access camera. Please check camera permissions.");
      setIsScanning(false);
      // Provide error haptic feedback
      await nativeService.hapticError();
    }
  };

  const startWebScanning = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(
        "Camera access is not supported on this device or browser. Please use a modern mobile browser.",
      );
      return;
    }

    const hasPermission = await checkCameraPermissions();
    if (!hasPermission) {
      setError(
        "Camera access is required for this app. Please enable camera permissions and refresh the page.",
      );
      return;
    }

    try {
      setError(null);
      const availableCameras = await getCameras();
      setCameras(availableCameras);

      if (availableCameras.length === 0) {
        setError(
          "No cameras found on this device. This app requires a camera to scan items.",
        );
        return;
      }

      codeReader.current = new BrowserMultiFormatReader();
      await startWebCameraScanning();
    } catch (err) {
      setError(
        "Failed to initialize camera. Please check your camera permissions and try again.",
      );
      console.error("Scanner initialization error:", err);
    }
  };

  const startWebCameraScanning = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setError(null);

      // Create a new code reader if needed
      if (!codeReader.current) {
        codeReader.current = new BrowserMultiFormatReader();
      }

      const constraints = {
        video: {
          deviceId: cameras[currentCameraIndex]?.deviceId,
          facingMode: { ideal: "environment" }, // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      // Check for flash capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      setHasFlash(!!capabilities.torch);

      // Start decoding
      codeReader.current.decodeFromVideoDevice(
        cameras[currentCameraIndex]?.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            onScan(result.getText());
            stopScanning();
          }
          // Only log actual errors, not NotFoundException which is normal
          if (
            error &&
            !error.message?.includes("NotFoundException") &&
            !error.message?.includes("No MultiFormat Readers")
          ) {
            console.error("Scanning error:", error);
          }
        },
      );
    } catch (err) {
      setError(
        "Failed to start camera. Please ensure camera permissions are granted.",
      );
      setIsScanning(false);
      console.error("Start scanning error:", err);
    }
  };

  const stopScanning = async () => {
    setIsScanning(false);
    setFlashOn(false);

    // Stop native scanning if active
    if (useNativeScanner) {
      try {
        await nativeService.stopBarcodeScanning();
      } catch (error) {
        console.error("Error stopping native scanning:", error);
      }
    }

    // Stop all media tracks immediately and forcefully
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        // Force remove the track from the stream
        streamRef.current?.removeTrack(track);
      });
      streamRef.current = null;
    }

    // Clear the video element and pause it
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Force reload to clear the stream
      // Additional cleanup to ensure video element is completely reset
      videoRef.current.removeAttribute("src");
    }

    // Reset the code reader and clean up completely
    if (codeReader.current) {
      try {
        if (typeof codeReader.current.reset === "function") {
          codeReader.current.reset();
        }
        if (
          typeof codeReader.current.stopContinuousDecodeFromInputVideoDevice ===
          "function"
        ) {
          codeReader.current.stopContinuousDecodeFromInputVideoDevice();
        }
      } catch (error) {
        console.log("CodeReader cleanup not available, cleaning up manually");
      }
      codeReader.current = null;
    }

    // Force garbage collection of any remaining video elements
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }, 100);
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !flashOn }],
      });
      setFlashOn(!flashOn);
    } catch (err) {
      console.error("Flash toggle error:", err);
    }
  };

  const switchCamera = async () => {
    if (useNativeScanner || cameras.length <= 1) return;

    await stopScanning();
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);

    setTimeout(() => {
      startWebCameraScanning();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative h-full w-full">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 safe-area-top">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-black/20 border-white/20 text-white hover:bg-white/10"
            >
              <X size={20} />
            </Button>
            <Badge className="bg-primary text-primary-foreground">
              <Scan size={14} className="mr-1" />
              Scan to Add Items
            </Badge>
            <div className="w-10" />
          </div>
        </div>

        {/* Camera View */}
        <div className="relative h-full w-full overflow-hidden">
          {error ? (
            <Card className="absolute inset-4 top-20 flex items-center justify-center">
              <CardContent className="text-center p-8">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Camera className="h-8 w-8 text-destructive" />
                </div>
                <Alert variant="destructive" className="text-left">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button className="mt-4" onClick={initializeScanner}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted
              />

              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Scanning Frame */}
                  <div className="w-64 h-64 border-2 border-white rounded-2xl relative overflow-hidden">
                    <div className="absolute inset-0 border-2 border-primary rounded-2xl animate-pulse" />

                    {/* Corner Indicators */}
                    <div className="absolute top-2 left-2 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg" />

                    {/* Scanning Line */}
                    {isScanning && (
                      <div className="absolute inset-x-4 top-1/2 h-0.5 bg-primary animate-pulse" />
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                    <p className="text-white text-sm font-medium">
                      Point camera at barcode or QR code
                    </p>
                    <p className="text-white/70 text-xs mt-1">
                      Items will be added to your cart automatically
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Controls */}
        {!error && (
          <div className="absolute bottom-0 left-0 right-0 p-4 safe-area-bottom">
            <div className="flex items-center justify-center space-x-6">
              {hasFlash && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFlash}
                  className={cn(
                    "bg-black/20 border-white/20 text-white hover:bg-white/10",
                    flashOn &&
                      "bg-primary border-primary text-primary-foreground",
                  )}
                >
                  {flashOn ? (
                    <Flashlight size={20} />
                  ) : (
                    <FlashlightOff size={20} />
                  )}
                </Button>
              )}

              {cameras.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchCamera}
                  className="bg-black/20 border-white/20 text-white hover:bg-white/10"
                >
                  <RotateCcw size={20} />
                </Button>
              )}
            </div>

            <div className="text-center mt-4">
              <p className="text-white/70 text-xs">
                Support for barcodes, QR codes, and price tags
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
