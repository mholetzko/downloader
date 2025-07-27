"""
ALL-DLP API Package

This package contains the Python backend for the ALL-DLP application.
It provides API endpoints for downloading music from YouTube, Spotify, and SoundCloud.
"""

__version__ = "1.0.0"
__author__ = "Matthias Holetzko"
__email__ = "mholetzko@gmx.net"

from . import api_server
from . import database

__all__ = ["api_server", "database"] 