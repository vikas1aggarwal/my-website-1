#!/usr/bin/env python3
"""
Manual Phase 1 Testing Script
Run this to test all Phase 1 features manually
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing Health Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health: {data['status']} - {data['message']}")
            return True
        else:
            print(f"❌ Health failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health error: {e}")
        return False

def test_authentication():
    """Test authentication"""
    print("\n🔐 Testing Authentication...")
    try:
        # Test login
        login_data = {
            "email": "admin@realestate.com",
            "password": "admin123"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful: {data['message']}")
            print(f"   User: {data['user']['username']} ({data['user']['email']})")
            return True
        else:
            print(f"❌ Login failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return False

def test_projects():
    """Test project management"""
    print("\n🏗️ Testing Project Management...")
    try:
        response = requests.get(f"{BASE_URL}/projects")
        if response.status_code == 200:
            projects = response.json()
            print(f"✅ Projects: {len(projects)} projects found")
            for project in projects[:3]:  # Show first 3
                print(f"   - {project['name']} (₹{project['budget']:,.0f})")
            return True
        else:
            print(f"❌ Projects failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Projects error: {e}")
        return False

def test_materials():
    """Test material management"""
    print("\n🧱 Testing Material Management...")
    try:
        response = requests.get(f"{BASE_URL}/materials")
        if response.status_code == 200:
            materials = response.json()
            print(f"✅ Materials: {len(materials)} materials found")
            for material in materials[:3]:  # Show first 3
                print(f"   - {material['name']} (₹{material['base_cost_per_unit']}/unit)")
            return True
        else:
            print(f"❌ Materials failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Materials error: {e}")
        return False

def test_api_docs():
    """Test API documentation"""
    print("\n📚 Testing API Documentation...")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ API Documentation: Swagger UI available")
            return True
        else:
            print(f"❌ API docs failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API docs error: {e}")
        return False

def main():
    """Run all Phase 1 tests"""
    print("🚀 Phase 1 Manual Testing")
    print("=" * 50)
    print(f"Testing at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Base URL: {BASE_URL}")
    print("=" * 50)
    
    tests = [
        test_health,
        test_authentication,
        test_projects,
        test_materials,
        test_api_docs
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 Phase 1 is fully functional!")
        print("\nNext steps:")
        print("1. Open http://localhost:8000/docs in your browser")
        print("2. Explore the interactive API documentation")
        print("3. Try creating a new project or material")
    else:
        print("⚠️ Some tests failed. Check the backend server.")
    
    print("=" * 50)

if __name__ == "__main__":
    main()
