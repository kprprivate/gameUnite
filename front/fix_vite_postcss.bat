@echo off
echo =========================================
echo    CORRIGINDO ARQUIVOS PARA VITE
echo =========================================
echo.

echo [1/6] Verificando e corrigindo extensoes de arquivos...

REM Renomear App.js para App.jsx se existir
if exist src\App.js (
  echo Renomeando App.js para App.jsx...
  ren src\App.js App.jsx
)

REM Renomear index.js para main.jsx se existir
if exist src\index.js (
  echo Renomeando index.js para main.jsx...
  ren src\index.js main.jsx
)

echo [2/6] Criando App.jsx basico se nao existir...
if not exist src\App.jsx (
  (
    echo import React from 'react';
    echo import './App.css';
    echo.
    echo function App^(^) {
    echo   return ^(
    echo     ^<div className="App"^>
    echo       ^<header className="bg-blue-600 text-white p-4"^>
    echo         ^<h1 className="text-2xl font-bold"^>GameUnite^</h1^>
    echo         ^<p^>Plataforma de anúncios de jogos^</p^>
    echo       ^</header^>
    echo       ^<main className="p-4"^>
    echo         ^<h2 className="text-xl mb-4"^>Bem-vindo ao GameUnite!^</h2^>
    echo         ^<p^>O frontend está funcionando corretamente.^</p^>
    echo       ^</main^>
    echo     ^</div^>
    echo   ^);
    echo }
    echo.
    echo export default App;
  ) > src\App.jsx
)

echo [3/6] Criando main.jsx corrigido...
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

echo [4/6] Verificando se index.css tem Tailwind...
findstr "@tailwind" src\index.css >nul 2>&1
if errorlevel 1 (
  echo Adicionando Tailwind ao index.css...
  (
    echo @tailwind base;
    echo @tailwind components;
    echo @tailwind utilities;
    echo.
    type src\index.css 2>nul
  ) > src\index.css.tmp
  move src\index.css.tmp src\index.css
)

echo [5/6] Criando App.css basico...
(
echo .App {
echo   text-align: left;
echo }
echo.
echo .container {
echo   max-width: 1200px;
echo   margin: 0 auto;
echo   padding: 0 1rem;
echo }
) > src\App.css

echo [6/6] Verificando index.html no root...
if not exist index.html (
  echo Criando index.html...
  (
    echo ^<!DOCTYPE html^>
    echo ^<html lang="pt-BR"^>
    echo   ^<head^>
    echo     ^<meta charset="UTF-8" /^>
    echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^>
    echo     ^<title^>GameUnite^</title^>
    echo   ^</head^>
    echo   ^<body^>
    echo     ^<div id="root"^>^</div^>
    echo     ^<script type="module" src="/src/main.jsx"^>^</script^>
    echo   ^</body^>
    echo ^</html^>
  ) > index.html
)

echo.
echo =========================================
echo    ARQUIVOS CORRIGIDOS!
echo =========================================
echo.
echo Estrutura criada:
echo - src/App.jsx
echo - src/main.jsx  
echo - src/index.css ^(com Tailwind^)
echo - src/App.css
echo - index.html ^(no root^)
echo.
echo Agora execute: npm run dev
echo.
pause