@echo off
setlocal enabledelayedexpansion

echo ============================================
echo  BioLab AI - Fix Lock File and Deploy
echo ============================================
echo.

cd /d "%~dp0"

echo [Step 1] Regenerating package-lock.json inside biolab-ai...
echo.
cd biolab-ai

echo Running: npm install --package-lock-only
call npm install --package-lock-only
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARN] --package-lock-only failed, trying full npm install...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed! Check your network and Node.js version.
        pause
        exit /b 1
    )
)

echo.
echo [Step 2] Verifying package-lock.json was updated...
dir package-lock.json
echo.

cd ..

echo [Step 3] Staging all changes for git...
git add biolab-ai/package-lock.json
git add biolab-ai/next.config.ts
git add biolab-ai/lib/db.ts
git add .github/workflows/deploy-frontend.yml
echo.

echo [Step 4] Checking git status...
git status
echo.

echo [Step 5] Committing changes...
git commit -m "fix: regenerate package-lock.json and fix CI/CD deployment pipeline"
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Nothing new to commit, or commit failed. Continuing to push...
)
echo.

echo [Step 6] Fetching remote state...
git fetch origin
echo.

echo [Step 7] Pushing to origin/main...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARN] Normal push failed. Trying rebase pull then push...
    git pull origin main --rebase
    git push origin main
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Push still failed. Try running manually:
        echo   git push origin main --force-with-lease
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo  SUCCESS! Changes pushed to GitHub.
echo  GitHub Actions will now auto-deploy to
echo  Cloudflare Workers.
echo ============================================
echo.
pause
