# NLBB Maestro screenshots (phone + tablet AVDs)

Capture Play Store screenshots on Android emulators — no physical devices required.

## Prerequisites

1. **Android Studio** with SDK Platform Tools + Emulator  
2. **Maestro CLI** — https://docs.maestro.dev/getting-started/installing-maestro  
   - Scoop: `scoop bucket add extras; scoop install maestro`  
3. App installed as **`ke.co.nlbb`** (not Expo Go), with demo mode on:

```powershell
$env:EXPO_PUBLIC_ENABLE_DEMO_MODE = 'true'
$env:EXPO_PUBLIC_APP_ENV = 'development'
npx expo run:android
```

Demo accounts (offline): `demo@customer.com` / `demo@provider.com` — password `demo1234`.

## One-time: create AVDs

```powershell
.\scripts\create-avds.ps1
```

Creates:

| AVD name | Role |
|----------|------|
| `NLBB_Phone_Pixel_6` | Phone screenshots |
| `NLBB_Tablet_Pixel_Tablet` | Tablet screenshots |

## Capture screenshots

```powershell
# Phone — guest + customer + provider flows
.\scripts\run-maestro-screenshots.ps1 -DeviceLabel phone

# Tablet
.\scripts\run-maestro-screenshots.ps1 -DeviceLabel tablet

# Single flow
.\scripts\run-maestro-screenshots.ps1 -DeviceLabel phone -Flow guest
.\scripts\run-maestro-screenshots.ps1 -DeviceLabel phone -Flow customer
.\scripts\run-maestro-screenshots.ps1 -DeviceLabel phone -Flow provider

# Emulator already running
.\scripts\run-maestro-screenshots.ps1 -DeviceLabel phone -SkipEmulatorStart
```

Or via npm:

```powershell
npm run screenshots:phone
npm run screenshots:tablet
```

## Flows

| File | What it captures |
|------|------------------|
| `flows/guest-browse-screenshots.yaml` | Home, Explore, provider details, guest Profile |
| `flows/customer-screenshots.yaml` | Login, Home, Explore, booking sheet, Bookings, Profile |
| `flows/provider-screenshots.yaml` | Provider login, Today, Appointments, Services, Profile |

PNGs land under `maestro/output/<phone|tablet>/` (gitignored). Filenames are prefixed with `phone_` or `tablet_`.

## Play Console tips

- Phone listing: use `phone_*.png` (at least 2)  
- Tablet listing: use `tablet_*.png`  
- Prefer guest/customer Home, Explore, provider details, and provider Today  
- Crop status bar only if Google’s size requirements need it; don’t fake tablet from phone shots  

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ke.co.nlbb` not installed | `npx expo run:android` with demo env (see above) |
| No “Fill customer/provider demo” | Build has demo mode off — set `EXPO_PUBLIC_ENABLE_DEMO_MODE=true` and rebuild |
| Onboarding stuck | Flow taps Skip / Browse as Guest; clear app data: `adb shell pm clear ke.co.nlbb` |
| Wrong appId | Don’t use Expo Go; flows target `ke.co.nlbb` |
| Maestro not found | Install CLI and reopen the terminal |
