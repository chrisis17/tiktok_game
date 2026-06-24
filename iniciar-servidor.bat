@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Servidor TikTok - Guerra de Paises

if not exist node_modules (
  echo ============================================
  echo  Instalando dependencias por primera vez...
  echo ============================================
  call npm install
  echo.
)

echo ============================================
echo  Iniciando servidor puente TikTok LIVE...
echo  Deja esta ventana ABIERTA mientras juegas.
echo ============================================
echo.
node server.js

echo.
echo El servidor se detuvo. Pulsa una tecla para cerrar.
pause >nul
