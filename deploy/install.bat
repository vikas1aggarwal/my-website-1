@echo off
setlocal enabledelayedexpansion

REM Real Estate ERP - Automated Installation Script for Windows
REM This script will install and configure the entire application

echo 🚀 Real Estate ERP - Automated Installation
echo ==========================================

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [ERROR] This script should not be run as administrator
    pause
    exit /b 1
)

REM Get current directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
cd /d "%PROJECT_ROOT%"

echo [INFO] Project root: %PROJECT_ROOT%

REM Check system requirements
echo [INFO] Checking system requirements...

REM Check Python version
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [SUCCESS] Python %PYTHON_VERSION% found

REM Check Node.js version
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js %NODE_VERSION% found

REM Check npm
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo [SUCCESS] npm found

REM Create virtual environment
echo [INFO] Setting up Python virtual environment...

if not exist "venv" (
    python -m venv venv
    echo [SUCCESS] Virtual environment created
) else (
    echo [WARNING] Virtual environment already exists
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

REM Install Python dependencies
echo [INFO] Installing Python dependencies...
pip install -r requirements_simple.txt

echo [SUCCESS] Python dependencies installed

REM Install Node.js dependencies
echo [INFO] Installing Node.js dependencies...
npm install

echo [SUCCESS] Node.js dependencies installed

REM Create environment file
echo [INFO] Creating environment configuration...
if not exist ".env" (
    echo # Real Estate ERP Environment Configuration > .env
    echo DATABASE_URL=sqlite:///./realestate.db >> .env
    echo SECRET_KEY=your-secret-key-here >> .env
    echo ENVIRONMENT=production >> .env
    echo ALLOWED_HOSTS=localhost,127.0.0.1 >> .env
    echo CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 >> .env
    echo [SUCCESS] Environment file created
) else (
    echo [WARNING] Environment file already exists
)

REM Initialize database
echo [INFO] Initializing database...
if exist "init_sqlite.py" (
    python init_sqlite.py
    echo [SUCCESS] Database initialized
) else (
    echo [WARNING] Database initialization script not found
)

REM Build frontend
echo [INFO] Building frontend for production...
npm run build

echo [SUCCESS] Frontend built successfully

REM Create startup scripts
echo [INFO] Creating startup scripts...

REM Backend startup script
echo @echo off > start_backend.bat
echo cd /d "%%~dp0" >> start_backend.bat
echo call venv\Scripts\activate.bat >> start_backend.bat
echo for /f "tokens=*" %%a in (.env) do set %%a >> start_backend.bat
echo uvicorn simple_app:app --host 0.0.0.0 --port 8000 --workers 4 >> start_backend.bat
echo pause >> start_backend.bat

REM Frontend startup script
echo @echo off > start_frontend.bat
echo cd /d "%%~dp0" >> start_frontend.bat
echo npx serve -s build -l 3000 >> start_frontend.bat
echo pause >> start_frontend.bat

REM Combined startup script
echo @echo off > start_app.bat
echo cd /d "%%~dp0" >> start_app.bat
echo echo 🚀 Starting Real Estate ERP Application... >> start_app.bat
echo echo. >> start_app.bat
echo echo Starting backend... >> start_app.bat
echo start "Backend" cmd /k "call start_backend.bat" >> start_app.bat
echo timeout /t 3 /nobreak ^>nul >> start_app.bat
echo echo Starting frontend... >> start_app.bat
echo start "Frontend" cmd /k "call start_frontend.bat" >> start_app.bat
echo echo. >> start_app.bat
echo echo ✅ Application started successfully! >> start_app.bat
echo echo Backend: http://localhost:8000 >> start_app.bat
echo echo Frontend: http://localhost:3000 >> start_app.bat
echo echo Health Check: http://localhost:8000/health >> start_app.bat
echo echo. >> start_app.bat
echo echo Press any key to exit... >> start_app.bat
echo pause ^>nul >> start_app.bat

echo [SUCCESS] Startup scripts created

REM Create Docker deployment files
echo [INFO] Creating Docker deployment files...

REM Docker Compose file
echo version: '3.8' > docker-compose.prod.yml
echo. >> docker-compose.prod.yml
echo services: >> docker-compose.prod.yml
echo   backend: >> docker-compose.prod.yml
echo     build: >> docker-compose.prod.yml
echo       context: . >> docker-compose.prod.yml
echo       dockerfile: Dockerfile.backend >> docker-compose.prod.yml
echo     ports: >> docker-compose.prod.yml
echo       - "8000:8000" >> docker-compose.prod.yml
echo     environment: >> docker-compose.prod.yml
echo       - DATABASE_URL=sqlite:///./realestate.db >> docker-compose.prod.yml
echo       - SECRET_KEY=${SECRET_KEY} >> docker-compose.prod.yml
echo       - ENVIRONMENT=production >> docker-compose.prod.yml
echo     volumes: >> docker-compose.prod.yml
echo       - ./data:/app/data >> docker-compose.prod.yml
echo     restart: unless-stopped >> docker-compose.prod.yml
echo. >> docker-compose.prod.yml
echo   frontend: >> docker-compose.prod.yml
echo     files: >> docker-compose.prod.yml
echo       context: . >> docker-compose.prod.yml
echo       dockerfile: Dockerfile.frontend >> docker-compose.prod.yml
echo     ports: >> docker-compose.prod.yml
echo       - "80:80" >> docker-compose.prod.yml
echo     depends_on: >> docker-compose.prod.yml
echo       - backend >> docker-compose.prod.yml
echo     restart: unless-stopped >> docker-compose.prod.yml
echo. >> docker-compose.prod.yml
echo volumes: >> docker-compose.prod.yml
echo   data: >> docker-compose.prod.yml

echo [SUCCESS] Docker deployment files created

REM Final instructions
echo.
echo 🎉 Installation completed successfully!
echo =====================================
echo.
echo 📁 Project location: %PROJECT_ROOT%
echo 🐍 Python virtual environment: %PROJECT_ROOT%\venv
echo 📦 Node modules: %PROJECT_ROOT%\node_modules
echo 🏗️  Frontend build: %PROJECT_ROOT%\build
echo.
echo 🚀 Quick Start Options:
echo 1. Start both services: start_app.bat
echo 2. Start backend only: start_backend.bat
echo 3. Start frontend only: start_frontend.bat
echo 4. Docker deployment: docker-compose -f docker-compose.prod.yml up -d
echo.
echo 🌐 Access URLs:
echo    Backend API: http://localhost:8000
echo    Frontend App: http://localhost:3000
echo    API Docs: http://localhost:8000/docs
echo    Health Check: http://localhost:8000/health
echo.
echo 📚 Next Steps:
echo 1. Configure your domain in .env file
echo 2. Set up SSL certificates for production
echo 3. Configure firewall rules
echo 4. Set up database backups
echo.
echo For more information, check the README.md file
echo.
echo [SUCCESS] Installation script completed!
pause
