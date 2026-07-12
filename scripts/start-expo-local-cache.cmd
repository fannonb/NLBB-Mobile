@echo off
setlocal

cd /d "%~dp0.."

if not exist ".tmp" mkdir ".tmp"
if exist ".tmp\metro-cache" rmdir /s /q ".tmp\metro-cache"
if not exist ".tmp\metro-cache" mkdir ".tmp\metro-cache"
if not exist ".tmp\expo-cache" mkdir ".tmp\expo-cache"

set "TMP=%CD%\.tmp"
set "TEMP=%CD%\.tmp"
set "EXPO_NO_DOTSLASH=1"
set "EXPO_USE_METRO_WORKSPACE_ROOT=1"

npm.cmd run start
