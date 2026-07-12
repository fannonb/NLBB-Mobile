$ErrorActionPreference = "Stop"

Set-Location -LiteralPath (Resolve-Path "$PSScriptRoot\..")

New-Item -ItemType Directory -Force -Path ".tmp" | Out-Null
Remove-Item -LiteralPath ".tmp\metro-cache" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path ".tmp\metro-cache" | Out-Null
New-Item -ItemType Directory -Force -Path ".tmp\expo-cache" | Out-Null

$env:TMP = (Resolve-Path ".tmp").Path
$env:TEMP = (Resolve-Path ".tmp").Path
$env:EXPO_NO_DOTSLASH = "1"
$env:EXPO_USE_METRO_WORKSPACE_ROOT = "1"

npm.cmd run start
