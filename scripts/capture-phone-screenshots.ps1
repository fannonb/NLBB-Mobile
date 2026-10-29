# Capture Play Store phone screenshots via adb (Pixel_9 / emulator-5556)
param(
  [string]$Serial = 'emulator-5556',
  [string]$Package = 'com.nlbb.mobile'
)

$ErrorActionPreference = 'Stop'
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -ErrorAction SilentlyContinue
if (-not $repo) { $repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path }
# script lives in scripts/ → repo root is parent
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$outDir = Join-Path $repo 'maestro\output\phone\play-console'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$tmp = Join-Path $env:TEMP 'nlbb-phone-ui.xml'

function Adb { & $adb -s $Serial @args }

function Dump-Ui {
  Adb shell uiautomator dump /sdcard/nlbb_ui.xml | Out-Null
  Adb pull /sdcard/nlbb_ui.xml $tmp | Out-Null
  Get-Content $tmp -Raw
}

function Find-Center([string]$xml, [string]$needle) {
  # Match node containing text or content-desc, extract bounds
  $pattern = "text=`"$([regex]::Escape($needle))`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]"|content-desc=`"$([regex]::Escape($needle))`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]"|bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"[^>]*(?:text|content-desc)=`"$([regex]::Escape($needle))`""
  # Simpler: find element blocks with the text then bounds nearby
  if ($xml -match "(?s)bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"[^>]*text=`"$([regex]::Escape($needle))`"" -or
      $xml -match "(?s)text=`"$([regex]::Escape($needle))`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"") {
    $x1 = [int]$Matches[1]; $y1 = [int]$Matches[2]; $x2 = [int]$Matches[3]; $y2 = [int]$Matches[4]
    return @{ X = [int](($x1 + $x2) / 2); Y = [int](($y1 + $y2) / 2) }
  }
  return $null
}

function Tap-Text([string]$label, [int]$retries = 8) {
  for ($i = 0; $i -lt $retries; $i++) {
    $xml = Dump-Ui
    $pt = Find-Center $xml $label
    if ($pt) {
      Write-Host "Tap '$label' at $($pt.X),$($pt.Y)"
      Adb shell input tap $pt.X $pt.Y
      Start-Sleep -Seconds 2
      return $true
    }
    Start-Sleep -Seconds 2
  }
  Write-Warning "Could not find '$label'"
  return $false
}

function Wait-Text([string[]]$labels, [int]$timeoutSec = 90) {
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while ((Get-Date) -lt $deadline) {
    $xml = Dump-Ui
    foreach ($l in $labels) {
      if ($xml -match [regex]::Escape("text=`"$l`"") -or $xml -match [regex]::Escape("content-desc=`"$l`"")) {
        Write-Host "Found '$l'"
        return $l
      }
    }
    Start-Sleep -Seconds 2
  }
  throw "Timed out waiting for: $($labels -join ', ')"
}

function Save-Shot([string]$name) {
  $path = Join-Path $outDir $name
  # Use cmd redirect so PNG binary is not corrupted by PowerShell encoding
  cmd /c "`"$adb`" -s $Serial exec-out screencap -p > `"$path`""
  $len = (Get-Item $path).Length
  Write-Host "Saved $name ($([math]::Round($len/1KB)) KB)"
}

Write-Host "Preparing $Package on $Serial..."
Adb shell am force-stop $Package
# Avoid pm clear — it can hang on some emulators; wipe via app data only if needed
Adb shell am start -n "$Package/.MainActivity"
Start-Sleep -Seconds 8

# Dismiss common system dialogs
foreach ($btn in @('While using the app', 'Allow', 'ONLY THIS TIME', 'No thanks', "Don't allow")) {
  Tap-Text $btn 2 | Out-Null
}

Wait-Text @('Skip', 'Next', 'Find local services', 'Discover beauty near you') 90 | Out-Null
if (-not (Tap-Text 'Skip' 5)) {
  # Advance onboarding via Next, then guest
  Tap-Text 'Next' 3 | Out-Null
  Tap-Text 'Next' 3 | Out-Null
  Tap-Text 'Next' 3 | Out-Null
  Tap-Text 'Browse as Guest' 5 | Out-Null
}

foreach ($btn in @('While using the app', 'Allow', 'No thanks')) { Tap-Text $btn 2 | Out-Null }

Wait-Text @('Discover beauty near you', 'Home', 'Services', 'Near you', 'Explore') 60 | Out-Null
foreach ($btn in @('No thanks', 'While using the app', 'Allow')) { Tap-Text $btn 2 | Out-Null }
Save-Shot 'phone_01_guest_home.png'

Tap-Text 'Explore' 8 | Out-Null
Start-Sleep -Seconds 2
foreach ($btn in @('No thanks', 'Allow')) { Tap-Text $btn 2 | Out-Null }
Save-Shot 'phone_02_guest_explore.png'

if (Tap-Text 'Obongita Hair Den' 6) {
  Start-Sleep -Seconds 2
  foreach ($btn in @('No thanks', 'Allow')) { Tap-Text $btn 2 | Out-Null }
  Save-Shot 'phone_03_provider_details.png'
  # back
  Adb shell input keyevent 4
  Start-Sleep -Seconds 1
}

Tap-Text 'Profile' 8 | Out-Null
Start-Sleep -Seconds 2
Save-Shot 'phone_05_guest_profile.png'

Write-Host ''
Write-Host "Done. Files in $outDir"
Get-ChildItem $outDir -Filter 'phone_*.png' | Format-Table Name, Length -AutoSize
