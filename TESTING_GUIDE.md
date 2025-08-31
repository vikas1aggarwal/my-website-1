# Real Estate Project Management System - Testing Guide

## 🚀 Application Status: RUNNING
**URL:** http://localhost:8000  
**API Documentation:** http://localhost:8000/docs

## 📋 Prerequisites
- ✅ Python 3.11 virtual environment activated
- ✅ Application running on port 8000
- ✅ SQLite database initialized with sample data

## 🧪 Testing Methods

### Method 1: Interactive API Documentation (Recommended)
1. **Open your browser** and go to: http://localhost:8000/docs
2. **Explore all endpoints** with interactive testing interface
3. **Test each endpoint** directly from the browser

### Method 2: Command Line Testing
Use curl commands to test the API endpoints.

### Method 3: Frontend Integration
Test with your existing frontend (if available).

## 🔍 Comprehensive Test Scenarios

### 1. System Health Check
```bash
curl http://localhost:8000/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-30T23:57:16.821488",
  "version": "1.0.0",
  "message": "Real Estate Project Management System is running!"
}
```

### 2. API Information
```bash
curl http://localhost:8000/
```
**Expected Response:**
```json
{
  "message": "Real Estate Project Management System",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "docs": "/docs",
    "projects": "/projects",
    "materials": "/materials",
    "auth": {
      "register": "/auth/register",
      "login": "/auth/login"
    }
  }
}
```

### 3. Authentication Testing

#### 3.1 Register New User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123",
    "full_name": "Test User"
  }'
```

#### 3.2 Login User
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

#### 3.3 Login with Demo User
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo123"
  }'
```

### 4. Project Management Testing

#### 4.1 Get All Projects
```bash
curl http://localhost:8000/projects
```
**Expected Response:** List of existing projects from database

#### 4.2 Create New Project
```bash
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Residential Project",
    "description": "A modern 4-bedroom house with garden",
    "budget": 3500000
  }'
```

#### 4.3 Create Project with Minimal Data
```bash
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Simple Project"
  }'
```

### 5. Material Management Testing

#### 5.1 Get All Materials
```bash
curl http://localhost:8000/materials
```
**Expected Response:** List of materials with categories, units, and costs

#### 5.2 Get Material Categories
```bash
curl http://localhost:8000/materials/categories
```
**Expected Response:** List of material categories (Cement, Steel, Tiles, etc.)

### 6. Demo Data Setup
```bash
curl http://localhost:8000/demo/setup
```
**Expected Response:**
```json
{
  "message": "Demo data setup completed",
  "demo_user": {
    "email": "demo@example.com",
    "password": "demo123"
  }
}
```

## 🎯 Advanced Testing Scenarios

### 7. Error Handling Testing

#### 7.1 Invalid Registration (Missing Fields)
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com"
  }'
```
**Expected Response:** 400 Bad Request with error message

#### 7.2 Invalid Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "wrongpassword"
  }'
```
**Expected Response:** 401 Unauthorized

#### 7.3 Create Project Without Name
```bash
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Project without name"
  }'
```
**Expected Response:** 400 Bad Request

### 8. Data Validation Testing

#### 8.1 Duplicate User Registration
```bash
# Register user first time
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "duplicate",
    "email": "duplicate@example.com",
    "password": "test123",
    "full_name": "Duplicate User"
  }'

# Try to register same email again
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "duplicate2",
    "email": "duplicate@example.com",
    "password": "test123",
    "full_name": "Duplicate User 2"
  }'
```
**Expected Response:** 400 Bad Request - "Email already registered"

## 🔧 Database Testing

### 9. Verify Database Content
```bash
# Check if database file exists
ls -la realestate.db

# Check database size
du -h realestate.db
```

### 10. Sample Data Verification
After running the application, verify that sample data is loaded:
- 1 sample project
- 29 materials across 15 categories
- 1 admin user
- 5 user roles

## 🌐 Frontend Integration Testing

### 11. CORS Testing
Test if the API accepts requests from your frontend:
```bash
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://localhost:8000/auth/register
```

### 12. JSON Response Format
All endpoints return properly formatted JSON with appropriate HTTP status codes.

## 📊 Performance Testing

### 13. Response Time Testing
```bash
# Test response time for health endpoint
time curl -s http://localhost:8000/health

# Test response time for projects endpoint
time curl -s http://localhost:8000/projects
```

### 14. Concurrent Request Testing
```bash
# Test multiple concurrent requests
for i in {1..10}; do
  curl -s http://localhost:8000/health &
done
wait
```

## 🚨 Troubleshooting

### Common Issues:

1. **Application not starting:**
   - Check if port 8000 is available
   - Verify virtual environment is activated
   - Check Python version (should be 3.11)

2. **Database errors:**
   - Run `python init_sqlite.py` to reinitialize database
   - Check file permissions for `realestate.db`

3. **Import errors:**
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Verify virtual environment is activated

4. **CORS issues:**
   - Check browser console for CORS errors
   - Verify frontend URL is in allowed origins

## ✅ Success Criteria

Your application is working correctly if:
- ✅ Health endpoint returns 200 OK
- ✅ All endpoints return proper JSON responses
- ✅ Database operations work (create, read)
- ✅ Error handling works (400, 401, 500 responses)
- ✅ CORS allows frontend requests
- ✅ API documentation is accessible at `/docs`

## 🎉 Next Steps

After successful testing:
1. **Integrate with your frontend** (if applicable)
2. **Add more features** based on your requirements
3. **Implement authentication middleware** for protected endpoints
4. **Add more comprehensive error handling**
5. **Implement logging and monitoring**

## 📞 Support

If you encounter issues:
1. Check the application logs in the terminal
2. Verify all prerequisites are met
3. Test individual endpoints using the provided curl commands
4. Use the interactive API documentation at `/docs` for debugging
