# Phase 1 Testing Guide - Real Estate Project Management System

## 🎯 Overview

Phase 1 delivers a solid foundation with:
- **FastAPI Backend** with security and performance features
- **PostgreSQL Database** with comprehensive master data
- **Docker Infrastructure** for easy deployment
- **Authentication System** with JWT tokens
- **Material Intelligence** database with real construction data
- **Project Management** core functionality

## 🚀 Quick Start for Testing

### Prerequisites
- Docker and Docker Compose installed
- Git repository cloned
- Ports 8000, 5432, 6379, 9000 available

### 1. Environment Setup
```bash
# Clone and setup
git clone https://github.com/vikas1aggarwal/my-website-1.git
cd my-website-1

# Copy environment file
cp env.example .env

# Generate secure secret key
echo "SECRET_KEY=$(openssl rand -hex 32)" >> .env

# Start services
docker compose up -d postgres redis minio
```

### 2. Initialize Database
```bash
# Wait for PostgreSQL to be ready (check logs)
docker compose logs postgres

# Initialize database with master data
docker exec -i realestate_postgres psql -U realestate_user -d realestate_db < init-db.sql
```

### 3. Start Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Start FastAPI backend
cd app
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Access the System
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)

## 🧪 Test Scenarios

### Test Scenario 1: System Health & Infrastructure
**Objective**: Verify all services are running and healthy

#### Steps:
1. **Check Service Status**
   ```bash
   docker compose ps
   ```
   Expected: All services (postgres, redis, minio) should be "Up"

2. **Health Check API**
   ```bash
   curl http://localhost:8000/health
   ```
   Expected: `{"status": "healthy", "timestamp": "...", "version": "1.0.0"}`

3. **Database Connectivity**
   ```bash
   docker exec realestate_postgres pg_isready -U realestate_user -d realestate_db
   ```
   Expected: `realestate_db:5432 - accepting connections`

4. **Redis Connectivity**
   ```bash
   docker exec realestate_redis redis-cli ping
   ```
   Expected: `PONG`

5. **MinIO Connectivity**
   ```bash
   curl -f http://localhost:9000/minio/health/live
   ```
   Expected: HTTP 200 OK

**Success Criteria**: All services respond correctly, no connection errors

---

### Test Scenario 2: Authentication System
**Objective**: Test user registration, login, and JWT token functionality

#### Steps:
1. **Register New User**
   ```bash
   curl -X POST "http://localhost:8000/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "full_name": "Test User",
       "password": "TestPass123!",
       "role_id": 2
     }'
   ```
   Expected: HTTP 200 with user details (password should be hashed)

2. **Login User**
   ```bash
   curl -X POST "http://localhost:8000/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "TestPass123!"
     }'
   ```
   Expected: HTTP 200 with access token

3. **Test Invalid Login**
   ```bash
   curl -X POST "http://localhost:8000/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "WrongPassword"
     }'
   ```
   Expected: HTTP 401 Unauthorized

4. **Test Duplicate Registration**
   ```bash
   # Try to register same email again
   curl -X POST "http://localhost:8000/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser2",
       "email": "test@example.com",
       "full_name": "Test User 2",
       "password": "TestPass123!",
       "role_id": 2
     }'
   ```
   Expected: HTTP 400 Bad Request (email already exists)

**Success Criteria**: Registration works, login returns tokens, security validations work

---

### Test Scenario 3: Master Data Access
**Objective**: Verify construction materials and project data are accessible

#### Steps:
1. **Get Material Categories**
   ```bash
   curl "http://localhost:8000/materials/categories"
   ```
   Expected: HTTP 200 with hierarchical material categories

2. **Get Materials (All)**
   ```bash
   curl "http://localhost:8000/materials"
   ```
   Expected: HTTP 200 with list of construction materials

3. **Get Materials by Category**
   ```bash
   curl "http://localhost:8000/materials?category_id=6"
   ```
   Expected: HTTP 200 with concrete & cement materials

4. **Verify Material Data Quality**
   - Check that materials have realistic prices
   - Verify properties_json contains technical specifications
   - Confirm units are appropriate (bags, cubic meters, pieces)

**Success Criteria**: All master data accessible, data quality high, realistic construction information

---

### Test Scenario 4: Project Management
**Objective**: Test project creation, retrieval, and basic management

#### Steps:
1. **Get Access Token** (from previous login)
   ```bash
   # Use token from login response
   TOKEN="your_access_token_here"
   ```

2. **Create New Project**
   ```bash
   curl -X POST "http://localhost:8000/projects" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Residential Project",
       "description": "A 3-bedroom house in suburban area",
       "property_type_id": 1,
       "location_address": "456 Oak Street, Suburbia",
       "city": "Mumbai",
       "state": "Maharashtra",
       "budget": 3500000.00,
       "start_date": "2024-01-15"
     }'
   ```
   Expected: HTTP 200 with project details including ID

3. **Get All Projects**
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:8000/projects"
   ```
   Expected: HTTP 200 with list including the new project

4. **Get Specific Project**
   ```bash
   # Use project ID from creation response
   PROJECT_ID="project_id_from_previous_response"
   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:8000/projects/$PROJECT_ID"
   ```
   Expected: HTTP 200 with project details

5. **Test Unauthorized Access**
   ```bash
   curl "http://localhost:8000/projects"
   ```
   Expected: HTTP 401 Unauthorized (no token)

**Success Criteria**: Projects can be created, retrieved, and access control works

---

### Test Scenario 5: Cost Estimation
**Objective**: Test cost estimation functionality with real materials

#### Steps:
1. **Create Cost Estimate**
   ```bash
   curl -X POST "http://localhost:8000/cost-estimates" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "task_id": 1,
       "material_id": 1,
       "quantity": 100.0,
       "unit_cost": 350.00,
       "total_cost": 35000.00,
       "estimate_type": "planned",
       "confidence_level": 0.85
     }'
   ```
   Expected: HTTP 200 with cost estimate details

2. **Verify Cost Calculation**
   - Check that total_cost = quantity × unit_cost
   - Verify material_id references valid material
   - Confirm confidence_level is between 0 and 1

**Success Criteria**: Cost estimates can be created with proper validation

---

### Test Scenario 6: Analytics & Reporting
**Objective**: Test cost analysis and reporting functionality

#### Steps:
1. **Get Project Cost Analysis**
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:8000/analytics/project-costs/$PROJECT_ID"
   ```
   Expected: HTTP 200 with cost breakdown by phase

2. **Verify Data Structure**
   - Check total_planned_cost calculation
   - Verify cost_by_phase array structure
   - Confirm all phases are represented

**Success Criteria**: Analytics return meaningful cost data with proper structure

---

### Test Scenario 7: Security Features
**Objective**: Verify security implementations are working

#### Steps:
1. **Test Rate Limiting**
   ```bash
   # Make multiple rapid requests
   for i in {1..110}; do
     curl -H "Authorization: Bearer $TOKEN" \
       "http://localhost:8000/projects" &
   done
   wait
   ```
   Expected: Some requests should get HTTP 429 (Too Many Requests)

2. **Test Security Headers**
   ```bash
   curl -I "http://localhost:8000/health"
   ```
   Expected: Security headers present (X-Frame-Options, X-Content-Type-Options, etc.)

3. **Test CORS**
   ```bash
   curl -H "Origin: http://malicious-site.com" \
     -H "Authorization: Bearer $TOKEN" \
     "http://localhost:8000/projects"
   ```
   Expected: CORS should block unauthorized origins

4. **Test SQL Injection Protection**
   ```bash
   # Try to inject SQL in project name
   curl -X POST "http://localhost:8000/projects" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test\"; DROP TABLE projects; --",
       "description": "Test project",
       "property_type_id": 1
     }'
   ```
   Expected: Should handle safely, no table dropping

**Success Criteria**: All security measures active and protecting the system

---

### Test Scenario 8: Performance & Monitoring
**Objective**: Verify performance monitoring and optimization features

#### Steps:
1. **Check Performance Headers**
   ```bash
   curl -I "http://localhost:8000/health"
   ```
   Expected: X-Process-Time header present

2. **Monitor Database Performance**
   ```bash
   # Check database stats endpoint (if implemented)
   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:8000/admin/db-stats"
   ```
   Expected: Database connection pool statistics

3. **Test Connection Pooling**
   ```bash
   # Make multiple concurrent requests
   for i in {1..50}; do
     curl -H "Authorization: Bearer $TOKEN" \
       "http://localhost:8000/projects" &
   done
   wait
   ```
   Expected: All requests complete successfully, no connection errors

**Success Criteria**: Performance monitoring active, connection pooling working

---

### Test Scenario 9: Data Integrity
**Objective**: Verify data consistency and referential integrity

#### Steps:
1. **Check Foreign Key Constraints**
   - Try to create cost estimate with invalid task_id
   - Try to create project with invalid property_type_id
   - Expected: Database should reject invalid references

2. **Verify Data Types**
   - Check that numeric fields accept only numbers
   - Verify date fields accept only valid dates
   - Confirm JSON fields accept valid JSON

3. **Test Cascade Deletes**
   - Delete a project and verify related tasks are removed
   - Expected: Referential integrity maintained

**Success Criteria**: Database constraints working, data integrity maintained

---

### Test Scenario 10: Error Handling
**Objective**: Test system behavior under error conditions

#### Steps:
1. **Test Invalid JSON**
   ```bash
   curl -X POST "http://localhost:8000/projects" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{invalid json}'
   ```
   Expected: HTTP 422 Unprocessable Entity with clear error message

2. **Test Missing Required Fields**
   ```bash
   curl -X POST "http://localhost:8000/projects" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"description": "Test project"}'
   ```
   Expected: HTTP 422 with validation errors for missing fields

3. **Test Invalid Data Types**
   ```bash
   curl -X POST "http://localhost:8000/projects" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Project",
       "budget": "not_a_number"
     }'
   ```
   Expected: HTTP 422 with type validation errors

**Success Criteria**: Clear error messages, proper HTTP status codes, graceful error handling

## 📊 Test Results Template

Use this template to track your test results:

```
Test Scenario: [Name]
Date: [Date]
Tester: [Your Name]

Results:
✅ Passed: [List passed tests]
❌ Failed: [List failed tests]
⚠️ Issues: [List any issues found]

Notes: [Additional observations]
```

## 🚨 Common Issues & Solutions

### Issue 1: Database Connection Failed
**Symptoms**: Backend fails to start, database connection errors
**Solution**: 
- Check if PostgreSQL container is running: `docker compose ps`
- Verify database credentials in `.env` file
- Wait for PostgreSQL to fully initialize (check logs)

### Issue 2: Port Already in Use
**Symptoms**: Service fails to start, port binding errors
**Solution**:
- Check what's using the port: `lsof -i :8000`
- Stop conflicting services or change ports in docker-compose.yml

### Issue 3: Permission Denied
**Symptoms**: File access errors, database permission issues
**Solution**:
- Check file permissions: `ls -la`
- Ensure proper ownership: `chown -R user:user .`
- Verify database user permissions

### Issue 4: Memory Issues
**Symptoms**: Slow performance, connection timeouts
**Solution**:
- Increase Docker memory allocation
- Check system resources: `docker stats`
- Optimize database connection pool settings

## 🎯 Success Criteria for Phase 1

Phase 1 is considered successful when:

1. **✅ All test scenarios pass** (7/7 tests in automated suite)
2. **✅ Infrastructure stable** (services run without crashes)
3. **✅ Security features active** (authentication, rate limiting, headers)
4. **✅ Performance acceptable** (response times < 2 seconds)
5. **✅ Data integrity maintained** (constraints working, no corruption)
6. **✅ Error handling graceful** (clear messages, proper status codes)
7. **✅ Master data accessible** (materials, categories, project types)

## 🔄 Next Steps After Phase 1

Once Phase 1 testing is complete and successful:

1. **Document any issues** found during testing
2. **Optimize performance** based on test results
3. **Plan Phase 2** implementation (Material Intelligence)
4. **Set up monitoring** for production readiness
5. **Begin user acceptance testing** with stakeholders

## 📞 Support

If you encounter issues during testing:

1. **Check logs**: `docker compose logs [service_name]`
2. **Verify configuration**: Check `.env` file and docker-compose.yml
3. **Review documentation**: Check the main README and architecture docs
4. **Create issue**: Use GitHub Issues for bug reports

---

**Happy Testing! 🚀**

This comprehensive testing guide ensures Phase 1 meets all requirements before moving to Phase 2.
