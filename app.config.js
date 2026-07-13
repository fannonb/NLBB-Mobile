const fs = require('fs');
const path = require('path');

const googleMapsApiKey =
  process.env.GOOGLE_MAPS_API_KEY ??
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  '';
const googleServicesFilePath = path.join(__dirname, 'google-services.json');
const hasGoogleServicesFile = fs.existsSync(googleServicesFilePath);

module.exports = {
  expo: {
    name: 'NLBB',
    slug: 'nlbb',
    scheme: 'nlbb',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
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
      package: 'com.nlbb.mobile',
      versionCode: 1,
      ...(hasGoogleServicesFile ? { googleServicesFile: './google-services.json' } : {}),
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
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
      'expo-font',
      'expo-status-bar',
      'expo-splash-screen',
    ],
    extra: {
      eas: {
        projectId: '1dba9518-f620-4809-9c25-6d7538549de2',
      },
    },
  },
};
