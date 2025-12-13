#!/bin/bash

# One-time setup script for Label Studio Dashboard deployment
# Run this script once to set up systemd service and Nginx configuration

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Label Studio Dashboard - One-Time Setup${NC}\n"

PROJECT_DIR="/home/ashilirishik/Label-studio-dashboard"

# Check if running from correct directory
if [ ! -f "$PROJECT_DIR/deployment/labelstudio-dashboard.service" ]; then
    echo -e "${RED}❌ Error: Service file not found${NC}"
    echo -e "Please run this script from: $PROJECT_DIR"
    exit 1
fi

# Step 1: Install systemd service
echo -e "${YELLOW}📋 Installing systemd service...${NC}"
sudo cp "$PROJECT_DIR/deployment/labelstudio-dashboard.service" /etc/systemd/system/
echo -e "${GREEN}✅ Service file copied${NC}"

# Reload systemd
sudo systemctl daemon-reload
echo -e "${GREEN}✅ Systemd reloaded${NC}"

# Enable service
sudo systemctl enable labelstudio-dashboard
echo -e "${GREEN}✅ Service enabled (will start on boot)${NC}"

# Start service
sudo systemctl start labelstudio-dashboard
echo -e "${GREEN}✅ Service started${NC}\n"

# Check service status
if sudo systemctl is-active --quiet labelstudio-dashboard; then
    echo -e "${GREEN}✅ Backend service is running!${NC}\n"
    sudo systemctl status labelstudio-dashboard --no-pager -l | head -n 8
else
    echo -e "${RED}❌ Warning: Service failed to start${NC}"
    echo -e "${YELLOW}Checking logs:${NC}"
    sudo journalctl -u labelstudio-dashboard -n 20 --no-pager
    exit 1
fi

# Step 2: Nginx configuration
echo -e "\n${YELLOW}📝 Nginx Configuration Setup${NC}\n"
echo -e "${BLUE}Please manually add the Nginx configuration to your server block:${NC}"
echo -e "1. Edit your Nginx config:"
echo -e "   ${YELLOW}sudo nano /etc/nginx/sites-available/dev.dobbe.ai${NC}\n"
echo -e "2. Add the contents from:"
echo -e "   ${YELLOW}$PROJECT_DIR/deployment/labelstudio-dashboard.nginx.conf${NC}\n"
echo -e "3. Test and reload Nginx:"
echo -e "   ${YELLOW}sudo nginx -t && sudo systemctl reload nginx${NC}\n"

echo -e "${BLUE}Or view the config to copy:${NC}"
echo -e "${YELLOW}cat $PROJECT_DIR/deployment/labelstudio-dashboard.nginx.conf${NC}\n"

# Step 3: Build frontend
echo -e "${YELLOW}📦 Building frontend...${NC}"
cd "$PROJECT_DIR"
npm run build

if [ -d "frontend/dist" ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}\n"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Summary
echo -e "${GREEN}✨ Setup Complete!${NC}\n"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Next Steps:${NC}"
echo -e "1. Configure Nginx (see instructions above)"
echo -e "2. Test: ${BLUE}https://dev.dobbe.ai/labelstudio-dashboard/${NC}"
echo -e "3. Deploy updates: ${BLUE}./deployment/deploy.sh${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  View logs:    ${BLUE}sudo journalctl -u labelstudio-dashboard -f${NC}"
echo -e "  Restart:      ${BLUE}sudo systemctl restart labelstudio-dashboard${NC}"
echo -e "  Status:       ${BLUE}sudo systemctl status labelstudio-dashboard${NC}"
echo -e "  Deploy:       ${BLUE}./deployment/deploy.sh${NC}\n"

echo -e "${GREEN}📖 Full documentation: ${BLUE}deployment/README.md${NC}\n"
