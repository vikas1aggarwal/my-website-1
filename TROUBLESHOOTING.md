# Real Estate Project Management System - Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Issue 1: 500 Internal Server Error on POST/PUT Endpoints

**Symptoms:**
- API documentation shows 500 errors
- Browser requests fail with 500 status
- Curl commands work fine

**Root Cause:**
- Browser sends different request format than curl
- JSON parsing issues
- Database connection problems

**Solutions:**

#### Solution A: Use the Test HTML Page
1. Open `test_api.html` in your browser
2. Test all endpoints directly
3. This bypasses the FastAPI documentation interface

#### Solution B: Check Application Logs
```bash
# View real-time logs
tail -f /path/to/application.log

# Or check the terminal where the app is running
# Look for detailed error messages
```

#### Solution C: Verify Database
```bash
# Check if database exists
ls -la realestate.db

# Check database integrity
sqlite3 realestate.db "PRAGMA integrity_check;"

# Reinitialize database if needed
python init_sqlite.py
```

### Issue 2: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Frontend can't connect to API

**Solution:**
The API already has CORS configured to allow all origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 3: Database Connection Issues

**Symptoms:**
- 500 errors on database operations
- "Database is locked" errors

**Solutions:**

#### Check Database Permissions
```bash
# Ensure database is writable
chmod 644 realestate.db

# Check if database is locked
lsof realestate.db
```

#### Restart Application
```bash
# Stop the application
pkill -f "python simple_app.py"

# Restart with fresh database connection
python simple_app.py
```

### Issue 4: Port Already in Use

**Symptoms:**
- "Address already in use" error
- Can't start application

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port
python simple_app.py --port 8001
```

## 🔧 Testing Methods

### Method 1: Command Line Testing (Most Reliable)
```bash
# Test health
curl http://localhost:8000/health

# Test user registration
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "email": "test@example.com", "password": "test123", "full_name": "Test User"}'

# Test project creation
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project", "description": "Test", "budget": 1000000}'
```

### Method 2: Automated Test Script
```bash
# Run comprehensive tests
python test_endpoints.py
```

### Method 3: Browser Testing
1. Open `test_api.html` in your browser
2. Test all endpoints interactively
3. See real-time results

### Method 4: FastAPI Documentation
1. Open http://localhost:8000/docs
2. Use the interactive interface
3. Note: May have issues with complex requests

## 📊 Debugging Steps

### Step 1: Check Application Status
```bash
# Verify application is running
curl http://localhost:8000/health

# Check if port is open
netstat -an | grep 8000
```

### Step 2: Check Database
```bash
# Verify database exists and has data
sqlite3 realestate.db "SELECT COUNT(*) FROM users;"
sqlite3 realestate.db "SELECT COUNT(*) FROM projects;"
```

### Step 3: Check Logs
The application now has detailed logging. Look for:
- Request details
- Database errors
- JSON parsing errors
- Validation errors

### Step 4: Test Individual Components
```bash
# Test database connection
python -c "import sqlite3; conn = sqlite3.connect('./realestate.db'); print('DB OK')"

# Test JSON parsing
python -c "import json; data = json.loads('{\"test\": \"value\"}'); print('JSON OK')"
```

## 🎯 Quick Fixes

### If POST/PUT endpoints fail:
1. **Use the test HTML page** (`test_api.html`)
2. **Use curl commands** instead of browser
3. **Check application logs** for specific errors
4. **Restart the application** with fresh database connection

### If database issues occur:
1. **Reinitialize database**: `python init_sqlite.py`
2. **Check file permissions**: `ls -la realestate.db`
3. **Restart application**: `pkill -f "python simple_app.py" && python simple_app.py`

### If port issues occur:
1. **Find and kill process**: `lsof -i :8000 && kill -9 <PID>`
2. **Use different port**: Modify the port in `simple_app.py`

## ✅ Success Indicators

Your application is working correctly if:
- ✅ Health endpoint returns 200 OK
- ✅ GET endpoints return data
- ✅ POST endpoints create new records
- ✅ Error handling returns proper status codes
- ✅ Database operations complete successfully

## 📞 Getting Help

If you continue to have issues:
1. Check the application logs for specific error messages
2. Use the test HTML page to isolate browser vs API issues
3. Run the automated test script to verify functionality
4. Check this troubleshooting guide for common solutions

## 🔄 Reset Everything

If all else fails, reset the entire setup:
```bash
# Stop application
pkill -f "python simple_app.py"

# Remove database
rm -f realestate.db

# Reinitialize database
python init_sqlite.py

# Restart application
python simple_app.py

# Test
curl http://localhost:8000/health
```
