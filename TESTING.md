# ALL-DLP Testing Guide

## 🧪 Testing Overview

ALL-DLP includes comprehensive testing to ensure compatibility across different architectures and scenarios. The testing suite covers:

- **Compatibility Testing**: Cross-architecture validation
- **Integration Testing**: End-to-end functionality verification
- **Build Validation**: Artifact verification and quality checks
- **CI/CD Testing**: Automated pipeline validation

## 🚀 Quick Test Commands

```bash
# Run all tests locally
npm run test

# Check system compatibility
npm run check-compatibility

# Validate build artifacts
npm run test-build

# Run specific test suites
npm run test-integration
npm run test-build
```

## 📋 Test Suites

### 1. Compatibility Check (`npm run check-compatibility`)

**Purpose**: Diagnose system compatibility and identify potential issues.

**Tests**:
- System architecture detection
- Python environment validation
- FFmpeg availability and compatibility
- API bundle architecture verification
- Virtual environment status
- Database and downloads directory checks

**Output Example**:
```
🔍 ALL-DLP Compatibility Checker

📋 System Information:
  Platform: darwin
  Architecture: arm64
  CPU: Apple M3
  Node.js: v24.1.0

🎬 FFmpeg Check:
  System FFmpeg: Found at /opt/homebrew/bin/ffmpeg

📦 Python API Bundle:
  API Bundle: Found at /path/to/dist/all-dlp-api
  Bundle Architecture: Mach-O 64-bit executable arm64
```

### 2. Integration Testing (`npm run test`)

**Purpose**: Comprehensive end-to-end testing of all components.

**Tests**:
- System compatibility validation
- Dependencies verification
- FFmpeg availability and permissions
- Python environment setup
- API bundle creation and validation
- API server startup and health checks
- Electron app structure verification
- Database and file system checks
- Configuration file validation

**Output Example**:
```
🧪 ALL-DLP Integration Test Suite

🔍 Running: System Compatibility Check
✅ PASSED: System Compatibility Check

🔍 Running: API Server Startup Test
   Starting API server with /path/to/python
✅ PASSED: API Server Startup Test

📊 Test Summary:
   Total tests: 11
   Passed: 11
   Failed: 0

🎉 All tests passed!
```

### 3. Build Validation (`npm run test-build`)

**Purpose**: Verify build artifacts and ensure quality standards.

**Tests**:
- Build artifact existence
- Executable permissions
- Architecture compatibility
- FFmpeg compatibility
- Bundle size validation
- Required files verification
- Electron app structure validation

**Output Example**:
```
🔍 ALL-DLP Build Validation

✅ Build artifacts exist
✅ Executable permissions
✅ Architecture compatibility
   System FFmpeg: Mach-O 64-bit executable arm64
✅ FFmpeg compatibility
   Bundle size: 116.36MB
✅ Bundle size reasonable
   Bundle structure: Complete PyInstaller bundle
✅ Required files in bundle
   App: ALL-DLP.app
✅ Electron app structure

📊 Build Validation Summary:
   Passed: 7
   Failed: 0
   Total: 7

🎉 Build validation passed!
```

## 🔄 CI/CD Testing

### GitHub Actions Workflows

#### 1. Compatibility Testing (`test-compatibility.yml`)

**Triggers**: Pull requests, pushes to main, manual dispatch

**Jobs**:
- **test-build-compatibility**: Tests ARM64 native, x64 Rosetta, and compatibility checks
- **test-app-compatibility**: Validates app builds for both architectures
- **test-api-functionality**: Verifies API server startup and health
- **test-cross-architecture**: Tests universal compatibility
- **test-gatekeeper-compatibility**: Validates macOS Gatekeeper compatibility

#### 2. Build Testing (Integrated into build workflows)

**Added to**:
- `build-dmg.yml`: Development builds
- `release.yml`: Release builds

**Tests**:
- Compatibility checks before build
- Integration tests after dependencies
- Build validation after artifact creation

## 🛠️ Local Testing Setup

### Prerequisites

1. **Node.js**: v18+ or v20+
2. **Python**: 3.11+
3. **FFmpeg**: System installation or bundled
4. **macOS**: 11.0+ for Apple Silicon, 10.15+ for Intel

### Setup Commands

```bash
# Install dependencies
npm install

# Setup Python environment
./setup.sh

# Download FFmpeg
npm run download-ffmpeg

# Build Python backend
npm run bundle-python

# Build Electron app
npm run dist -- --mac --arm64 --dir
```

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test suites
npm run check-compatibility
npm run test-build

# Run tests with verbose output
DEBUG=1 npm run test
```

## 🔍 Test Scenarios

### Architecture Compatibility

**ARM64 (Apple Silicon)**:
- Native ARM64 builds
- Universal compatibility settings
- M1/M2/M3 cross-generation testing

**x64 (Intel)**:
- Rosetta 2 compatibility
- Legacy architecture support
- Cross-compilation validation

### Platform Compatibility

**macOS**:
- Gatekeeper compatibility
- App signing validation
- System integration testing

**Cross-Platform**:
- File system compatibility
- Path handling validation
- Environment variable testing

### Component Testing

**Python Backend**:
- API server startup
- Health endpoint validation
- Download functionality
- Database operations

**Electron Frontend**:
- App structure validation
- Resource bundling
- IPC communication
- UI functionality

**FFmpeg Integration**:
- Binary compatibility
- Architecture validation
- Execution permissions
- System vs bundled FFmpeg

## 🐛 Troubleshooting Tests

### Common Test Failures

#### 1. API Server Startup Failure

**Symptoms**: "API server failed to start" or timeout errors

**Solutions**:
```bash
# Check Python environment
python3 --version
source venv-arm64/bin/activate

# Check port availability
lsof -i :8000

# Start API manually
npm run start-api
```

#### 2. FFmpeg Not Found

**Symptoms**: "No FFmpeg found" errors

**Solutions**:
```bash
# Install system FFmpeg
brew install ffmpeg

# Download bundled FFmpeg
npm run download-ffmpeg

# Check FFmpeg installation
which ffmpeg
ffmpeg -version
```

#### 3. Build Artifacts Missing

**Symptoms**: "Missing build artifacts" errors

**Solutions**:
```bash
# Rebuild Python backend
npm run bundle-python

# Rebuild Electron app
npm run dist -- --mac --arm64 --dir

# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

#### 4. Architecture Mismatch

**Symptoms**: "Architecture compatibility" failures

**Solutions**:
```bash
# Check system architecture
uname -m

# Use correct virtual environment
source venv-arm64/bin/activate  # For ARM64
source venv-x64/bin/activate    # For x64

# Rebuild with correct architecture
npm run bundle-python
```

### Debug Mode

Enable verbose output for detailed debugging:

```bash
# Set debug environment variable
export DEBUG=1

# Run tests with debug output
npm run test

# Check specific components
npm run check-compatibility
```

## 📊 Test Results Interpretation

### Success Indicators

- **All tests passed**: System is fully compatible and ready for use
- **Compatibility check passed**: No known compatibility issues
- **Build validation passed**: Artifacts meet quality standards

### Warning Indicators

- **Some tests skipped**: Non-critical components missing (e.g., Electron app not built)
- **System FFmpeg used**: Bundled FFmpeg not available, but system version works
- **Minimal bundle structure**: PyInstaller bundle may be incomplete

### Failure Indicators

- **API server failures**: Backend issues that need immediate attention
- **Architecture mismatches**: Cross-compilation problems
- **Missing dependencies**: Required components not installed
- **Permission errors**: File system access issues

## 🔄 Continuous Testing

### Pre-commit Testing

Add to your development workflow:

```bash
# Before committing
npm run check-compatibility
npm run test

# Before pushing
npm run test-build
```

### Automated Testing

The CI/CD pipeline automatically runs:

1. **Compatibility checks** on every PR
2. **Integration tests** before builds
3. **Build validation** after artifact creation
4. **Cross-architecture testing** for releases

### Test Coverage

Current test coverage includes:

- ✅ System compatibility (100%)
- ✅ Dependencies validation (100%)
- ✅ FFmpeg integration (100%)
- ✅ Python environment (100%)
- ✅ API server functionality (100%)
- ✅ Build artifacts (100%)
- ✅ Electron app structure (100%)
- ✅ Database operations (100%)
- ✅ File system operations (100%)

## 📈 Performance Testing

### Bundle Size Monitoring

Track bundle sizes to prevent bloat:

```bash
# Check current bundle size
npm run test-build

# Monitor size changes
du -sh dist/all-dlp-api/
du -sh dist/mac/*.app/
```

### Startup Time Testing

Measure application startup performance:

```bash
# Time API server startup
time npm run start-api

# Time Electron app startup
time npm start
```

## 🎯 Best Practices

### For Developers

1. **Run tests locally** before pushing changes
2. **Check compatibility** on different architectures
3. **Validate builds** before releases
4. **Monitor test results** in CI/CD pipelines

### For Users

1. **Run compatibility check** if experiencing issues
2. **Check troubleshooting guide** for common problems
3. **Report test failures** with detailed information
4. **Verify system requirements** before installation

### For CI/CD

1. **Fail fast** on critical test failures
2. **Provide detailed logs** for debugging
3. **Cache dependencies** for faster builds
4. **Parallelize tests** where possible

## 📞 Getting Help

If tests are failing or you need assistance:

1. **Check the logs** for specific error messages
2. **Run compatibility check** to identify issues
3. **Review troubleshooting guide** for common solutions
4. **Create an issue** with test output and system information
5. **Check CI/CD status** for automated test results 