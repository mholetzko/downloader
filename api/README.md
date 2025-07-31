# ALL-DLP API

This directory contains the Python backend for the ALL-DLP application.

## Structure

```
api/
├── __init__.py          # Package initialization
├── api_server.py        # FastAPI server with download endpoints
├── database.py          # SQLite database operations
├── requirements.txt     # Python dependencies
├── test_api.py          # API testing utilities
└── README.md           # This file
```

## Files

### `api_server.py`
The main FastAPI server that provides REST endpoints for:
- Downloading music from YouTube, Spotify, and SoundCloud
- Managing download jobs and status
- File management and cleanup

### `database.py`
SQLite database operations for:
- Storing download history
- Managing job status
- File metadata

### `requirements.txt`
Python dependencies including:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `yt-dlp` - YouTube downloader
- `spotdl` - Spotify downloader
- `scdl` - SoundCloud downloader

## Development

### Setup
```bash
# Install dependencies
pip install -r api/requirements.txt

# Start the API server
python api/api_server.py
```

### Testing
```bash
# Run API tests
python api/test_api.py
```

## Integration

The API is integrated with the Electron frontend and can be:
- Started as a subprocess by the main application
- Bundled with PyInstaller for distribution
- Used as a standalone service

## Endpoints

- `GET /api/health` - Health check
- `POST /api/download` - Start a download job
- `GET /api/downloads` - Get all download history
- `GET /api/download/{download_id}` - Get specific download status
- `DELETE /api/download/{download_id}` - Delete a download from history
- `POST /api/download/{download_id}/redownload` - Re-download a file
- `DELETE /api/downloads/clear` - Clear all download history
- `POST /api/purchase-search` - Search for legal purchase options 