# Android release compatibility checks

`withAndroidReleaseQuality.js` installs the Gradle instrumentation and explicitly enables R8 minification, optimized ProGuard rules, and resource shrinking during Expo prebuild. Changes are applied to compiled application and dependency classes, including prebuilt AARs.

`window-api-guards.gradle` gates deprecated `android.view.Window` color setters/getters, decor fitting, and status-bar contrast enforcement behind `SDK_INT < 35`. Android 15+ uses enforced edge-to-edge behavior and transparent system bars. Supported navigation-bar contrast controls and the app's existing safe-area handling remain in use. Older Android versions retain their original calls. Argument evaluation and null-receiver exceptions are preserved.

Run `npm run test:android:guards` with JDK 17+ to test the actual bytecode visitor on API levels 24, 29, 30, 34, 35, 36, and 37. Test-only Groovy/ASM dependencies are version-pinned and checksum-verified. The same fixture tests run automatically before each native build. Fixture classes are compiled into a separate build directory and are not included in the app.

Production EAS builds run `scripts/verify-android-release.py` against the generated AAB through the `eas-build-on-success` hook. It checks ZIP integrity, R8 options, transformation coverage (at least 25% each), DEX size, and the crash deobfuscation mapping.

## Google Play interpretation

The SDK checks fix runtime use of deprecated APIs on Android 15+. Legacy method references remain in the bundle for older devices. A static Play Console warning may therefore still mention those compatibility paths. A clean local compilation is not proof that Play has cleared a warning; inspect Play Console's report for the uploaded version code. Do not remove old-device functionality or use reflection merely to hide method names from the scanner.
