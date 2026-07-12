@echo off
cd /d "%~dp0.."

npx.cmd expo start --offline --max-workers 1 --port 8081 > "D:\App Projects\Sean NLBB\NLBB\expo.server.out.log" 2> "D:\App Projects\Sean NLBB\NLBB\expo.server.err.log"
