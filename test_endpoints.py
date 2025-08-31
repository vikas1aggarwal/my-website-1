#!/usr/bin/env python3
"""
Test script for Real Estate Project Management System API
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing Health Endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_root():
    """Test root endpoint"""
    print("🏠 Testing Root Endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_projects_get():
    """Test GET projects endpoint"""
    print("📋 Testing GET Projects...")
    response = requests.get(f"{BASE_URL}/projects")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_projects_post():
    """Test POST projects endpoint"""
    print("➕ Testing POST Projects...")
    project_data = {
        "name": "API Test Project",
        "description": "Project created via API test",
        "budget": 2500000
    }
    response = requests.post(f"{BASE_URL}/projects", json=project_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_projects_post_error():
    """Test POST projects error handling"""
    print("❌ Testing POST Projects Error Handling...")
    project_data = {
        "description": "Project without name"
    }
    response = requests.post(f"{BASE_URL}/projects", json=project_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_materials():
    """Test materials endpoint"""
    print("🏗️ Testing Materials...")
    response = requests.get(f"{BASE_URL}/materials")
    print(f"Status: {response.status_code}")
    materials = response.json()
    print(f"Found {len(materials)} materials")
    if materials:
        print(f"First material: {materials[0]['name']}")
    print()

def test_material_categories():
    """Test material categories endpoint"""
    print("📂 Testing Material Categories...")
    response = requests.get(f"{BASE_URL}/materials/categories")
    print(f"Status: {response.status_code}")
    categories = response.json()
    print(f"Found {len(categories)} categories")
    if categories:
        print(f"First category: {categories[0]['name']}")
    print()

def test_register_user():
    """Test user registration"""
    print("👤 Testing User Registration...")
    user_data = {
        "username": "apitestuser",
        "email": "apitest@example.com",
        "password": "test123",
        "full_name": "API Test User"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_register_user_duplicate():
    """Test duplicate user registration"""
    print("🔄 Testing Duplicate User Registration...")
    user_data = {
        "username": "apitestuser2",
        "email": "apitest@example.com",  # Same email as above
        "password": "test123",
        "full_name": "API Test User 2"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_login():
    """Test user login"""
    print("🔑 Testing User Login...")
    login_data = {
        "email": "apitest@example.com",
        "password": "test123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_login_invalid():
    """Test invalid login"""
    print("🚫 Testing Invalid Login...")
    login_data = {
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_demo_setup():
    """Test demo setup"""
    print("🎯 Testing Demo Setup...")
    response = requests.get(f"{BASE_URL}/demo/setup")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def main():
    """Run all tests"""
    print("🚀 Starting API Tests for Real Estate Project Management System")
    print("=" * 60)
    
    try:
        test_health()
        test_root()
        test_projects_get()
        test_projects_post()
        test_projects_post_error()
        test_materials()
        test_material_categories()
        test_register_user()
        test_register_user_duplicate()
        test_login()
        test_login_invalid()
        test_demo_setup()
        
        print("✅ All tests completed!")
        print("\n📚 You can also test the API interactively at:")
        print(f"   {BASE_URL}/docs")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the API server.")
        print("   Make sure the application is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error during testing: {e}")

if __name__ == "__main__":
    main()
