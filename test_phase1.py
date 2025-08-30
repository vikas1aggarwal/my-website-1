#!/usr/bin/env python3
"""
Phase 1 Implementation Test Script
Tests the core functionality without external dependencies
"""

import sys
import os

def test_file_structure():
    """Test that all required files exist"""
    print("🔍 Testing file structure...")
    
    required_files = [
        "docker-compose.yml",
        "Dockerfile.backend", 
        "Dockerfile.frontend",
        "init-db.sql",
        "requirements.txt",
        "env.example",
        "app/main.py",
        "app/config.py",
        "app/database.py"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print(f"❌ Missing files: {missing_files}")
        return False
    else:
        print("✅ All required files present")
        return True

def test_docker_compose():
    """Test Docker Compose configuration"""
    print("\n🐳 Testing Docker Compose configuration...")
    
    try:
        with open("docker-compose.yml", "r") as f:
            content = f.read()
            
        # Check for required services
        required_services = ["postgres", "redis", "minio", "backend", "frontend"]
        missing_services = []
        
        for service in required_services:
            if service not in content:
                missing_services.append(service)
        
        if missing_services:
            print(f"❌ Missing services: {missing_services}")
            return False
        else:
            print("✅ All required services configured")
            return True
            
    except Exception as e:
        print(f"❌ Error reading docker-compose.yml: {e}")
        return False

def test_database_init():
    """Test database initialization script"""
    print("\n🗄️ Testing database initialization script...")
    
    try:
        with open("init-db.sql", "r") as f:
            content = f.read()
            
        # Check for required tables
        required_tables = [
            "material_categories", "materials", "property_types", 
            "construction_phases", "building_components", "users", 
            "roles", "projects", "tasks", "cost_estimates"
        ]
        
        missing_tables = []
        for table in required_tables:
            if table not in content.lower():
                missing_tables.append(table)
        
        if missing_tables:
            print(f"❌ Missing tables: {missing_tables}")
            return False
        else:
            print("✅ All required tables defined")
            return True
            
    except Exception as e:
        print(f"❌ Error reading init-db.sql: {e}")
        return False

def test_requirements():
    """Test requirements.txt"""
    print("\n📦 Testing requirements.txt...")
    
    try:
        with open("requirements.txt", "r") as f:
            content = f.read()
            
        # Check for required packages
        required_packages = [
            "fastapi", "uvicorn", "sqlalchemy", "asyncpg", 
            "redis", "minio", "pydantic", "python-jose"
        ]
        
        missing_packages = []
        for package in required_packages:
            if package not in content:
                missing_packages.append(package)
        
        if missing_packages:
            print(f"❌ Missing packages: {missing_packages}")
            return False
        else:
            print("✅ All required packages listed")
            return True
            
    except Exception as e:
        print(f"❌ Error reading requirements.txt: {e}")
        return False

def test_python_syntax():
    """Test Python syntax without importing"""
    print("\n🐍 Testing Python syntax...")
    
    try:
        # Test main.py syntax
        with open("app/main.py", "r") as f:
            compile(f.read(), "app/main.py", "exec")
        print("✅ app/main.py syntax valid")
        
        # Test config.py syntax
        with open("app/config.py", "r") as f:
            compile(f.read(), "app/config.py", "exec")
        print("✅ app/config.py syntax valid")
        
        # Test database.py syntax
        with open("app/database.py", "r") as f:
            compile(f.read(), "app/database.py", "exec")
        print("✅ app/database.py syntax valid")
        
        return True
        
    except SyntaxError as e:
        print(f"❌ Syntax error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error testing syntax: {e}")
        return False

def test_security_features():
    """Test security features in the code"""
    print("\n🔒 Testing security features...")
    
    security_features = {
        "Rate limiting": False,
        "Security headers": False,
        "CORS configuration": False,
        "Trusted hosts": False,
        "JWT authentication": False,
        "Password hashing": False
    }
    
    try:
        with open("app/main.py", "r") as f:
            content = f.read()
            
        if "rate_limiting" in content:
            security_features["Rate limiting"] = True
        if "SECURITY_HEADERS" in content:
            security_features["Security headers"] = True
        if "CORSMiddleware" in content:
            security_features["CORS configuration"] = True
        if "TrustedHostMiddleware" in content:
            security_features["Trusted hosts"] = True
        if "create_access_token" in content:
            security_features["JWT authentication"] = True
        if "get_password_hash" in content:
            security_features["Password hashing"] = True
            
        # Print results
        all_good = True
        for feature, status in security_features.items():
            if status:
                print(f"✅ {feature}")
            else:
                print(f"❌ {feature}")
                all_good = False
                
        return all_good
        
    except Exception as e:
        print(f"❌ Error testing security features: {e}")
        return False

def test_performance_features():
    """Test performance features in the code"""
    print("\n⚡ Testing performance features...")
    
    performance_features = {
        "Connection pooling": False,
        "Async database": False,
        "Query optimization": False,
        "Performance monitoring": False,
        "Caching support": False
    }
    
    try:
        with open("app/database.py", "r") as f:
            content = f.read()
            
        if "QueuePool" in content:
            performance_features["Connection pooling"] = True
        if "AsyncSession" in content:
            performance_features["Async database"] = True
        if "pool_size" in content:
            performance_features["Query optimization"] = True
        if "Performance monitoring" in content:
            performance_features["Performance monitoring"] = True
        if "redis" in content.lower() or "aioredis" in content.lower():
            performance_features["Caching support"] = True
            
        # Print results
        all_good = True
        for feature, status in performance_features.items():
            if status:
                print(f"✅ {feature}")
            else:
                print(f"❌ {feature}")
                all_good = False
                
        return all_good
        
    except Exception as e:
        print(f"❌ Error testing performance features: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Phase 1 Implementation Test Suite")
    print("=" * 50)
    
    tests = [
        test_file_structure,
        test_docker_compose,
        test_database_init,
        test_requirements,
        test_python_syntax,
        test_security_features,
        test_performance_features
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with error: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Phase 1 implementation is ready.")
        return True
    else:
        print("⚠️ Some tests failed. Please review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
