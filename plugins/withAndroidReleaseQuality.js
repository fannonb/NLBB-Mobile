const { withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

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
    // Applied Gradle scripts have a separate compilation classpath and cannot
    // see AGP's instrumentation API. Compile the guard in the app build script,
    // which already has the Android plugin on its classpath.
    cfg.modResults.contents = cfg.modResults.contents.replace(GUARD_SCRIPT, '');
    const start = '// BEGIN NLBB WINDOW API GUARDS';
    const end = '// END NLBB WINDOW API GUARDS';
    const previous = new RegExp(`${start}[\\s\\S]*?${end}\\n?`, 'g');
    cfg.modResults.contents = cfg.modResults.contents.replace(previous, '');
    const guard = fs.readFileSync(path.join(__dirname, 'android/window-api-guards.gradle'), 'utf8');
    const imports = guard.match(/^import .+$/gm) || [];
    const body = guard.replace(/^import .+\r?\n/gm, '');
    for (const line of imports) {
      if (!cfg.modResults.contents.includes(line)) cfg.modResults.contents = `${line}\n${cfg.modResults.contents}`;
    }
    cfg.modResults.contents += `\n${start}\n${body}\n${end}\n`;
    return cfg;
  });
};
