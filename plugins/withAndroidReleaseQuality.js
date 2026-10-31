const { withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');

const GUARD_SCRIPT = "apply from: new File(rootDir.parentFile, 'plugins/android/window-api-guards.gradle')";

module.exports = function withAndroidReleaseQuality(config) {
  config = withGradleProperties(config, (cfg) => {
    for (const key of ['android.enableMinifyInReleaseBuilds', 'android.enableShrinkResourcesInReleaseBuilds']) {
      const existing = cfg.modResults.find((entry) => entry.type === 'property' && entry.key === key);
      if (existing) existing.value = 'true';
      else cfg.modResults.push({ type: 'property', key, value: 'true' });
    }
    return cfg;
  });
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') throw new Error('Android release guards require a Groovy app/build.gradle');
    cfg.modResults.contents = cfg.modResults.contents.replaceAll('"proguard-android.txt"', '"proguard-android-optimize.txt"');
    if (!cfg.modResults.contents.includes(GUARD_SCRIPT)) cfg.modResults.contents += `\n// NLBB Android 15+ compatibility and release checks.\n${GUARD_SCRIPT}\n`;
    return cfg;
  });
};
