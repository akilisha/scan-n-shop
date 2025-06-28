import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tradehub.app",
  appName: "TradeHub",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Camera: {
      permissions: {
        camera: "Camera access is needed to scan product barcodes",
      },
    },
    Geolocation: {
      permissions: {
        location: "Location access helps find nearby markets and customers",
      },
    },
  },
};

export default config;
