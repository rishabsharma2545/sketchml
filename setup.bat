@echo off
echo ========================================
echo    SKETCHML Setup Script (Windows)
echo ========================================
echo.

REM Check Python
echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)
echo [OK] Python found
python --version

REM Check Node
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)
echo [OK] Node.js found
node --version

REM Check npm
echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm.
    pause
    exit /b 1
)
echo [OK] npm found
npm --version

echo.
echo ========================================
echo    Setting up Backend...
echo ========================================

REM Create virtual environment
echo Creating Python virtual environment...
python -m venv venv

REM Install Python dependencies
echo Installing Python dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt

echo.
echo ========================================
echo    Setting up Frontend...
echo ========================================

REM Install Node dependencies
echo Installing Node.js dependencies...
npm install

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo To start the application:
echo.
echo Terminal 1 (Backend):
echo   venv\Scripts\activate
echo   python main.py
echo.
echo Terminal 2 (Frontend):
echo   npm run dev
echo.
echo Then open http://localhost:5173 in your browser
echo.
echo Happy Learning!
echo.
pause