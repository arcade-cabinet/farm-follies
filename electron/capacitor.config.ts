import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.farmfollies.game",
  appName: "Farm Follies",
  webDir: "dist",
  server: {
    // Enable for development with live reload
    // url: "http://localhost:5173",
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#4A7C59", // Farm green
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#4A7C59",
    },
    ScreenOrientation: {
      // Lock to portrait for the stacking game
      // Can be overridden per-platform in native config
    },
    Haptics: {
      // Use defaults
    },
    Preferences: {
      // Group name for iOS keychain sharing if needed
      // group: "com.farmfollies.game.shared"
    },
  },
  // Android-specific configuration
  android: {
    allowMixedContent: true,
    backgroundColor: "#4A7C59",
  },
  // iOS-specific configuration  
  ios: {
    backgroundColor: "#4A7C59",
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
};

export default config;
