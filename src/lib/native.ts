import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";
import { Geolocation } from "@capacitor/geolocation";
import { PushNotifications } from "@capacitor/push-notifications";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Preferences } from "@capacitor/preferences";
import { Network } from "@capacitor/network";
import { Device } from "@capacitor/device";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export interface ScanResult {
  text: string;
  format: string;
}

export interface DeviceInfo {
  model: string;
  platform: "ios" | "android" | "web";
  operatingSystem: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
}

class NativeService {
  private isNative = Capacitor.isNativePlatform();

  // Device and Platform Detection
  async getDeviceInfo(): Promise<DeviceInfo> {
    if (!this.isNative) {
      return {
        model: "Web Browser",
        platform: "web",
        operatingSystem: "Web",
        osVersion: "1.0",
        manufacturer: "Browser",
        isVirtual: false,
      };
    }

    const info = await Device.getInfo();
    return {
      model: info.model,
      platform: info.platform as "ios" | "android",
      operatingSystem: info.operatingSystem,
      osVersion: info.osVersion,
      manufacturer: info.manufacturer,
      isVirtual: info.isVirtual,
    };
  }

  async isOnline(): Promise<boolean> {
    if (!this.isNative) {
      return navigator.onLine;
    }

    const status = await Network.getStatus();
    return status.connected;
  }

  // Camera and Barcode Scanning - Perfect for Farmers Markets!
  async takePicture(): Promise<string | null> {
    if (!this.isNative) {
      // Fallback for web - could use WebRTC camera
      console.log("Camera not available on web platform");
      return null;
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      return image.dataUrl || null;
    } catch (error) {
      console.error("Error taking picture:", error);
      return null;
    }
  }

  async scanBarcode(): Promise<ScanResult | null> {
    if (!this.isNative) {
      // Web fallback - could implement WebRTC barcode scanning
      console.log("Barcode scanning not available on web platform");
      // Simulate scan for demo
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return {
        text: "1234567890123",
        format: "EAN_13",
      };
    }

    try {
      // Start scanning with the new API
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL,
      });

      if (result && result.ScanResult) {
        return {
          text: result.ScanResult,
          format: "UNKNOWN", // The new API doesn't return format
        };
      }

      return null;
    } catch (error) {
      console.error("Error scanning barcode:", error);
      throw error;
    }
  }

  async stopBarcodeScanning(): Promise<void> {
    if (this.isNative) {
      try {
        // The new API doesn't have explicit stop methods
        // Scanning stops automatically when a code is detected or user cancels
        console.log("Barcode scanning stopped");
      } catch (error) {
        console.error("Error stopping barcode scanning:", error);
      }
    }
  }

  // Check if location permission was previously denied
  isLocationPermissionDenied(): boolean {
    return localStorage.getItem("location_permission_denied") === "true";
  }

  // Clear location permission status (for when user wants to try again)
  clearLocationPermissionStatus(): void {
    localStorage.removeItem("location_permission_denied");
  }

  // Get location permission status
  async getLocationPermissionStatus(): Promise<
    "granted" | "denied" | "prompt" | "unsupported"
  > {
    if (!navigator.geolocation) {
      return "unsupported";
    }

    if (this.isLocationPermissionDenied()) {
      return "denied";
    }

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      return permission.state as "granted" | "denied" | "prompt";
    } catch {
      // Permissions API not supported, assume prompt
      return "prompt";
    }
  }

  // Geolocation - Find nearby markets, customers, or trading spots
  async getCurrentLocation(): Promise<LocationData | null> {
    if (!this.isNative) {
      // Web geolocation fallback
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            // Check if geolocation is supported
            if (!navigator.geolocation) {
              reject(new Error("Geolocation is not supported by this browser"));
              return;
            }

            // First try with low accuracy for faster response
            navigator.geolocation.getCurrentPosition(
              resolve,
              (error) => {
                // If high accuracy fails, try once more with even lower accuracy
                if (error.code === error.TIMEOUT) {
                  navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 900000, // 15 minutes cache
                  });
                } else {
                  reject(error);
                }
              },
              {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 600000,
              },
            );
          },
        );

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
        };
      } catch (error) {
        // Handle GeolocationPositionError gracefully
        if (error instanceof GeolocationPositionError) {
          const errorMessages = {
            1: "Location access denied - this is fine! You can still search by entering an address.",
            2: "Location unavailable - no problem! Try entering your city or zip code instead.",
            3: "Location request timed out - you can manually enter your location instead.",
          };
          const message =
            errorMessages[error.code as keyof typeof errorMessages] ||
            error.message;
          console.log("Location not available:", message);

          // Store that user denied location for better UX
          if (error.code === 1) {
            localStorage.setItem("location_permission_denied", "true");
          }
        } else {
          console.log("Location not available:", error);
        }
        return null;
      }
    }

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined,
      };
    } catch (error) {
      console.error("Error getting location:", error);
      return null;
    }
  }

  // Haptic Feedback - Great for payment confirmations and scan feedback
  async hapticImpact(
    style: "light" | "medium" | "heavy" = "medium",
  ): Promise<void> {
    if (!this.isNative) {
      // Web vibration fallback
      if ("vibrate" in navigator) {
        const patterns = {
          light: [10],
          medium: [50],
          heavy: [100],
        };
        navigator.vibrate(patterns[style]);
      }
      return;
    }

    try {
      const impactStyle =
        style === "light"
          ? ImpactStyle.Light
          : style === "heavy"
            ? ImpactStyle.Heavy
            : ImpactStyle.Medium;

      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error("Error with haptic feedback:", error);
    }
  }

  async hapticSuccess(): Promise<void> {
    if (!this.isNative) {
      if ("vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      return;
    }

    try {
      await Haptics.notification({ type: "SUCCESS" as any });
    } catch (error) {
      console.error("Error with success haptic:", error);
    }
  }

  async hapticError(): Promise<void> {
    if (!this.isNative) {
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      return;
    }

    try {
      await Haptics.notification({ type: "ERROR" as any });
    } catch (error) {
      console.error("Error with error haptic:", error);
    }
  }

  // Local Storage - Perfect for offline cart persistence at markets
  async setData(key: string, value: any): Promise<void> {
    try {
      if (this.isNative) {
        await Preferences.set({
          key,
          value: JSON.stringify(value),
        });
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error("Error setting data:", error);
    }
  }

  async getData(key: string): Promise<any> {
    try {
      if (this.isNative) {
        const result = await Preferences.get({ key });
        return result.value ? JSON.parse(result.value) : null;
      } else {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      console.error("Error getting data:", error);
      return null;
    }
  }

  async removeData(key: string): Promise<void> {
    try {
      if (this.isNative) {
        await Preferences.remove({ key });
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error("Error removing data:", error);
    }
  }

  // Push Notifications - Order updates, inventory alerts, customer messages
  async initializePushNotifications(): Promise<boolean> {
    if (!this.isNative) {
      console.log("Push notifications not available on web");
      return false;
    }

    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === "prompt") {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== "granted") {
        throw new Error("Push notification permission denied");
      }

      await PushNotifications.register();
      return true;
    } catch (error) {
      console.error("Error initializing push notifications:", error);
      return false;
    }
  }

  async sendLocalNotification(title: string, body: string): Promise<void> {
    if (!this.isNative) {
      // Web notification fallback
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body });
      }
      return;
    }

    try {
      await PushNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      });
    } catch (error) {
      console.error("Error sending local notification:", error);
    }
  }

  // Trader-specific convenience methods
  async scanProductBarcode(): Promise<{
    productId: string;
    format: string;
  } | null> {
    const result = await this.scanBarcode();
    if (!result) return null;

    // Provide haptic feedback on successful scan
    await this.hapticSuccess();

    return {
      productId: result.text,
      format: result.format,
    };
  }

  async notifyLowInventory(
    productName: string,
    quantity: number,
  ): Promise<void> {
    await this.sendLocalNotification(
      "Low Inventory Alert",
      `${productName} is running low (${quantity} left)`,
    );
  }

  async notifyNewOrder(orderTotal: number): Promise<void> {
    await this.hapticSuccess();
    await this.sendLocalNotification(
      "New Order Received!",
      `Order total: $${orderTotal.toFixed(2)}`,
    );
  }

  async saveOfflineCart(cartData: any): Promise<void> {
    await this.setData("offline_cart", cartData);
  }

  async getOfflineCart(): Promise<any> {
    return await this.getData("offline_cart");
  }

  async saveMarketLocation(
    location: LocationData,
    marketName: string,
  ): Promise<void> {
    const savedLocations = (await this.getData("market_locations")) || [];
    savedLocations.push({
      ...location,
      name: marketName,
      timestamp: Date.now(),
    });
    await this.setData("market_locations", savedLocations);
  }

  async getNearbyMarkets(
    currentLocation: LocationData,
    radiusKm: number = 5,
  ): Promise<any[]> {
    const savedLocations = (await this.getData("market_locations")) || [];

    return savedLocations.filter((location: any) => {
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        location.latitude,
        location.longitude,
      );
      return distance <= radiusKm;
    });
  }

  private calculateDistance(
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
}

export const nativeService = new NativeService();
