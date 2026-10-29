<#
.SYNOPSIS
  Create phone + tablet Android Virtual Devices for NLBB Play Store screenshots.

.NOTES
  Requires Android SDK (Android Studio). Uses google_apis system image API 34 by default.
#>
[CmdletBinding()]
param(
  [string]$ApiLevel = '34',
  [string]$Abi = 'x86_64',
  [string]$Tag = 'google_apis'
)

$ErrorActionPreference = 'Stop'

function Resolve-AndroidSdk {
  $candidates = @(
    $env:ANDROID_HOME,
    $env:ANDROID_SDK_ROOT,
    (Join-Path $env:LOCALAPPDATA 'Android\Sdk'),
    (Join-Path $env:USERPROFILE 'AppData\Local\Android\Sdk')
  ) | Where-Object { $_ -and (Test-Path $_) }

  if (-not $candidates) {
    throw 'Android SDK not found. Install Android Studio and set ANDROID_HOME.'
  }
  return $candidates[0]
}

function Find-SdkTool([string]$SdkRoot, [string]$Name) {
  $paths = @(
    (Join-Path $SdkRoot "cmdline-tools\latest\bin\$Name.bat"),
    (Join-Path $SdkRoot "cmdline-tools\bin\$Name.bat")
  ) + (Get-ChildItem -Path (Join-Path $SdkRoot 'cmdline-tools') -Recurse -Filter "$Name.bat" -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty FullName)

  $hit = $paths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
  if (-not $hit) {
    throw "Could not find $Name.bat under $SdkRoot. Install Android SDK Command-line Tools."
  }
  return $hit
}

$sdk = Resolve-AndroidSdk
$sdkmanager = Find-SdkTool $sdk 'sdkmanager'
$avdmanager = Find-SdkTool $sdk 'avdmanager'
$emulator = Join-Path $sdk 'emulator\emulator.exe'
$package = "system-images;android-$ApiLevel;$Tag;$Abi"

Write-Host "SDK: $sdk"
Write-Host "Installing system image: $package"
& $sdkmanager --install $package | Out-Host

$devices = @(
  @{ Name = 'NLBB_Phone_Pixel_6'; Device = 'pixel_6'; Label = 'phone' },
  @{ Name = 'NLBB_Tablet_Pixel_Tablet'; Device = 'pixel_tablet'; Label = 'tablet' }
)

# Fallback tablet device id if pixel_tablet is missing on older SDKs
$deviceList = & $avdmanager list device 2>&1 | Out-String
if ($deviceList -notmatch 'pixel_tablet') {
  Write-Host 'pixel_tablet not found; falling back to Nexus 10 for tablet AVD.'
  $devices[1].Device = 'Nexus 10'
}

foreach ($d in $devices) {
  Write-Host "Creating AVD $($d.Name) ($($d.Device))..."
  $yes = "no`n"
  $yes | & $avdmanager create avd `
    --force `
    --name $d.Name `
    --package $package `
    --device $d.Device `
    --tag $Tag `
    --abi $Abi 2>&1 | Out-Host

  # Prefer software keyboard off / cold boot friendly defaults
  $configIni = Join-Path $env:USERPROFILE ".android\avd\$($d.Name).avd\config.ini"
  if (Test-Path $configIni) {
    $cfg = Get-Content $configIni -Raw
    if ($cfg -notmatch 'hw\.keyboard') {
      Add-Content $configIni "hw.keyboard=yes"
    }
    if ($d.Label -eq 'tablet' -and $cfg -notmatch 'hw\.lcd\.density') {
      Add-Content $configIni "hw.lcd.density=240"
    }
  }
}

Write-Host ''
Write-Host 'AVDs ready:'
& $emulator -list-avds
Write-Host ''
Write-Host 'Start phone:  & "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd NLBB_Phone_Pixel_6'
Write-Host 'Start tablet: & "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd NLBB_Tablet_Pixel_Tablet'
Write-Host 'Then run:     .\scripts\run-maestro-screenshots.ps1 -DeviceLabel phone'
