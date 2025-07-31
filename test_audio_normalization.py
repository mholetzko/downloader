#!/usr/bin/env python3
"""
Test script for audio normalization functionality
"""

import subprocess
import os
import json
from pathlib import Path

def test_audio_normalization():
    """Test the audio normalization with different settings"""
    
    # Test file (you can replace this with any MP3 file)
    test_file = "test_audio.mp3"
    
    # Create a simple test audio file if it doesn't exist
    if not os.path.exists(test_file):
        print("Creating test audio file...")
        # Create a simple sine wave test file
        subprocess.run([
            "ffmpeg", "-f", "lavfi", "-i", "sine=frequency=1000:duration=5",
            "-acodec", "mp3", "-ar", "44100", "-ab", "128k", test_file
        ])
    
    # Test different volume boost settings
    volume_settings = [1.5, 2.0, 3.0, 4.0]
    
    for volume_boost in volume_settings:
        print(f"\n🔊 Testing volume boost: {volume_boost}x")
        
        # Create output filename
        output_file = f"test_audio_boost_{volume_boost}x.mp3"
        
        # FFmpeg command for audio normalization
        cmd = [
            "ffmpeg",
            "-i", test_file,
            "-af", f"loudnorm=I=-16:TP=-1.5:LRA=11,volume={volume_boost}",
            "-ar", "44100",
            "-b:a", "320k",
            "-y",
            output_file
        ]
        
        print(f"Running: {' '.join(cmd)}")
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Successfully created {output_file}")
                
                # Get file sizes for comparison
                original_size = os.path.getsize(test_file)
                new_size = os.path.getsize(output_file)
                print(f"   Original size: {original_size:,} bytes")
                print(f"   New size: {new_size:,} bytes")
                
            else:
                print(f"❌ Failed: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print(f"\n🎵 Audio normalization test completed!")
    print(f"📁 Check the generated files in the current directory")

if __name__ == "__main__":
    test_audio_normalization() 