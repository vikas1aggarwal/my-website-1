#!/bin/bash

# Real Estate ERP - Automated Installation Script
# This script will install and configure the entire application

set -e  # Exit on any error

echo "🚀 Real Estate ERP - Automated Installation"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_status "Project root: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# Check system requirements
print_status "Checking system requirements..."

# Check Python version
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
    print_error "Python 3.8+ is required. Current version: $PYTHON_VERSION"
    exit 1
fi

print_success "Python $PYTHON_VERSION found"

# Check Node.js version
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)

if [ "$NODE_MAJOR" -lt 16 ]; then
    print_error "Node.js 16+ is required. Current version: $NODE_VERSION"
    exit 1
fi

print_success "Node.js $NODE_VERSION found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm found"

# Create virtual environment
print_status "Setting up Python virtual environment..."

if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_warning "Virtual environment already exists"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install -r requirements_simple.txt

print_success "Python dependencies installed"

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

print_success "Node.js dependencies installed"

# Create environment file
print_status "Creating environment configuration..."
if [ ! -f ".env" ]; then
    cat > .env << 'ENVEOF'
# Real Estate ERP Environment Configuration
DATABASE_URL=sqlite:///./realestate.db
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
ENVIRONMENT=production
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ENVEOF
    print_success "Environment file created"
else
    print_warning "Environment file already exists"
fi

# Initialize database
print_status "Initializing database..."
if [ -f "init_sqlite.py" ]; then
    python init_sqlite.py
    print_success "Database initialized"
else
    print_warning "Database initialization script not found"
fi

# Build frontend
print_status "Building frontend for production..."
npm run build

print_success "Frontend built successfully"

# Create startup scripts
print_status "Creating startup scripts..."

# Backend startup script
cat > start_backend.sh << 'BACKENDEOF'
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
export $(cat .env | xargs)
uvicorn simple_app:app --host 0.0.0.0 --port 8000 --workers 4
BACKENDEOF

# Frontend startup script
cat > start_frontend.sh << 'FRONTENDEOF'
#!/bin/bash
cd "$(dirname "$0")"
npx serve -s build -l 3000
FRONTENDEOF

# Combined startup script
cat > start_app.sh << 'APPEOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Starting Real Estate ERP Application..."

# Start backend in background
echo "Starting backend..."
source venv/bin/activate
export $(cat .env | xargs)
uvicorn simple_app:app --host 0.0.0.0 --port 8000 --workers 4 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
npx serve -s build -l 3000 &
FRONTEND_PID=$!

echo "✅ Application started successfully!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Health Check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the application"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping application..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
APPEOF

# Make scripts executable
chmod +x start_backend.sh start_frontend.sh start_app.sh

print_success "Startup scripts created"

# Create Docker deployment files
print_status "Creating Docker deployment files..."

# Docker Compose file
cat > docker-compose.prod.yml << 'DOCKEREOF'
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./realestate.db
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  data:
DOCKEREOF

print_success "Docker deployment files created"

# Final instructions
echo ""
echo "🎉 Installation completed successfully!"
echo "=========================================="
echo ""
echo "📁 Project location: $PROJECT_ROOT"
echo "🐍 Python virtual environment: $PROJECT_ROOT/venv"
echo "📦 Node modules: $PROJECT_ROOT/node_modules"
echo "🏗️  Frontend build: $PROJECT_ROOT/build"
echo ""
echo "🚀 Quick Start Options:"
echo "1. Start both services: ./start_app.sh"
echo "2. Start backend only: ./start_backend.sh"
echo "3. Start frontend only: ./start_frontend.sh"
echo "4. Docker deployment: docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "🌐 Access URLs:"
echo "   Backend API: http://localhost:8000"
echo "   Frontend App: http://localhost:3000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Health Check: http://localhost:8000/health"
echo ""
echo "📚 Next Steps:"
echo "1. Configure your domain in .env file"
echo "2. Set up SSL certificates for production"
echo "3. Configure firewall rules"
echo "4. Set up database backups"
echo ""
echo "For more information, check the README.md file"
echo ""
print_success "Installation script completed!"
