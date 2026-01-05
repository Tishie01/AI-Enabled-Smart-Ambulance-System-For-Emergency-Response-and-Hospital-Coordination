"""
Test script to verify Flask API is working correctly
Run this in a SEPARATE terminal while Flask is running
"""
import requests
import json
import time
import sys

API_BASE = "http://localhost:5000"

def wait_for_server(max_retries=10, delay=1):
    """Wait for server to be ready"""
    for i in range(max_retries):
        try:
            response = requests.get(f"{API_BASE}/health", timeout=2)
            if response.status_code == 200:
                return True
        except:
            pass
        print(f"   Waiting for server... ({i+1}/{max_retries})")
        time.sleep(delay)
    return False

def test_api():
    print("Testing Flask API...")
    print("Make sure Flask is running in another terminal!")
    print()
    
    # Wait for server
    print("Waiting for server to be ready...")
    if not wait_for_server():
        print("ERROR: Could not connect to Flask server!")
        print("Make sure Flask is running: python flask_app.py")
        return False
    print("✓ Server is ready!\n")
    
    # Test 1: Health check
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{API_BASE}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   ERROR: {e}")
        return False
    
    # Test 2: Model info
    print("\n2. Testing model info endpoint...")
    try:
        response = requests.get(f"{API_BASE}/api/model/info")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Model: {data.get('model_name')}")
            print(f"   Features: {data.get('num_features')}")
        else:
            print(f"   ERROR: {response.json()}")
            return False
    except Exception as e:
        print(f"   ERROR: {e}")
        return False
    
    # Test 3: Get best hospitals
    print("\n3. Testing get best hospitals endpoint...")
    try:
        response = requests.get(f"{API_BASE}/api/hospitals/best?limit=5")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Total hospitals: {data.get('total_hospitals')}")
            print(f"   Returned: {data.get('returned')}")
            if data.get('hospitals'):
                print(f"   First hospital: {data['hospitals'][0].get('hospital_name')}")
        else:
            print(f"   ERROR: {response.json()}")
            return False
    except Exception as e:
        print(f"   ERROR: {e}")
        return False
    
    print("\n✓ All tests passed!")
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("Flask API Test Script")
    print("=" * 60)
    print("\nIMPORTANT: Flask server must be running in another terminal!")
    print("Start Flask with: python flask_app.py")
    print("Then run this test script in a different terminal.\n")
    print("=" * 60)
    print()
    
    success = test_api()
    
    if success:
        print("\n" + "=" * 60)
        print("✓ All tests passed! API is working correctly.")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("✗ Some tests failed. Check the errors above.")
        print("=" * 60)
        sys.exit(1)

