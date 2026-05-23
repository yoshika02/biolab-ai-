@echo off
rem -------------------------------------------------
rem Deploy BioLab AI Frontend to Cloudflare Pages
rem -------------------------------------------------
setlocal

rem -------------------------------------------------
rem 1️⃣ Clean old installation
rem -------------------------------------------------
echo.
echo ==============================
echo Removing old node_modules …
echo ==============================
if exist node_modules (
    rmdir /s /q node_modules
) else (
    echo No existing node_modules folder found.
)

rem -------------------------------------------------
rem 2️⃣ Fresh install – ignore all lifecycle scripts
rem -------------------------------------------------
echo.
echo ==============================
echo Installing packages (ignore scripts) …
echo ==============================
npm install --ignore-scripts
if errorlevel 1 (
    echo *** npm install failed ***
    pause
    exit /b 1
)

rem -------------------------------------------------
rem 3️⃣ (Optional) Generate Prisma client
rem -------------------------------------------------
echo.
echo ==============================
echo Generating Prisma client (errors ignored) …
echo ==============================
npx prisma generate || echo Prisma generation failed – continuing anyway

rem -------------------------------------------------
rem 4️⃣ Verify Next.js CLI is present
rem -------------------------------------------------
echo.
echo ==============================
echo Checking Next.js version …
echo ==============================
npx next --version
if errorlevel 1 (
    echo *** Next.js binary not found – aborting ***
    pause
    exit /b 1
)

rem -------------------------------------------------
rem 5️⃣ Build, export, and deploy to Cloudflare Pages
rem -------------------------------------------------
echo.
echo ==============================
echo Building, exporting, and deploying …
echo ==============================
npm run build && npm run export && npx wrangler pages deploy ./out
if errorlevel 1 (
    echo *** Deployment failed ***
) else (
    echo *** Deployment succeeded! ***
)

pause
endlocal
