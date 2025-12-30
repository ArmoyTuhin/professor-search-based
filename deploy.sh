#!/bin/bash

# Deploy script for Professor Search Frontend
# Usage: ./deploy.sh <ngrok-url>
# Example: ./deploy.sh https://6831da43c3b2.ngrok-free.app

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ngrok URL is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Ngrok URL is required${NC}"
    echo "Usage: ./deploy.sh <ngrok-url>"
    echo "Example: ./deploy.sh https://6831da43c3b2.ngrok-free.app"
    exit 1
fi

NGROK_URL="$1"

# Remove trailing slash if present
NGROK_URL="${NGROK_URL%/}"

# Validate URL format
if [[ ! $NGROK_URL =~ ^https?:// ]]; then
    echo -e "${RED}Error: Invalid URL format. Must start with http:// or https://${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 Starting deployment process...${NC}"
echo -e "${YELLOW}Ngrok URL: $NGROK_URL${NC}"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Update apiConfig.js
echo -e "${GREEN}Step 1: Updating backend URL in apiConfig.js...${NC}"
CONFIG_FILE="src/config/apiConfig.js"

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: $CONFIG_FILE not found${NC}"
    exit 1
fi

# Update the BACKEND_URL in apiConfig.js
# This uses sed to replace the URL while preserving the rest of the file
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|export const BACKEND_URL = 'https://[^']*'|export const BACKEND_URL = '$NGROK_URL'|g" "$CONFIG_FILE"
else
    # Linux
    sed -i "s|export const BACKEND_URL = 'https://[^']*'|export const BACKEND_URL = '$NGROK_URL'|g" "$CONFIG_FILE"
fi

echo -e "${GREEN}✓ Updated apiConfig.js with new ngrok URL${NC}"
echo ""

# Step 2: Build the frontend
echo -e "${GREEN}Step 2: Building frontend...${NC}"
if ! npm run build; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed successfully${NC}"
echo ""

# Step 3: Check if dist folder exists
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: dist folder not found after build${NC}"
    exit 1
fi

# Step 4: Copy dist files to parent directory (root of repo)
echo -e "${GREEN}Step 3: Copying dist files to repository root...${NC}"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
cp -r dist/* "$PARENT_DIR/" 2>/dev/null || {
    echo -e "${YELLOW}Warning: Some files might already exist. Continuing...${NC}"
    cp -r dist/* "$PARENT_DIR/" || true
}

echo -e "${GREEN}✓ Files copied to repository root${NC}"
echo ""

# Step 5: Navigate to parent directory and commit
cd "$PARENT_DIR"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Warning: Not a git repository. Skipping git operations.${NC}"
    echo -e "${GREEN}✓ Deployment complete! Files are ready in: $PARENT_DIR${NC}"
    exit 0
fi

# Step 6: Git operations
echo -e "${GREEN}Step 4: Committing changes...${NC}"
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo -e "${YELLOW}No changes to commit${NC}"
else
    git commit -m "Update backend URL to $NGROK_URL and rebuild"
    echo -e "${GREEN}✓ Changes committed${NC}"
fi
echo ""

# Step 7: Push to GitHub
echo -e "${GREEN}Step 5: Pushing to GitHub...${NC}"
read -p "Push to GitHub? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if git push origin main; then
        echo -e "${GREEN}✓ Successfully pushed to GitHub${NC}"
    else
        echo -e "${RED}Error: Failed to push to GitHub${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Skipped pushing to GitHub${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Wait 1-2 minutes for GitHub Pages to update"
echo "2. Visit: https://armoytuhin.github.io/professor-search-based/"
echo "3. Make sure your backend CORS includes the GitHub Pages URL"
echo ""

