# Push Notifications Setup

NLBB already has:

- Expo push token registration in the mobile app
- backend storage of push tokens
- backend notification creation plus Expo push sending
- app-side listeners for received and opened notifications

## What still needs to be configured outside the codebase

### 1. Expo / EAS credentials

For Android push notifications to work in real builds, Expo recommends:

- uploading an FCM V1 service account key to EAS credentials
- adding `google-services.json` to the project root
- letting `app.config.js` point Android to that file automatically

This project now auto-detects `google-services.json` when it exists.

### 2. Firebase files

Add this file at the project root:

- `google-services.json`

It should match the Firebase project used for `com.nlbb.mobile`.

### 3. Expo credentials dashboard

In Expo / EAS credentials for the NLBB project:

1. Open Android credentials
2. Upload the FCM V1 service account key JSON
3. Keep the app package as `com.nlbb.mobile`

## How to test after setup

1. Install a development build or preview APK, not Expo Go
2. Sign in on the device
3. Accept notification permission
4. Confirm a push token is stored through `POST /api/auth/push-token`
5. Trigger a backend event that creates a notification
6. Verify:
   - the device receives the push
   - tapping it opens the correct screen
   - the in-app notifications list refreshes

## Current push routing behavior

- customer booking notifications open the Bookings tab
- provider appointment notifications open Appointment Detail when an appointment id exists
- provider subscription notifications open the Subscription screen
- provider review notifications open the Provider Reviews screen
- unknown payloads fall back to the relevant notifications inbox
