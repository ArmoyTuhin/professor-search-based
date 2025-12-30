@echo off
REM Deploy script for Professor Search Frontend (Windows)
REM Usage: deploy.bat <ngrok-url>
REM Example: deploy.bat https://6831da43c3b2.ngrok-free.app

setlocal enabledelayedexpansion

REM Check if ngrok URL is provided
if "%~1"=="" (
    echo Error: Ngrok URL is required
    echo Usage: deploy.bat ^<ngrok-url^>
    echo Example: deploy.bat https://6831da43c3b2.ngrok-free.app
    exit /b 1
)

set NGROK_URL=%~1

REM Remove trailing slash if present
if "%NGROK_URL:~-1%"=="/" set NGROK_URL=%NGROK_URL:~0,-1%

echo.
echo ========================================
echo Starting deployment process...
echo Ngrok URL: %NGROK_URL%
echo ========================================
echo.

REM Get the directory where the script is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Step 1: Update apiConfig.js
echo Step 1: Updating backend URL in apiConfig.js...
set CONFIG_FILE=src\config\apiConfig.js

if not exist "%CONFIG_FILE%" (
    echo Error: %CONFIG_FILE% not found
    exit /b 1
)

REM Use PowerShell to update the file
powershell -Command "(Get-Content '%CONFIG_FILE%') -replace 'export const BACKEND_URL = ''https://[^'']*''', 'export const BACKEND_URL = ''%NGROK_URL%''' | Set-Content '%CONFIG_FILE%'"

if errorlevel 1 (
    echo Error: Failed to update apiConfig.js
    exit /b 1
)

echo [OK] Updated apiConfig.js with new ngrok URL
echo.

REM Step 2: Build the frontend
echo Step 2: Building frontend...
call npm run build

if errorlevel 1 (
    echo Error: Build failed
    exit /b 1
)

echo [OK] Build completed successfully
echo.

REM Step 3: Check if dist folder exists
if not exist "dist" (
    echo Error: dist folder not found after build
    exit /b 1
)

REM Step 4: Copy dist files to parent directory
echo Step 3: Copying dist files to repository root...
set PARENT_DIR=%~dp0..
xcopy /E /Y /I dist\* "%PARENT_DIR%\" >nul

if errorlevel 1 (
    echo Warning: Some files might already exist. Continuing...
)

echo [OK] Files copied to repository root
echo.

REM Step 5: Navigate to parent directory
cd /d "%PARENT_DIR%"

REM Check if git is initialized
if not exist ".git" (
    echo Warning: Not a git repository. Skipping git operations.
    echo [OK] Deployment complete! Files are ready in: %PARENT_DIR%
    exit /b 0
)

REM Step 6: Git operations
echo Step 4: Committing changes...
git add .

REM Check if there are changes to commit
git diff --staged --quiet
if errorlevel 1 (
    git commit -m "Update backend URL to %NGROK_URL% and rebuild"
    echo [OK] Changes committed
) else (
    echo No changes to commit
)
echo.

REM Step 7: Push to GitHub
echo Step 5: Pushing to GitHub...
set /p PUSH_CONFIRM="Push to GitHub? (y/n): "
if /i "%PUSH_CONFIRM%"=="y" (
    git push origin main
    if errorlevel 1 (
        echo Error: Failed to push to GitHub
        exit /b 1
    )
    echo [OK] Successfully pushed to GitHub
) else (
    echo Skipped pushing to GitHub
)

echo.
echo ========================================
echo Deployment complete!
echo ========================================
echo.
echo Next steps:
echo 1. Wait 1-2 minutes for GitHub Pages to update
echo 2. Visit: https://armoytuhin.github.io/professor-search-based/
echo 3. Make sure your backend CORS includes the GitHub Pages URL
echo.

