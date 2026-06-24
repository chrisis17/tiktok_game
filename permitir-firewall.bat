@echo off
chcp 65001 >nul
title Permitir juego en el firewall

:: Comprueba permisos de administrador; si no, se relanza pidiendolos
net session >nul 2>&1
if %errorLevel% neq 0 (
  echo Solicitando permisos de administrador...
  powershell -Command "Start-Process '%~f0' -Verb RunAs"
  exit /b
)

echo ============================================================
echo  Permitiendo el juego en el firewall de Windows...
echo  (puertos 8080 y 8787, para que el celular pueda conectarse)
echo ============================================================
echo.

:: Borra reglas previas con el mismo nombre (por si se ejecuta 2 veces)
netsh advfirewall firewall delete rule name="Guerra Paises 8080" >nul 2>&1
netsh advfirewall firewall delete rule name="Guerra Paises 8787" >nul 2>&1

netsh advfirewall firewall add rule name="Guerra Paises 8080" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="Guerra Paises 8787" dir=in action=allow protocol=TCP localport=8787

echo.
echo ============================================================
echo  LISTO. Ya puedes abrir el juego desde el celular:
echo     http://10.42.0.243:8080
echo  (el celular debe estar en la misma red Wi-Fi)
echo ============================================================
echo.
pause
