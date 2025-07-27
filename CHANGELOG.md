# Changelog

## [5.3.0] - 2025-07-24
### Added
- New "How it works" help button in the top right of the app, opening a modal with features, troubleshooting, and WhatsApp contact for Matthias.
- Improved app icon: two gently touching circles (black and white), matching the header design.

## [5.2.0] - 2025-07-24
### Fixed
- SoundCloud downloads are now robust: always start with a clean temp directory, parse the correct filename from scdl output, use the correct file and title, and fail gracefully if not found.

## [5.1.0] - 2025-07-24
### Added
- Robust temp-directory logic for all downloads (YouTube, Spotify, SoundCloud): each download uses a unique temp folder, eliminating file-matching ambiguity and race conditions.
- Output filenames are now always `{title}-{UUID}.mp3` for all platforms.

### Fixed
- Playlist/track detection and output naming for YouTube, Spotify, and SoundCloud.
- Various bugfixes and reliability improvements for download handling.

## [5.0.0] - 2025-07-24

### 🎨 Professional Icon & Polish

#### ✨ New Features
- **Custom Application Icon**: Replaced default React icon with professional black and white circles design
- **Professional Branding**: Consistent visual identity matching the app's design language
- **Download Indicator**: Icon includes a subtle download arrow to indicate functionality

#### 🎨 Design Improvements
- **Taskbar Icon**: Professional icon appears in macOS dock and taskbar
- **App Icon**: Consistent branding across all system locations
- **Visual Identity**: Matches the black and white circles theme from the header

#### 📦 Technical Updates
- **Icon Generation**: Automated icon creation scripts
- **Build Configuration**: Proper icon integration in electron-builder
- **Asset Management**: Organized icon assets in dedicated directory

#### 🔧 Database Fixes
- **Database Permissions**: Fixed "attempt to write a readonly database" error
- **Database Location**: Database now created in user's home directory (`~/.bb-downloader/`)
- **Write Permissions**: Ensures database is always writable in packaged environment
- **Error Handling**: Improved error handling and debugging for database operations

---

## [4.0.0] - 2025-07-24

### 🎉 Major Release - All Platforms Working!

#### ✅ Fixed Issues
- **YouTube Downloads**: Fixed download failures in packaged environment
- **SoundCloud Downloads**: Fixed download failures and file naming issues
- **Tool Path Resolution**: All external tools (`yt-dlp`, `spotdl`, `scdl`) now correctly found in PyInstaller bundle
- **File Naming**: Consistent UUID-based file naming across all platforms
- **Error Handling**: Improved error messages and debugging output

#### 🔧 Technical Improvements
- **Enhanced Debugging**: Added comprehensive logging to track download progress
- **Improved File Finding**: Better logic for locating downloaded files with UUID naming
- **Robust Error Handling**: Better error messages and fallback mechanisms
- **Environment Detection**: Properly handles both development and production environments

#### 🎨 UI/UX Improvements
- **Header Design**: Replaced React logo with black and white circles from animated header
- **Compact Layout**: Made header smaller and more space-efficient
- **Scrollable Downloads**: Only the list of downloaded songs is scrollable
- **Pagination**: Shows last 20 songs with pagination controls
- **Clean Design**: Removed borders around sections for cleaner look
- **Sticky Elements**: Header and footer are now sticky for better UX

#### 📦 Packaging
- **Self-Contained**: All Python dependencies and external tools bundled
- **Cross-Platform**: Supports both Intel (x64) and Apple Silicon (arm64) Macs
- **Installation**: Simple DMG installer with drag-and-drop installation

#### 🧪 Tested Platforms
- ✅ **YouTube**: Successfully downloads and renames files with UUID suffixes
- ✅ **Spotify**: Successfully downloads and renames files with UUID suffixes  
- ✅ **SoundCloud**: Successfully downloads and renames files with UUID suffixes

#### 📋 System Requirements
- macOS 10.12+ (APFS support required)
- No additional dependencies required (all bundled)

---

## [3.0.0] - 2025-07-24

### UI/UX Improvements
- Replaced React logo with black and white circles
- Made header smaller
- Made only downloads list scrollable
- Added pagination (20 songs per page)
- Removed borders around sections

## [2.0.0] - 2025-07-24

### Packaging Fixes
- Fixed API server not starting in packaged environment
- Fixed external tool path resolution
- Improved PyInstaller bundle structure

## [1.0.0] - 2025-07-24

### Initial Release
- Basic download functionality for YouTube, Spotify, and SoundCloud
- Electron-based desktop application
- Python backend with FastAPI
- SQLite database for download tracking 