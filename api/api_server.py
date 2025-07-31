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
import urllib.parse

# Add mutagen for MP3 metadata extraction
try:
    from mutagen import File
    from mutagen.mp3 import MP3
    from mutagen.id3 import ID3
    MUTAGEN_AVAILABLE = True
except ImportError:
    MUTAGEN_AVAILABLE = False
    logging.warning("mutagen not available - will use fallback metadata extraction")

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

class PurchaseSearchRequest(BaseModel):
    title: str
    artist: str = ""

class PurchaseOption(BaseModel):
    platform: str
    name: str
    url: str
    price: str = ""
    format: str = ""

class PurchaseSearchResponse(BaseModel):
    title: str
    artist: str
    options: list[PurchaseOption]

# Create downloads directory
DOWNLOADS_DIR = Path.home() / "Downloads" / "all-dlp"
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Setup logging with more detailed startup information
LOG_FILE = DOWNLOADS_DIR / "all-dlp.log"
file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
stream_handler = logging.StreamHandler()

# Create formatter
formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
file_handler.setFormatter(formatter)
stream_handler.setFormatter(formatter)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    handlers=[file_handler, stream_handler]
)

# Enhanced startup logging
logging.info("=" * 60)
logging.info("ALL-DLP API Server Startup")
logging.info("=" * 60)
logging.info(f"Python version: {sys.version}")
logging.info(f"Platform: {platform.platform()}")
logging.info(f"Architecture: {platform.machine()}")
logging.info(f"Executable: {sys.executable}")
logging.info(f"Current working directory: {os.getcwd()}")
logging.info(f"Script location: {__file__}")
logging.info(f"Downloads directory: {DOWNLOADS_DIR}")
logging.info(f"Log file: {LOG_FILE}")
logging.info(f"PATH: {os.environ.get('PATH')}")

# Check FFmpeg availability
ffmpeg_path = Path(__file__).parent / "ffmpeg"
logging.info(f"FFmpeg expected at: {ffmpeg_path}")
if ffmpeg_path.exists():
    logging.info(f"✅ FFmpeg found at: {ffmpeg_path}")
else:
    logging.warning(f"⚠️  FFmpeg not found at: {ffmpeg_path}")
    # Check system FFmpeg
    import shutil
    system_ffmpeg = shutil.which('ffmpeg')
    if system_ffmpeg:
        logging.info(f"✅ System FFmpeg found at: {system_ffmpeg}")
    else:
        logging.error("❌ No FFmpeg found in system PATH")
def flush_logs():
    for handler in logging.getLogger().handlers:
        handler.flush()

# Database import with enhanced logging
logging.info("Initializing database...")
try:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from database import DownloadDatabase
    db = DownloadDatabase()
    logging.info("✅ Database initialized successfully")
except ImportError as e:
    logging.error(f"❌ Database module not found: {e}")
    logging.warning("⚠️  Using fallback mode - downloads will not be saved")
    db = None
except Exception as e:
    logging.error(f"❌ Database initialization failed: {e}")
    logging.warning("⚠️  Using fallback mode - downloads will not be saved")
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

def clean_extracted_title(title: str) -> str:
    """Clean up titles extracted from download tools"""
    if not title or title == "Unknown Title":
        return title
    
    # Remove common prefixes
    prefixes_to_remove = [
        "Downloaded \"",
        "Downloaded '",
        "Found \"",
        "Found '",
        "Skipping ",
        "Downloading ",
        "Processing "
    ]
    
    cleaned_title = title
    for prefix in prefixes_to_remove:
        if cleaned_title.startswith(prefix):
            cleaned_title = cleaned_title[len(prefix):]
            break
    
    # Remove trailing quotes and colons
    cleaned_title = cleaned_title.rstrip('":\'')
    
    # Remove trailing text like " (file already exists)"
    if " (file already exists)" in cleaned_title:
        cleaned_title = cleaned_title.replace(" (file already exists)", "")
    
    # Clean up extra whitespace
    cleaned_title = cleaned_title.strip()
    
    return cleaned_title if cleaned_title else "Unknown Title"

def extract_mp3_metadata(file_path: str) -> dict:
    """Extract metadata from MP3 file using mutagen"""
    metadata = {
        'title': None,
        'artist': None,
        'album': None,
        'year': None,
        'track': None
    }
    
    if not MUTAGEN_AVAILABLE:
        return metadata
    
    try:
        audio = File(file_path)
        if audio is None:
            return metadata
            
        # Try to get ID3 tags first
        if hasattr(audio, 'tags') and audio.tags:
            tags = audio.tags
            
            # Common ID3 tag mappings
            tag_mappings = {
                'title': ['TIT2', 'title', 'TITLE'],
                'artist': ['TPE1', 'artist', 'ARTIST', 'TPE2'],
                'album': ['TALB', 'album', 'ALBUM'],
                'year': ['TDRC', 'year', 'YEAR', 'TYER'],
                'track': ['TRCK', 'track', 'TRACK']
            }
            
            for field, possible_tags in tag_mappings.items():
                for tag in possible_tags:
                    if tag in tags:
                        value = tags[tag]
                        if hasattr(value, 'text'):
                            value = value.text[0] if value.text else None
                        if value and str(value).strip():
                            metadata[field] = str(value).strip()
                            break
            
            # If no ID3 tags, try generic tags
            if not any(metadata.values()):
                for key in metadata.keys():
                    if key in tags:
                        value = tags[key]
                        if hasattr(value, 'text'):
                            value = value.text[0] if value.text else None
                        if value and str(value).strip():
                            metadata[key] = str(value).strip()
        
        # Fallback: try to get basic info
        if hasattr(audio, 'info'):
            info = audio.info
            if hasattr(info, 'length'):
                metadata['duration'] = info.length
        
    except Exception as e:
        logging.warning(f"Error extracting MP3 metadata from {file_path}: {e}")
    
    return metadata

def generate_filename_from_metadata(metadata: dict, download_id: str, fallback_title: str = None) -> str:
    """Generate a clean filename from MP3 metadata"""
    title = metadata.get('title') or fallback_title or "Unknown"
    artist = metadata.get('artist')
    
    # Clean the title and artist
    clean_title = clean_title_for_filename(title)
    clean_artist = clean_title_for_filename(artist) if artist else None
    
    # Generate filename
    if clean_artist:
        filename = f"{clean_artist}-{clean_title}-{download_id}.mp3"
    else:
        filename = f"{clean_title}-{download_id}.mp3"
    
    return filename

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
        
        # Detect if this is a playlist
        is_playlist = '/playlist?' in url or '/watch?v=' in url and '&list=' in url
        playlist_id = get_playlist_id_from_url(url, 'youtube') if is_playlist else None
        
        title_process = subprocess.run([
            yt_dlp_path, url, "--no-playlist", "--get-title"
        ], capture_output=True, text=True, env=env)
        logging.info(f"[yt-dlp get-title] stdout: {title_process.stdout}")
        logging.info(f"[yt-dlp get-title] stderr: {title_process.stderr}")
        flush_logs()
        title = "Unknown Title"
        if title_process.returncode == 0:
            raw_title = title_process.stdout.strip()
            title = clean_extracted_title(raw_title)
        
        # For playlists, use a generic title instead of individual track titles
        if is_playlist:
            title = f"YouTube Playlist ({playlist_id})" if playlist_id else "YouTube Playlist"
        
            if db:
                db.update_title(download_id, title)
        if is_playlist:
            # For playlists, download all tracks
            output_template = str(temp_dir / f"%(title)s.%(ext)s")
            process = subprocess.Popen([
                yt_dlp_path, url,
                "--output", output_template,
                "--extract-audio",
                "--audio-format", "mp3",
                "--audio-quality", "0"
            ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
        else:
            # For single tracks, use the original logic
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
            if is_playlist and len(mp3_files) > 1:
                # For playlists, move the entire folder
                folder_name = f"youtube-playlist-{download_id}"
                final_folder = DOWNLOADS_DIR / folder_name
                shutil.move(str(temp_dir), str(final_folder))
                file_size = sum(f.stat().st_size for f in final_folder.glob('*.mp3'))
                if db:
                    db.updateStatus(download_id, "completed", 100, str(final_folder), file_size)
            elif len(mp3_files) == 1:
                src_file = mp3_files[0]
                
                # Extract metadata from the downloaded MP3 file
                metadata = extract_mp3_metadata(str(src_file))
                logging.info(f"Extracted metadata: {metadata}")
                
                # Generate filename from metadata
                final_name = generate_filename_from_metadata(metadata, download_id, title)
                final_path = DOWNLOADS_DIR / final_name
                
                # Move file to final location
                shutil.move(str(src_file), str(final_path))
                file_size = final_path.stat().st_size
                
                # Update database with metadata if available
                if metadata.get('artist') and db:
                    db.update_artist(download_id, metadata['artist'])
                if metadata.get('album') and db:
                    db.update_album(download_id, metadata['album'])
                
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
                    raw_title = line.strip()
                    title = clean_extracted_title(raw_title)
                    break
        
        # For playlists, use a generic title instead of individual track titles
        if is_playlist:
            title = f"Playlist ({playlist_id})" if playlist_id else "Playlist"
        
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
                
                # Extract metadata from the downloaded MP3 file
                metadata = extract_mp3_metadata(str(src_file))
                logging.info(f"Extracted metadata: {metadata}")
                
                # Generate filename from metadata
                final_name = generate_filename_from_metadata(metadata, download_id, title)
                final_path = DOWNLOADS_DIR / final_name
                
                # Move file to final location
                shutil.move(str(src_file), str(final_path))
                file_size = final_path.stat().st_size
                
                # Update database with metadata if available
                if metadata.get('artist') and db:
                    db.update_artist(download_id, metadata['artist'])
                if metadata.get('album') and db:
                    db.update_album(download_id, metadata['album'])
                
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
        
        # For playlists, use a generic title
        if is_playlist:
            title = f"SoundCloud Playlist ({playlist_id})" if playlist_id else "SoundCloud Playlist"
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
                if not is_playlist:
                    # Only extract title for single tracks, not playlists
                    raw_title = filename.rsplit(".mp3", 1)[0]
                    title = clean_extracted_title(raw_title)
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
                # Extract metadata from the downloaded MP3 file
                metadata = extract_mp3_metadata(str(downloaded_file))
                logging.info(f"Extracted metadata: {metadata}")
                
                # Generate filename from metadata
                final_name = generate_filename_from_metadata(metadata, download_id, title)
                final_path = DOWNLOADS_DIR / final_name
                
                # Move file to final location
                shutil.move(str(downloaded_file), str(final_path))
                file_size = final_path.stat().st_size
                
                # Update database with metadata if available
                if metadata.get('artist') and db:
                    db.update_artist(download_id, metadata['artist'])
                if metadata.get('album') and db:
                    db.update_album(download_id, metadata['album'])
                
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

@app.post("/api/purchase-search", response_model=PurchaseSearchResponse)
async def search_purchase_options(request: PurchaseSearchRequest):
    """Search for legal purchase options for a song"""
    try:
        title = request.title.strip()
        artist = request.artist.strip()
        
        if not title:
            raise HTTPException(status_code=400, detail="Title is required")
        
        # Build search query
        search_query = title
        if artist:
            search_query = f"{artist} {title}"
        
        # Encode for URL
        encoded_query = urllib.parse.quote(search_query)
        
        options = []
        
        # iTunes/Apple Music
        itunes_url = f"https://music.apple.com/search?term={encoded_query}"
        options.append(PurchaseOption(
            platform="iTunes/Apple Music",
            name="Apple Music",
            url=itunes_url,
            format="Digital"
        ))
        
        # Amazon Music
        amazon_url = f"https://www.amazon.com/s?k={encoded_query}&i=digital-music"
        options.append(PurchaseOption(
            platform="Amazon",
            name="Amazon Music",
            url=amazon_url,
            format="Digital"
        ))
        
        # Bandcamp (for independent artists)
        bandcamp_url = f"https://bandcamp.com/search?q={encoded_query}"
        options.append(PurchaseOption(
            platform="Bandcamp",
            name="Bandcamp",
            url=bandcamp_url,
            format="Digital/Physical"
        ))
        
        # 7digital (for high-quality downloads)
        seven_digital_url = f"https://www.7digital.com/search?q={encoded_query}"
        options.append(PurchaseOption(
            platform="7digital",
            name="7digital",
            url=seven_digital_url,
            format="High-Quality Digital"
        ))
        

        
        # Beatport (for electronic music)
        beatport_url = f"https://www.beatport.com/search?q={encoded_query}"
        options.append(PurchaseOption(
            platform="Beatport",
            name="Beatport",
            url=beatport_url,
            format="Digital"
        ))
        
        # YouTube Music (for streaming and some downloads)
        youtube_music_url = f"https://music.youtube.com/search?q={encoded_query}"
        options.append(PurchaseOption(
            platform="YouTube Music",
            name="YouTube Music",
            url=youtube_music_url,
            format="Streaming/Download"
        ))
        
        return PurchaseSearchResponse(
            title=title,
            artist=artist,
            options=options
        )
        
    except Exception as e:
        logging.error(f"Error searching purchase options: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    try:
        logging.info("Starting uvicorn server...")
        logging.info(f"Server will be available at: http://127.0.0.1:8000")
        logging.info("=" * 60)
        uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
    except Exception as e:
        logging.error(f"❌ Failed to start server: {e}")
        print(f"❌ Failed to start server: {e}")
        print(f"📋 Check the log file for details: {LOG_FILE}")
        sys.exit(1) 