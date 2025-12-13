#!/bin/bash

# Deployment script for Label Studio Dashboard
# Subdomain: dev.dobbe.ai/labelstudio-dashboard

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/ashilirishik/Label-studio-dashboard"

echo -e "${BLUE}🚀 Starting deployment of Label Studio Dashboard${NC}\n"

# Step 1: Build frontend
echo -e "${YELLOW}📦 Building frontend...${NC}"
cd "$PROJECT_DIR"
npm run build

if [ ! -d "frontend/dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build complete${NC}\n"

# Step 2: Restart backend service
echo -e "${YELLOW}🔄 Restarting backend service...${NC}"
sudo systemctl restart labelstudio-dashboard

# Wait for service to start
sleep 2

# Check if service is running
if sudo systemctl is-active --quiet labelstudio-dashboard; then
    echo -e "${GREEN}✅ Backend service is running${NC}\n"
else
    echo -e "${RED}❌ Backend service failed to start${NC}"
    echo -e "${YELLOW}Checking service logs:${NC}"
    sudo journalctl -u labelstudio-dashboard -n 20 --no-pager
    exit 1
fi

# Step 3: Reload Nginx
echo -e "${YELLOW}🔄 Reloading Nginx configuration...${NC}"
sudo nginx -t

if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx configuration reloaded${NC}\n"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi

# Step 4: Verification
echo -e "${BLUE}🔍 Verifying deployment...${NC}\n"

# Check if backend is responding
echo -e "${YELLOW}Testing backend API...${NC}"
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/notifications)

if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Backend API is responding (HTTP $BACKEND_RESPONSE)${NC}"
else
    echo -e "${RED}⚠️  Backend API returned HTTP $BACKEND_RESPONSE${NC}"
fi

# Check if static files exist
echo -e "${YELLOW}Checking static files...${NC}"
if [ -f "$PROJECT_DIR/frontend/dist/index.html" ]; then
    echo -e "${GREEN}✅ Static files are present${NC}"
else
    echo -e "${RED}❌ index.html not found in dist directory${NC}"
fi

echo -e "\n${GREEN}✨ Deployment complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🌐 Dashboard URL: https://dev.dobbe.ai/labelstudio-dashboard/${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Show service status
echo -e "${YELLOW}Service Status:${NC}"
sudo systemctl status labelstudio-dashboard --no-pager -l | head -n 10

echo -e "\n${YELLOW}📝 Useful commands:${NC}"
echo -e "  View logs:    ${BLUE}sudo journalctl -u labelstudio-dashboard -f${NC}"
echo -e "  Stop service: ${BLUE}sudo systemctl stop labelstudio-dashboard${NC}"
echo -e "  Start service: ${BLUE}sudo systemctl start labelstudio-dashboard${NC}"
echo -e "  Restart service: ${BLUE}sudo systemctl restart labelstudio-dashboard${NC}"
