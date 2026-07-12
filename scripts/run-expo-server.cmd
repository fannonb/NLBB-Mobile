@echo off
cd /d "%~dp0.."

call scripts\start-expo-local-cache.cmd > expo.server.out.log 2> expo.server.err.log
