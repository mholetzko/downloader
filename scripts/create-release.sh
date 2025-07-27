#!/bin/bash
# Music Downloader Release Script
# This script helps create a new release by:
# 1. Updating the version in package.json
# 2. Creating a git tag
# 3. Pushing the tag to trigger the release pipeline
set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎵 Music Downloader Release Script${NC}"
echo "=================================="

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Check if we have uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    echo "Please commit or stash them before creating a release."
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}Current version: ${CURRENT_VERSION}${NC}"

# Ask for new version
echo ""
echo "What type of release do you want to create?"
echo "1) Patch (bug fixes) - ${CURRENT_VERSION} → $(node -p "require('semver').inc('$CURRENT_VERSION', 'patch')")"
echo "2) Minor (new features) - ${CURRENT_VERSION} → $(node -p "require('semver').inc('$CURRENT_VERSION', 'minor')")"
echo "3) Major (breaking changes) - ${CURRENT_VERSION} → $(node -p "require('semver').inc('$CURRENT_VERSION', 'major')")"
echo "4) Custom version"
echo ""
read -p "Choose option (1-4): " choice

case $choice in
    1)
        NEW_VERSION=$(node -p "require('semver').inc('$CURRENT_VERSION', 'patch')")
        ;;
    2)
        NEW_VERSION=$(node -p "require('semver').inc('$CURRENT_VERSION', 'minor')")
        ;;
    3)
        NEW_VERSION=$(node -p "require('semver').inc('$CURRENT_VERSION', 'major')")
        ;;
    4)
        read -p "Enter custom version (e.g., 6.1.0): " NEW_VERSION
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

# Validate version format
if ! node -e "require('semver').valid('$NEW_VERSION')" 2>/dev/null; then
    echo -e "${RED}❌ Invalid version format: $NEW_VERSION${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Creating release: ${CURRENT_VERSION} → ${NEW_VERSION}${NC}"

# Confirm release
read -p "Continue? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Release cancelled${NC}"
    exit 0
fi

# Update version in package.json
echo -e "${BLUE}📝 Updating package.json...${NC}"
npm version $NEW_VERSION --no-git-tag-version

# Commit the version change
echo -e "${BLUE}📦 Committing version change...${NC}"
git add package.json
git commit -m "Bump version to $NEW_VERSION"

# Create and push tag
echo -e "${BLUE}🏷️  Creating tag v$NEW_VERSION...${NC}"
git tag v$NEW_VERSION

echo -e "${BLUE}🚀 Pushing changes and tag...${NC}"
git push origin main
git push origin v$NEW_VERSION

echo ""
echo -e "${GREEN}✅ Release created successfully!${NC}"
echo ""
echo -e "${BLUE}What happens next:${NC}"
echo "1. GitHub Actions will automatically build DMG files"
echo "2. A release will be created at: https://github.com/mholetzko/downloader/releases"
echo "3. DMG files will be available for download"
echo ""
echo -e "${BLUE}Monitor the build:${NC}"
echo "https://github.com/mholetzko/downloader/actions"
echo ""
echo -e "${GREEN}🎉 Your release is being built!${NC}" 