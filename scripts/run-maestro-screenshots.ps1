<#
.SYNOPSIS
  Boot an NLBB AVD (if needed) and run Maestro screenshot flows.

.EXAMPLE
  .\scripts\run-maestro-screenshots.ps1 -DeviceLabel phone
  .\scripts\run-maestro-screenshots.ps1 -DeviceLabel tablet -Flow guest
  .\scripts\run-maestro-screenshots.ps1 -DeviceLabel phone -Flow all -SkipEmulatorStart
#>
[CmdletBinding()]
param(
  [ValidateSet('phone', 'tablet')]
  [string]$DeviceLabel = 'phone',

  [ValidateSet('guest', 'customer', 'provider', 'all')]
  [string]$Flow = 'all',

  [switch]$SkipEmulatorStart,

  [string]$AvdPhone = 'NLBB_Phone_Pixel_6',
  [string]$AvdTablet = 'NLBB_Tablet_Pixel_Tablet'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

function Resolve-AndroidSdk {
  $candidates = @(
    $env:ANDROID_HOME,
    $env:ANDROID_SDK_ROOT,
    (Join-Path $env:LOCALAPPDATA 'Android\Sdk')
  ) | Where-Object { $_ -and (Test-Path $_) }
  if (-not $candidates) { throw 'Android SDK not found. Set ANDROID_HOME.' }
  return $candidates[0]
}

function Wait-ForAdbDevice([int]$TimeoutSec = 180) {
  $adb = Join-Path (Resolve-AndroidSdk) 'platform-tools\adb.exe'
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  do {
    $state = & $adb get-state 2>$null
    if ($state -eq 'device') { return $adb }
    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $deadline)
  throw 'Timed out waiting for emulator/device via adb.'
}

function Wait-ForBootCompleted([string]$Adb, [int]$TimeoutSec = 180) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  do {
    $boot = & $Adb shell getprop sys.boot_completed 2>$null
    if (($boot | Out-String).Trim() -eq '1') { return }
    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $deadline)
  throw 'Emulator booted to adb but sys.boot_completed never became 1.'
}

if (-not (Get-Command maestro -ErrorAction SilentlyContinue)) {
  throw @'
Maestro CLI not found on PATH.

Install (pick one):
  1) Scoop:  scoop bucket add extras; scoop install maestro
  2) Docs:   https://docs.maestro.dev/getting-started/installing-maestro

Then reopen this terminal.
'@
}

$avdName = if ($DeviceLabel -eq 'phone') { $AvdPhone } else { $AvdTablet }
$sdk = Resolve-AndroidSdk
$emulator = Join-Path $sdk 'emulator\emulator.exe'
$adb = Join-Path $sdk 'platform-tools\adb.exe'

if (-not $SkipEmulatorStart) {
  $running = & $adb devices 2>$null | Select-String 'emulator-\d+\s+device'
  if (-not $running) {
    if (-not (Test-Path $emulator)) {
      throw "emulator.exe not found at $emulator"
    }
    Write-Host "Starting AVD: $avdName"
    Start-Process -FilePath $emulator -ArgumentList @('-avd', $avdName, '-netdelay', 'none', '-netspeed', 'full') -WindowStyle Normal
  } else {
    Write-Host 'An emulator is already running; reusing it.'
  }
}

Write-Host 'Waiting for device...'
$adb = Wait-ForAdbDevice
Wait-ForBootCompleted $adb
Write-Host 'Emulator ready.'

# Confirm package is installed
$pkg = & $adb shell pm path ke.co.nlbb 2>$null
if (-not $pkg) {
  Write-Warning @'
ke.co.nlbb is not installed on the emulator.

Install a demo-enabled build first, for example:
  $env:EXPO_PUBLIC_ENABLE_DEMO_MODE = 'true'
  npx expo run:android

Or install a local APK, then re-run this script with -SkipEmulatorStart.
'@
}

$outputDir = Join-Path $repoRoot "maestro\output\$DeviceLabel"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$env:DEVICE_LABEL = $DeviceLabel
$flowsDir = Join-Path $repoRoot 'maestro\flows'

$flowFiles = switch ($Flow) {
  'guest' { @('guest-browse-screenshots.yaml') }
  'customer' { @('customer-screenshots.yaml') }
  'provider' { @('provider-screenshots.yaml') }
  'all' {
    @(
      'guest-browse-screenshots.yaml',
      'customer-screenshots.yaml',
      'provider-screenshots.yaml'
    )
  }
}

foreach ($file in $flowFiles) {
  $path = Join-Path $flowsDir $file
  Write-Host ''
  Write-Host "Running Maestro flow: $file (DEVICE_LABEL=$DeviceLabel)"
  & maestro test `
    --config (Join-Path $repoRoot 'maestro\config.yaml') `
    --env "DEVICE_LABEL=$DeviceLabel" `
    --debug-output $outputDir `
    $path
  if ($LASTEXITCODE -ne 0) {
    throw "Maestro failed on $file (exit $LASTEXITCODE). Screenshots / debug: $outputDir"
  }
}

Write-Host ''
Write-Host "Done. Debug/screenshots under: $outputDir"
Write-Host 'Copy the PNG files into Play Console (phone vs tablet listing slots).'
