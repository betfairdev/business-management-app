import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.businessmanager.app',
  appName: 'Business Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#3b82f6",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#3b82f6',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#3b82f6",
      sound: "beep.wav",
    },
    Camera: {
      permissions: {
        camera: "This app needs access to camera to take photos",
        photos: "This app needs access to photo library to select images"
      }
    },
    Filesystem: {
      permissions: {
        publicStorage: "This app needs access to storage to save files"
      }
    },
    Device: {
      permissions: {
        deviceInfo: "This app needs device information for analytics"
      }
    },
    Network: {
      permissions: {
        networkState: "This app needs network state information"
      }
    },
    BarcodeScanner: {
      permissions: {
        camera: "This app needs camera access to scan barcodes"
      }
    }
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
      signingType: 'apksigner'
    }
  },
  ios: {
    scheme: 'Business Manager'
  }
};

export default config;