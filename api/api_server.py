import os
import sys
import time
import json
import uuid
import subprocess
import asyncio
import threading
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import shutil
import logging
import platform

__version__ = "1.0.0"

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class DownloadRequest(BaseModel):
    url: str

class DownloadResponse(BaseModel):
    id: str
    url: str
    status: str
    message: str

# Create downloads directory
DOWNLOADS_DIR = Path.home() / "Downloads" / "all-dlp"
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Setup logging
LOG_FILE = DOWNLOADS_DIR / "all-dlp.log"
file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
stream_handler = logging.StreamHandler()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[file_handler, stream_handler]
)
logging.info("==== ALL-DLP API Server Startup ====")
logging.info(f"Python version: {sys.version}")
logging.info(f"Platform: {platform.platform()}")
logging.info(f"Executable: {sys.executable}")
logging.info(f"Current working directory: {os.getcwd()}")
logging.info(f"PATH: {os.environ.get('PATH')}")
logging.info(f"FFmpeg expected at: {str(Path(__file__).parent / 'ffmpeg')}")
def flush_logs():
    for handler in logging.getLogger().handlers:
        handler.flush()

# Database import
try:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from database import DownloadDatabase
    db = DownloadDatabase()
except ImportError:
    print("Warning: Database module not found, using fallback")
    db = None

def get_tool_path(tool_name: str) -> str:
    """Get the path to a tool, handling both development and production environments"""
    # Check if we're running from PyInstaller bundle
    if getattr(sys, 'frozen', False):
        # Production mode - running from PyInstaller bundle
        bundle_dir = os.path.dirname(sys.executable)
        
        # The correct path for PyInstaller bundle is _internal/tool-name/tool-name
        tool_path = os.path.join(bundle_dir, '_internal', tool_name, tool_name)
        
        if os.path.exists(tool_path):
            print(f"Found {tool_name} at: {tool_path}")
            return tool_path
        else:
            print(f"Warning: {tool_name} not found at {tool_path}, falling back to system PATH")
            return tool_name
    else:
        # Development mode - use virtual environment
        python_exe = sys.executable
        venv_bin = os.path.dirname(python_exe)
        tool_path = os.path.join(venv_bin, tool_name)
        
        if os.path.exists(tool_path):
            return tool_path
        else:
            # Fallback to system PATH
            return tool_name

def get_env_with_ffmpeg():
    env = os.environ.copy()
    ffmpeg_dir = str(Path(__file__).parent / "ffmpeg")
    env["PATH"] = ffmpeg_dir + os.pathsep + env.get("PATH", "")
    return env

def get_platform(url: str) -> str:
    """Detect platform from URL"""
    url_lower = url.lower()
    if 'youtube.com' in url_lower or 'youtu.be' in url_lower:
        return 'youtube'
    elif 'spotify.com' in url_lower:
        return 'spotify'
    elif 'soundcloud.com' in url_lower:
        return 'soundcloud'
    else:
        return 'unknown'

def find_actual_downloaded_file() -> str:
    """Find the most recently downloaded audio file"""
    try:
        # Look for audio files in downloads directory
        audio_extensions = {'.mp3', '.m4a', '.wav', '.flac', '.ogg', '.webm'}
        files = []
        
        # UUID pattern: 8-4-4-4-12 characters separated by hyphens
        uuid_pattern = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
        import re
        
        print(f"Searching for files in: {DOWNLOADS_DIR}")
        print(f"Files in directory: {list(DOWNLOADS_DIR.glob('*'))}")
        
        for file in DOWNLOADS_DIR.glob('*'):
            if (file.is_file() and 
                file.suffix.lower() in audio_extensions and
                file.name != 'downloads.db' and  # Exclude database file
                not file.name.startswith('.') and  # Exclude hidden files
                file.stat().st_size > 100000 and  # Exclude small files (likely not audio)
                not re.search(uuid_pattern, file.name)):  # Exclude files that already have UUIDs
                files.append(file)
                print(f"Found suitable file: {file.name}")
        
        if files:
            # Return the most recently created file
            most_recent = max(files, key=lambda f: f.stat().st_mtime)
            print(f"Found downloaded file: {most_recent}")
            return str(most_recent)
        else:
            print(f"No suitable files found in {DOWNLOADS_DIR}")
            
    except Exception as e:
        print(f"Error finding downloaded file: {e}")
    
    return None

def clean_title_for_filename(title: str) -> str:
    return "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip().replace(' ', '_')

def is_soundcloud_playlist(url: str) -> bool:
    """Detect if a SoundCloud URL is a playlist (set)."""
    url_lower = url.lower()
    # SoundCloud playlists use '/sets/' in the URL
    return '/sets/' in url_lower

def get_playlist_id_from_url(url: str, platform: str) -> str:
    """Extract playlist ID from a SoundCloud or Spotify playlist URL."""
    import re
    if platform == 'soundcloud':
        # SoundCloud playlist: .../sets/{playlist_id}
        match = re.search(r'/sets/([^/?#]+)', url)
        if match:
            return match.group(1)
        match = re.search(r'/playlist/([^/?#]+)', url)
        if match:
            return match.group(1)
    elif platform == 'spotify':
        # Spotify playlist: .../playlist/{playlist_id}
        match = re.search(r'/playlist/([^/?#]+)', url)
        if match:
            return match.group(1)
    return 'unknown'

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "API server is running"}

@app.post("/api/download", response_model=DownloadResponse)
async def start_download(request: DownloadRequest):
    try:
        # Generate unique ID
        download_id = str(uuid.uuid4())
        platform = get_platform(request.url)
        
        # Add to database
        if db:
            db.addDownload(download_id, request.url, platform)
        
        # Start download in background thread
        start_time = time.time()
        
        if platform == 'youtube':
            thread = threading.Thread(target=download_youtube_sync, args=(request.url, download_id, start_time))
        elif platform == 'spotify':
            thread = threading.Thread(target=download_spotify_sync, args=(request.url, download_id, start_time))
        elif platform == 'soundcloud':
            thread = threading.Thread(target=download_soundcloud_sync, args=(request.url, download_id, start_time))
        else:
            raise HTTPException(status_code=400, detail="Unsupported platform")
        
        thread.daemon = True
        thread.start()
        
        return DownloadResponse(
            id=download_id,
            url=request.url,
            status="started",
            message="Download started successfully"
        )
        
    except Exception as e:
        if db:
            db.updateStatus(download_id, "failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

def download_youtube_sync(url: str, download_id: str, start_time: float):
    try:
        if db:
            db.updateStatus(download_id, "downloading", 0)
        yt_dlp_path = get_tool_path('yt-dlp')
        env = get_env_with_ffmpeg()
        temp_dir = DOWNLOADS_DIR / f"tmp-{download_id}"
        temp_dir.mkdir(exist_ok=True)
        title_process = subprocess.run([
            yt_dlp_path, url, "--no-playlist", "--get-title"
        ], capture_output=True, text=True, env=env)
        logging.info(f"[yt-dlp get-title] stdout: {title_process.stdout}")
        logging.info(f"[yt-dlp get-title] stderr: {title_process.stderr}")
        flush_logs()
        title = "Unknown Title"
        if title_process.returncode == 0:
            title = title_process.stdout.strip()
            if db:
                db.update_title(download_id, title)
        output_template = str(temp_dir / f"download.%(ext)s")
        process = subprocess.Popen([
            yt_dlp_path, url,
            "--no-playlist",
            "--output", output_template,
            "--extract-audio",
            "--audio-format", "mp3",
            "--audio-quality", "0"
        ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                logging.info(f"[yt-dlp] {output.strip()}")
                flush_logs()
            if output and "[download]" in output and "%" in output:
                try:
                    percent = float(output.split("%")[0].split()[-1])
                    if db:
                        db.updateStatus(download_id, "downloading", percent)
                except:
                    pass
        if process.returncode == 0:
            mp3_files = list(temp_dir.glob('*.mp3'))
            if len(mp3_files) == 1:
                src_file = mp3_files[0]
                clean_title = clean_title_for_filename(title)
                final_name = f"{clean_title}-{download_id}.mp3"
                final_path = DOWNLOADS_DIR / final_name
                shutil.move(str(src_file), str(final_path))
                file_size = final_path.stat().st_size
                if db:
                    db.updateStatus(download_id, "completed", 100, str(final_path), file_size)
            else:
                if db:
                    db.updateStatus(download_id, "failed", error="No mp3 file found in temp dir")
        else:
            if db:
                db.updateStatus(download_id, "failed", error="Download failed")
        shutil.rmtree(temp_dir, ignore_errors=True)
    except Exception as e:
        logging.exception(f"Exception in download_youtube_sync: {e}")
        flush_logs()
        if db:
            db.updateStatus(download_id, "failed", error=str(e))
        shutil.rmtree(temp_dir, ignore_errors=True)

def download_spotify_sync(url: str, download_id: str, start_time: float):
    try:
        if db:
            db.updateStatus(download_id, "downloading", 0)
        spotdl_path = get_tool_path('spotdl')
        env = get_env_with_ffmpeg()
        temp_dir = DOWNLOADS_DIR / f"tmp-{download_id}"
        temp_dir.mkdir(exist_ok=True)
        clean_url = url.split('?')[0]
        # Detect playlist
        is_playlist = '/playlist/' in clean_url
        playlist_id = get_playlist_id_from_url(clean_url, 'spotify') if is_playlist else None
        # Get title
        title = "Unknown Title"
        title_process = subprocess.run([
            spotdl_path, clean_url, "--print-errors"
        ], capture_output=True, text=True, env=env)
        logging.info(f"[spotdl get-title] stdout: {title_process.stdout}")
        logging.info(f"[spotdl get-title] stderr: {title_process.stderr}")
        flush_logs()
        if title_process.returncode == 0:
            for line in title_process.stdout.strip().split('\n'):
                if ' - ' in line and not line.startswith('Found') and not line.startswith('Error'):
                    title = line.strip()
                    break
        if db:
            db.update_title(download_id, title)
        # Download to temp dir
        process = subprocess.Popen([
            spotdl_path, clean_url, "--output", str(temp_dir)
        ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
        ffmpeg_error = None
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                logging.info(f"[spotdl] {output.strip()}")
                flush_logs()
                # Detect FFmpegError in output
                if "FFmpegError" in output:
                    ffmpeg_error = output.strip()
        process.wait()
        if ffmpeg_error:
            if db:
                db.updateStatus(download_id, "failed", error=ffmpeg_error)
            shutil.rmtree(temp_dir, ignore_errors=True)
            return
        if process.returncode == 0:
            mp3_files = list(temp_dir.glob('*.mp3'))
            if is_playlist:
                # For playlist, move the folder and keep it
                folder_name = f"spotify-playlist-{download_id}"
                final_folder = DOWNLOADS_DIR / folder_name
                shutil.move(str(temp_dir), str(final_folder))
                file_size = sum(f.stat().st_size for f in final_folder.glob('*.mp3'))
                if db:
                    db.updateStatus(download_id, "completed", 100, str(final_folder), file_size)
                # Notify user in API response (handled by status/file_path)
            elif len(mp3_files) == 1:
                src_file = mp3_files[0]
                clean_title = clean_title_for_filename(title)
                final_name = f"{clean_title}-{download_id}.mp3"
                final_path = DOWNLOADS_DIR / final_name
                shutil.move(str(src_file), str(final_path))
                file_size = final_path.stat().st_size
                if db:
                    db.updateStatus(download_id, "completed", 100, str(final_path), file_size)
                shutil.rmtree(temp_dir, ignore_errors=True)
            else:
                if db:
                    db.updateStatus(download_id, "failed", error="No mp3 file found in temp dir")
                shutil.rmtree(temp_dir, ignore_errors=True)
        else:
            if db:
                db.updateStatus(download_id, "failed", error="Download failed")
            shutil.rmtree(temp_dir, ignore_errors=True)
    except Exception as e:
        logging.exception(f"Exception in download_spotify_sync: {e}")
        flush_logs()
        if db:
            db.updateStatus(download_id, "failed", error=str(e))
        shutil.rmtree(temp_dir, ignore_errors=True)

def download_soundcloud_sync(url: str, download_id: str, start_time: float):
    try:
        if db:
            db.updateStatus(download_id, "downloading", 0)
        scdl_path = get_tool_path('scdl')
        env = get_env_with_ffmpeg()
        temp_dir = DOWNLOADS_DIR / f"tmp-{download_id}"
        shutil.rmtree(temp_dir, ignore_errors=True)
        temp_dir.mkdir(exist_ok=True)
        is_playlist = is_soundcloud_playlist(url)
        playlist_id = get_playlist_id_from_url(url, 'soundcloud') if is_playlist else None
        process = subprocess.Popen(
            [scdl_path, "-l", url, "--path", str(temp_dir), "--overwrite", "--onlymp3"],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env
        )
        downloaded_file = None
        title = "Unknown Title"
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                logging.info(f"[scdl] {output.strip()}")
                flush_logs()
            if output and output.strip().endswith(".mp3 Downloaded."):
                filename = output.strip().replace(" Downloaded.", "")
                downloaded_file = temp_dir / filename
                title = filename.rsplit(".mp3", 1)[0]
        process.wait()
        if process.returncode == 0:
            mp3_files = list(temp_dir.glob('*.mp3'))
            if is_playlist:
                # For playlist, move the folder and keep it
                folder_name = f"soundcloud-playlist-{download_id}"
                final_folder = DOWNLOADS_DIR / folder_name
                shutil.move(str(temp_dir), str(final_folder))
                file_size = sum(f.stat().st_size for f in final_folder.glob('*.mp3'))
                if db:
                    db.updateStatus(download_id, "completed", 100, str(final_folder), file_size)
                # Notify user in API response (handled by status/file_path)
            elif len(mp3_files) == 1:
                clean_title = clean_title_for_filename(title)
                final_name = f"{clean_title}-{download_id}.mp3"
                final_path = DOWNLOADS_DIR / final_name
                shutil.move(str(downloaded_file), str(final_path))
                file_size = final_path.stat().st_size
                if db:
                    db.updateStatus(download_id, "completed", 100, str(final_path), file_size)
                    db.update_title(download_id, title)
                shutil.rmtree(temp_dir, ignore_errors=True)
            else:
                if db:
                    db.updateStatus(download_id, "failed", error="No mp3 file found in temp dir or download failed")
                shutil.rmtree(temp_dir, ignore_errors=True)
        else:
            if db:
                db.updateStatus(download_id, "failed", error="No mp3 file found in temp dir or download failed")
            shutil.rmtree(temp_dir, ignore_errors=True)
    except Exception as e:
        logging.exception(f"Exception in download_soundcloud_sync: {e}")
        flush_logs()
        if db:
            db.updateStatus(download_id, "failed", error=str(e))
        shutil.rmtree(temp_dir, ignore_errors=True)

# Keep the old async functions for backward compatibility but they're not used
async def download_youtube(url: str, download_id: str, start_time: float):
    """Download from YouTube using yt-dlp"""
    download_youtube_sync(url, download_id, start_time)

async def download_spotify(url: str, download_id: str, start_time: float):
    """Download from Spotify using spotdl"""
    download_spotify_sync(url, download_id, start_time)

async def download_soundcloud(url: str, download_id: str, start_time: float):
    """Download from SoundCloud using scdl"""
    download_soundcloud_sync(url, download_id, start_time)

@app.get("/api/downloads")
async def get_downloads():
    """Get all downloads from database with file verification"""
    if db:
        downloads = db.getDownloads()
        
        # Verify file existence for completed downloads
        for download in downloads:
            if download.get('status') == 'completed' and download.get('file_path'):
                if not os.path.exists(download['file_path']):
                    # File was deleted, update status
                    db.updateStatus(download['id'], "file_missing", error="File was deleted")
                    download['status'] = 'file_missing'
                    download['error'] = 'File was deleted'
        
        return downloads
    else:
        return []

@app.get("/api/download/{download_id}")
async def get_download(download_id: str):
    """Get a specific download by ID"""
    if db:
        download = db.getDownload(download_id)
        if download:
            return download
        else:
            raise HTTPException(status_code=404, detail="Download not found")
    else:
        raise HTTPException(status_code=500, detail="Database not available")

@app.delete("/api/download/{download_id}")
async def delete_download(download_id: str):
    """Delete a download from database"""
    if db:
        db.deleteDownload(download_id)
        return {"message": "Download deleted"}
    else:
        raise HTTPException(status_code=500, detail="Database not available")

@app.post("/api/download/{download_id}/redownload")
async def redownload_file(download_id: str):
    """Re-download a file that was deleted"""
    if not db:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Get the original download info
    download = db.getDownload(download_id)
    if not download:
        raise HTTPException(status_code=404, detail="Download not found")
    
    # Start a new download with the same URL and UUID
    try:
        platform = get_platform(download['url'])
        
        # Reset the download status to started
        db.updateStatus(download_id, "started")
        
        # Start download in background thread
        start_time = time.time()
        
        if platform == 'youtube':
            thread = threading.Thread(target=download_youtube_sync, args=(download['url'], download_id, start_time))
        elif platform == 'spotify':
            thread = threading.Thread(target=download_spotify_sync, args=(download['url'], download_id, start_time))
        elif platform == 'soundcloud':
            thread = threading.Thread(target=download_soundcloud_sync, args=(download['url'], download_id, start_time))
        else:
            raise HTTPException(status_code=400, detail="Unsupported platform")
        
        thread.daemon = True
        thread.start()
        
        return DownloadResponse(
            id=download_id,
            url=download['url'],
            status="started",
            message="Re-download started successfully"
        )
        
    except Exception as e:
        if db:
            db.updateStatus(download_id, "failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/downloads/clear")
async def clear_database():
    """Clear all downloads from database"""
    if not db:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        db.clearAllDownloads()
        return {"message": "All downloads cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000) 