const { withAndroidStyles, withAndroidManifest } = require('@expo/config-plugins');

/**
 * Android 15/16 build-output clean-up for edge-to-edge + large screens.
 *
 * 1. Deprecated edge-to-edge window parameters
 *    `android:statusBarColor` / `android:navigationBarColor` are deprecated in Android 15
 *    (API 35), ignored by the platform, and reported by Google Play as "deprecated
 *    parameters for edge-to-edge". Expo's prebuild step always writes both as
 *    `@android:color/transparent` (see @expo/config-plugins SystemBars), so they are
 *    stripped here after that step runs. Bar icon contrast is handled at runtime by
 *    `expo-status-bar` and React Native's edge-to-edge support; content insets come from
 *    `react-native-safe-area-context`.
 *
 * 2. Redundant orientation attribute
 *    `orientation: 'default'` makes prebuild emit `android:screenOrientation="unspecified"`,
 *    which is the platform default. The attribute is dropped so the manifest carries no
 *    orientation declaration at all (Android 16 ignores orientation locks on large screens).
 */
const DEPRECATED_WINDOW_ITEMS = ['android:statusBarColor', 'android:navigationBarColor'];

function stripDeprecatedWindowParams(config) {
  return withAndroidStyles(config, (cfg) => {
    const styles = cfg.modResults?.resources?.style ?? [];

    for (const style of styles) {
      if (!Array.isArray(style.item)) {
        continue;
      }
      style.item = style.item.filter((entry) => {
        const name = entry?.$?.name;
        return !DEPRECATED_WINDOW_ITEMS.includes(name);
      });
    }

    return cfg;
  });
}

function stripUnspecifiedOrientation(config) {
  return withAndroidManifest(config, (cfg) => {
    const activities = cfg.modResults?.manifest?.application?.[0]?.activity ?? [];

    for (const activity of activities) {
      if (activity?.$?.['android:screenOrientation'] === 'unspecified') {
        delete activity.$['android:screenOrientation'];
      }
    }

    return cfg;
  });
}

module.exports = function withEdgeToEdgeStyles(config) {
  return stripUnspecifiedOrientation(stripDeprecatedWindowParams(config));
};
