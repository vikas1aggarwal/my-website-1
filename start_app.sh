#!/bin/bash

# Real Estate Project Management System - Startup Script

echo "🏗️  Starting Real Estate Project Management System..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Creating one..."
    python3.11 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if [ ! -f "venv/lib/python3.11/site-packages/fastapi" ]; then
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
fi

# Check if database exists
if [ ! -f "realestate.db" ]; then
    echo "🗄️  Initializing database..."
    python init_sqlite.py
fi

# Start the application
echo "🚀 Starting application..."
echo "📱 Application will be available at: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo "🔍 Testing Guide: See TESTING_GUIDE.md"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

python simple_app.py
