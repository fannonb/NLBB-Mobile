const fs = require('fs');
const path = require('path');

const googleMapsApiKey =
  process.env.GOOGLE_MAPS_API_KEY ??
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  '';
const googleServicesFilePath = path.join(__dirname, 'google-services.json');
const hasGoogleServicesFile = fs.existsSync(googleServicesFilePath);
const appEnv = (process.env.EXPO_PUBLIC_APP_ENV ?? 'development').trim().toLowerCase();
const isProduction = appEnv === 'production';

module.exports = {
  expo: {
    name: 'NLBB',
    slug: 'nlbb',
    scheme: 'nlbb',
    version: '1.0.1',
    // 'default' lets the app follow the device: Android 16 ignores portrait locks on
    // tablets/foldables anyway, so the UI is built to adapt instead of being locked.
    orientation: 'default',
    icon: './assets/icon.png',
    // 'automatic' so App.tsx can switch system UI with the in-app light/dark theme.
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    runtimeVersion: {
      policy: 'fingerprint',
    },
    updates: {
      url: 'https://u.expo.dev/1dba9518-f620-4809-9c25-6d7538549de2',
    },
    splash: {
      image: './assets/transparent_logo.png',
      resizeMode: 'contain',
      backgroundColor: '#FAF9F6',
    },
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey,
      },
    },
    android: {
      package: 'ke.co.nlbb',
      versionCode: 2,
      usesCleartextTraffic: !isProduction,
      ...(hasGoogleServicesFile ? { googleServicesFile: './google-services.json' } : {}),
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      softwareKeyboardLayoutMode: 'resize',
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow NLBB to access your photos so you can update business profile images.',
          cameraPermission: 'Allow NLBB to use your camera so you can take profile and cover photos.',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'Allow NLBB to use your location to show nearby providers on the map.',
        },
      ],
      'expo-notifications',
      // Auth tokens are kept in the Android Keystore / iOS Keychain (src/lib/authSession.ts).
      'expo-secure-store',
      'expo-font',
      'expo-status-bar',
      'expo-splash-screen',
      // Keep the generated Android theme free of Android 15's deprecated edge-to-edge
      // window parameters (see plugins/withEdgeToEdgeStyles.js).
      './plugins/withEdgeToEdgeStyles',
    ],
    extra: {
      eas: {
        projectId: '1dba9518-f620-4809-9c25-6d7538549de2',
      },
    },
  },
};
