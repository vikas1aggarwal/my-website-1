#!/bin/bash

echo "🚀 Starting Public Access Setup..."
echo ""

# Check if applications are running
echo "📋 Checking application status..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000)
BACKEND_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5001/api/health)

if [ "$FRONTEND_STATUS" != "200" ]; then
    echo "❌ Frontend not running on port 3000. Please start it with 'npm start'"
    exit 1
fi

if [ "$BACKEND_STATUS" != "200" ]; then
    echo "❌ Backend not running on port 5001. Please start it with 'uvicorn material_intelligence_api:app --host 0.0.0.0 --port 5001'"
    exit 1
fi

echo "✅ Both applications are running!"
echo ""

# Start ngrok tunnels
echo "🌐 Starting ngrok tunnels..."
echo ""

echo "Starting frontend tunnel (port 3000)..."
ngrok http 3000 --log=stdout > ngrok-frontend.log 2>&1 &
FRONTEND_PID=$!

echo "Starting backend tunnel (port 5001)..."
ngrok http 5001 --log=stdout > ngrok-backend.log 2>&1 &
BACKEND_PID=$!

echo "⏳ Waiting for tunnels to initialize..."
sleep 5

echo ""
echo "🔗 Getting public URLs..."

# Get tunnel URLs
FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for tunnel in data['tunnels']:
        if tunnel['config']['addr'] == 'http://localhost:3000':
            print(tunnel['public_url'])
            break
except:
    print('Error getting frontend URL')
")

BACKEND_URL=$(curl -s http://localhost:4041/api/tunnels | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for tunnel in data['tunnels']:
        if tunnel['config']['addr'] == 'http://localhost:5001':
            print(tunnel['public_url'])
            break
except:
    print('Error getting backend URL')
")

echo ""
echo "🎉 Public URLs Generated!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Frontend URL: $FRONTEND_URL"
echo "🔧 Backend URL:  $BACKEND_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "1. Share the Frontend URL with your friend"
echo "2. Update the frontend to use the Backend URL"
echo "3. Test the application"
echo ""
echo "🛑 To stop tunnels: kill $FRONTEND_PID $BACKEND_PID"
echo "📊 Monitor tunnels: http://localhost:4040 (frontend) and http://localhost:4041 (backend)"
