# bB-downloader

A cross-platform desktop app for downloading music and audio from YouTube, Spotify, and SoundCloud. Built with Electron and Python (FastAPI), it provides a simple, robust, and privacy-friendly experience.

## Features

- Download audio from YouTube, Spotify, and SoundCloud
- Playlist support for Spotify and SoundCloud (downloads all tracks into a folder)
- Robust file naming: `{original_file_name}-{UUID}.mp3`
- Temporary directory per download job to avoid race conditions
- Built-in FFmpeg for high-quality audio conversion
- Comprehensive logging to `bB-downloader.log` for debugging
- Modern, clean UI with black & white color scheme
- "How it works" help modal and troubleshooting guide
- Download status tracking and management
- Cross-platform: macOS (DMG), Windows, Linux (planned)

## Getting Started

See the [INSTALLATION_GUIDE.md](electron-app/INSTALLATION_GUIDE.md) for setup and usage instructions.

## License

MIT License 