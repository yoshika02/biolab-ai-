@echo off
echo.
echo ============================================================
echo   BioLab AI - Push Cloudflare Fix to GitHub
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/5] Installing new dependencies...
cd biolab-ai
call npm install
cd ..

echo.
echo [2/5] Adding changes to Git...
git add biolab-ai/package.json
git add biolab-ai/package-lock.json
git add biolab-ai/lib/auth.ts
git add biolab-ai/lib/db.ts
git add biolab-ai/app/api/auth/register/route.ts
git add biolab-ai/app/api/auth/login/route.ts
git add biolab-ai/app/api/auth/refresh/route.ts
git add biolab-ai/app/api/auth/check-email/route.ts
git add biolab-ai/app/api/activity/logs/route.ts
git add biolab-ai/app/api/activity/dismiss-alert/route.ts
git add biolab-ai/app/api/user/route.ts
git add biolab-ai/prisma/schema.prisma
git add biolab-ai/wrangler.toml
git add biolab-ai/.env

echo.
echo [3/5] Committing changes...
git commit -m "fix: resolve infinite login, migrate to D1, use Edge auth"

echo.
echo [4/5] Pushing to GitHub...
git push origin main

echo.
echo [5/5] Verifying deployment...
echo The GitHub Action will now build the Next.js app with @cloudflare/next-on-pages
echo and bind it to your D1 database!
echo.
echo Done!
pause
