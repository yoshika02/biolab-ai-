# BioLab AI - Git Push Helper Script
# Run this from: c:\Users\yoshi\Downloads\biolab-ai-main\

Write-Host "=== BioLab AI Git Push Helper ===" -ForegroundColor Cyan
Write-Host ""

# Show current status
Write-Host "[1] Current git status:" -ForegroundColor Yellow
git status
Write-Host ""

# Show current branch
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "[2] Current branch: $branch" -ForegroundColor Yellow
Write-Host ""

# Fetch latest from origin
Write-Host "[3] Fetching from origin..." -ForegroundColor Yellow
git fetch origin
Write-Host ""

# Check if there are diverged commits
Write-Host "[4] Checking diverge state..." -ForegroundColor Yellow
git log --oneline -5
Write-Host ""

# Try a normal push first
Write-Host "[5] Attempting git push origin main..." -ForegroundColor Yellow
git push origin main 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "" 
    Write-Host "SUCCESS: Pushed to origin/main!" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Normal push failed. Checking if we need to merge remote changes..." -ForegroundColor Red
Write-Host ""

# Offer to force push or merge
Write-Host "OPTIONS:" -ForegroundColor Cyan
Write-Host "  [1] Force push (overwrites remote - USE ONLY if you're sure local is correct)"
Write-Host "  [2] Pull + merge remote changes first, then push"
Write-Host "  [3] Exit and handle manually"
Write-Host ""
$choice = Read-Host "Enter your choice (1/2/3)"

switch ($choice) {
    "1" {
        Write-Host "Force pushing to origin/main..." -ForegroundColor Red
        git push origin main --force-with-lease
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Force push successful!" -ForegroundColor Green
        } else {
            Write-Host "Force push failed. Try: git push origin main --force" -ForegroundColor Red
        }
    }
    "2" {
        Write-Host "Pulling from origin/main (rebase)..." -ForegroundColor Yellow
        git pull origin main --rebase
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Pull successful, now pushing..." -ForegroundColor Yellow
            git push origin main
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Push successful!" -ForegroundColor Green
            } else {
                Write-Host "Push failed after pull. Check for conflicts." -ForegroundColor Red
            }
        } else {
            Write-Host "Rebase had conflicts. Resolve them manually then run: git rebase --continue && git push origin main" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host "Exiting. Run git commands manually." -ForegroundColor Yellow
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
    }
}
