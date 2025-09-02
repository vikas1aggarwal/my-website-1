#!/bin/bash

# Real Estate ERP - Quick Install Script
# Run this with: curl -sSL https://raw.githubusercontent.com/your-repo/main/deploy/quick-install.sh | bash

set -e

echo "🚀 Real Estate ERP - Quick Install"
echo "=================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Get current directory
PROJECT_ROOT="$(pwd)"

# Check system requirements
echo "�� Checking system requirements..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ System requirements met"

# Create virtual environment
echo "🐍 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements_simple.txt

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create environment file
echo "⚙️  Creating environment configuration..."
cat > .env << 'ENVEOF'
DATABASE_URL=sqlite:///./realestate.db
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
ENVIRONMENT=production
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ENVEOF

# Initialize database
echo "🗄️  Initializing database..."
python init_sqlite.py

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Create startup script
echo "🚀 Creating startup script..."
cat > start.sh << 'STARTEOF'
#!/bin/bash
echo "🚀 Starting Real Estate ERP..."

# Start backend
source venv/bin/activate
export $(cat .env | xargs)
uvicorn simple_app:app --host 0.0.0.0 --port 8000 --workers 4 &
BACKEND_PID=$!

# Wait and start frontend
sleep 3
npx serve -s build -l 3000 &
FRONTEND_PID=$!

echo "✅ Application started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Health: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
STARTEOF

chmod +x start.sh

echo ""
echo "🎉 Installation completed successfully!"
echo "====================================="
echo ""
echo "🚀 To start the application:"
echo "   ./start.sh"
echo ""
echo "🌐 Access URLs:"
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📚 For more options, check deploy/README.md"
