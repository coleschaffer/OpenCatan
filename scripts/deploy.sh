#!/bin/bash
# OpenCatan Unified Deployment Script
# Deploys both PartyKit backend and builds frontend for Cloudflare Pages

set -e  # Exit on error

echo "🎮 OpenCatan Deployment Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're deploying PartyKit
echo -e "${YELLOW}Step 1: Deploy PartyKit Backend${NC}"
echo "This will deploy your multiplayer server to Cloudflare..."
echo ""

npx partykit deploy

echo ""
echo -e "${GREEN}✓ PartyKit deployed!${NC}"
echo ""
echo -e "${YELLOW}Please copy your PartyKit URL from above.${NC}"
echo "It looks like: https://open-catan.YOURNAME.partykit.dev"
echo ""
read -p "Press Enter to continue..."

echo ""
echo -e "${YELLOW}Step 2: Build Frontend${NC}"
echo "Building production frontend..."
echo ""

npm run build

echo ""
echo -e "${GREEN}✓ Frontend built successfully!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Next steps for Cloudflare Pages:"
echo "1. Go to https://dash.cloudflare.com/"
echo "2. Create a Pages project from your GitHub repo"
echo "3. Add environment variable: VITE_PARTYKIT_HOST=<your-partykit-url>"
echo "4. Cloudflare will auto-deploy on every push!"
echo ""
echo "Or manually deploy the 'dist' folder to any static host."
echo ""
