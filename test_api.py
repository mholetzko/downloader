#!/usr/bin/env python3
"""
Simple test script to verify the API server is working
"""

import requests
import json
import time

def test_api_health():
    """Test the health endpoint"""
    try:
        response = requests.get('http://127.0.0.1:8000/api/health')
        print(f"Health check: {response.status_code}")
        if response.ok:
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_download_start():
    """Test starting a download"""
    try:
        # Test with a simple YouTube URL
        test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        
        response = requests.post('http://127.0.0.1:8000/api/download', 
                               json={'url': test_url})
        print(f"Download start: {response.status_code}")
        
        if response.ok:
            result = response.json()
            print(f"Download ID: {result.get('id')}")
            print(f"Status: {result.get('status')}")
            return result.get('id')
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Download start failed: {e}")
        return None

def test_get_downloads():
    """Test getting downloads list"""
    try:
        response = requests.get('http://127.0.0.1:8000/api/downloads')
        print(f"Get downloads: {response.status_code}")
        
        if response.ok:
            downloads = response.json()
            print(f"Found {len(downloads)} downloads")
            for download in downloads:
                print(f"  - {download.get('id')}: {download.get('status')}")
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Get downloads failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing API server...")
    
    # Test health
    if not test_api_health():
        print("API server is not responding. Make sure it's running on port 8000.")
        exit(1)
    
    # Test getting downloads
    test_get_downloads()
    
    # Test starting a download
    download_id = test_download_start()
    
    if download_id:
        print(f"\nDownload started with ID: {download_id}")
        print("Check the downloads list in a few seconds to see the progress...")
        
        # Wait a bit and check status
        time.sleep(2)
        test_get_downloads()
    
    print("\nTest completed!") 