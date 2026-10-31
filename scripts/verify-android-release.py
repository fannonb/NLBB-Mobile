"""Inspect the actual AAB, not just the Gradle configuration."""
import argparse
import json
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('bundle')
args = parser.parse_args()
with zipfile.ZipFile(args.bundle) as bundle:
    assert bundle.testzip() is None, 'Damaged AAB archive'
    metadata = json.loads(bundle.read('BUNDLE-METADATA/com.android.tools/r8.json'))
    for option in ['isObfuscationEnabled', 'isOptimizationsEnabled', 'isShrinkingEnabled']:
        assert metadata['options'].get(option) is True, f'R8 release option disabled: {option}'
    stats = metadata.get('stats', {})
    # R8 records the percentages for which each transformation is disabled.
    coverage = {}
    for name in ['Obfuscation', 'Optimization', 'Shrinking']:
        disabled = stats.get(f'no{name}Percentage')
        assert isinstance(disabled, (int, float)), f'Missing R8 statistics: {name}'
        coverage[name.lower()] = round(100 - disabled, 2)
        assert coverage[name.lower()] >= 25, f'Insufficient R8 {name.lower()} coverage'
    dex_bytes = sum(entry.file_size for entry in bundle.infolist() if entry.filename.endswith('.dex'))
    assert 'BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map' in bundle.namelist(), 'Missing crash deobfuscation mapping'
    print(json.dumps({'r8Version': metadata['version'], 'coverage': coverage, 'dexBytes': dex_bytes, 'verified': True}, indent=2))
