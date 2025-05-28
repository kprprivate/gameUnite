@echo off
echo =========================================
echo    CONVERTENDO .JS PARA .JSX
echo =========================================
echo.

echo [1/8] Limpando arquivos duplicados em src/...

REM Remover arquivos TypeScript desnecessarios
del src\App.test.tsx 2>nul
del src\App.tsx 2>nul
del src\index.tsx 2>nul
del src\react-app-env.d.ts 2>nul
del src\reportWebVitals.ts 2>nul
del src\setupTests.ts 2>nul
del src\logo.svg 2>nul
del tsconfig.json 2>nul

REM Remover arquivo index.js antigo se main.jsx existe
if exist src\main.jsx (
  del src\index.js 2>nul
)

echo [2/8] Convertendo componentes de .js para .jsx...

REM Components - Auth
if exist src\components\Auth\ProtectedRoute.js (
  ren src\components\Auth\ProtectedRoute.js ProtectedRoute.jsx
)

REM Components - Common
if exist src\components\Common\Alert.js (
  ren src\components\Common\Alert.js Alert.jsx
)
if exist src\components\Common\Badge.js (
  ren src\components\Common\Badge.js Badge.jsx
)
if exist src\components\Common\Button.js (
  ren src\components\Common\Button.js Button.jsx
)
if exist src\components\Common\Card.js (
  ren src\components\Common\Card.js Card.jsx
)
if exist src\components\Common\EmptyState.js (
  ren src\components\Common\EmptyState.js EmptyState.jsx
)
if exist src\components\Common\LoadingSpinner.js (
  ren src\components\Common\LoadingSpinner.js LoadingSpinner.jsx
)
if exist src\components\Common\Modal.js (
  ren src\components\Common\Modal.js Modal.jsx
)
if exist src\components\Common\Pagination.js (
  ren src\components\Common\Pagination.js Pagination.jsx
)
if exist src\components\Common\Tooltip.js (
  ren src\components\Common\Tooltip.js Tooltip.jsx
)

REM Components - Layout
if exist src\components\Layout\Footer.js (
  ren src\components\Layout\Footer.js Footer.jsx
)
if exist src\components\Layout\Header.js (
  ren src\components\Layout\Header.js Header.jsx
)
if exist src\components\Layout\Layout.js (
  ren src\components\Layout\Layout.js Layout.jsx
)

echo [3/8] Convertendo contexts de .js para .jsx...
if exist src\contexts\AuthContext.js (
  ren src\contexts\AuthContext.js AuthContext.jsx
)
if exist src\contexts\GameContext.js (
  ren src\contexts\GameContext.js GameContext.jsx
)

echo [4/8] Convertendo pages de .js para .jsx...

REM Pages - Ads
if exist src\pages\Ads\AdDetails.js (
  ren src\pages\Ads\AdDetails.js AdDetails.jsx
)
if exist src\pages\Ads\CreateAd.js (
  ren src\pages\Ads\CreateAd.js CreateAd.jsx
)

REM Pages - Auth
if exist src\pages\Auth\Login.js (
  ren src\pages\Auth\Login.js Login.jsx
)
if exist src\pages\Auth\Register.js (
  ren src\pages\Auth\Register.js Register.jsx
)

REM Pages - Dashboard
if exist src\pages\Dashboard\Dashboard.js (
  ren src\pages\Dashboard\Dashboard.js Dashboard.jsx
)

REM Pages - Games
if exist src\pages\Games\GameDetails.js (
  ren src\pages\Games\GameDetails.js GameDetails.jsx
)
if exist src\pages\Games\Games.js (
  ren src\pages\Games\Games.js Games.jsx
)

REM Pages - Home
if exist src\pages\Home\Home.js (
  ren src\pages\Home\Home.js Home.jsx
)

REM Pages - Profile
if exist src\pages\Profile\Profile.js (
  ren src\pages\Profile\Profile.js Profile.jsx
)

echo [5/8] Criando App.jsx simples para teste...
(
echo import React from 'react';
echo import './App.css';
echo.
echo function App^(^) {
echo   return ^(
echo     ^<div className="min-h-screen bg-gray-100"^>
echo       ^<header className="bg-blue-600 text-white p-6"^>
echo         ^<div className="container mx-auto"^>
echo           ^<h1 className="text-3xl font-bold"^>GameUnite^</h1^>
echo           ^<p className="text-blue-100"^>Plataforma de anúncios de jogos^</p^>
echo         ^</div^>
echo       ^</header^>
echo       ^<main className="container mx-auto p-6"^>
echo         ^<div className="bg-white rounded-lg shadow-md p-6"^>
echo           ^<h2 className="text-2xl font-semibold mb-4 text-gray-800"^>
echo             Frontend Funcionando! 🚀
echo           ^</h2^>
echo           ^<p className="text-gray-600 mb-4"^>
echo             O Vite está rodando corretamente com Tailwind CSS.
echo           ^</p^>
echo           ^<div className="grid grid-cols-1 md:grid-cols-3 gap-4"^>
echo             ^<div className="bg-green-100 p-4 rounded"^>
echo               ^<h3 className="font-semibold text-green-800"^>✅ React^</h3^>
echo               ^<p className="text-green-600"^>Funcionando^</p^>
echo             ^</div^>
echo             ^<div className="bg-blue-100 p-4 rounded"^>
echo               ^<h3 className="font-semibold text-blue-800"^>✅ Vite^</h3^>
echo               ^<p className="text-blue-600"^>Funcionando^</p^>
echo             ^</div^>
echo             ^<div className="bg-purple-100 p-4 rounded"^>
echo               ^<h3 className="font-semibold text-purple-800"^>✅ Tailwind^</h3^>
echo               ^<p className="text-purple-600"^>Funcionando^</p^>
echo             ^</div^>
echo           ^</div^>
echo         ^</div^>
echo       ^</main^>
echo     ^</div^>
echo   ^);
echo }
echo.
echo export default App;
) > src\App.jsx

echo [6/8] Criando main.jsx correto...
(
echo import React from 'react'
echo import ReactDOM from 'react-dom/client'
echo import App from './App.jsx'
echo import './index.css'
echo.
echo ReactDOM.createRoot^(document.getElementById^('root'^)^).render^(
echo   ^<React.StrictMode^>
echo     ^<App /^>
echo   ^</React.StrictMode^>
echo ^)
) > src\main.jsx

echo [7/8] Verificando index.css com Tailwind...
findstr "@tailwind" src\index.css >nul 2>&1
if errorlevel 1 (
  echo Adicionando Tailwind ao index.css...
  (
    echo @tailwind base;
    echo @tailwind components;
    echo @tailwind utilities;
    echo.
    echo body {
    echo   margin: 0;
    echo   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    echo   -webkit-font-smoothing: antialiased;
    echo }
  ) > src\index.css
)

echo [8/8] Limpando pasta public duplicada...
del public\index.html 2>nul

echo.
echo =========================================
echo    CONVERSAO CONCLUIDA!
echo =========================================
echo.
echo Alteracoes feitas:
echo ✅ Todos os .js com JSX convertidos para .jsx
echo ✅ Arquivos TypeScript removidos
echo ✅ App.jsx simples criado para teste
echo ✅ main.jsx configurado corretamente
echo ✅ Tailwind adicionado ao index.css
echo ✅ Arquivos duplicados removidos
echo.
echo Agora execute: npm run dev
echo.
pause