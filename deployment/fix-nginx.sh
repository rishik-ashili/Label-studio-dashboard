#!/bin/bash

# Script to fix the Nginx configuration for dev.dobbe.ai
# This replaces the incomplete config with a complete server block

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Fixing Nginx configuration for dev.dobbe.ai${NC}\n"

# Backup the old config
sudo cp /etc/nginx/sites-available/dev.dobbe.ai /etc/nginx/sites-available/dev.dobbe.ai.backup 2>/dev/null || true
echo -e "${GREEN}✅ Backed up existing config${NC}"

# Copy the complete config
sudo cp /home/ashilirishik/Label-studio-dashboard/deployment/dev.dobbe.ai.nginx-COMPLETE.conf /etc/nginx/sites-available/dev.dobbe.ai
echo -e "${GREEN}✅ Installed complete server block config${NC}"

# Enable the site (create symlink)
sudo ln -sf /etc/nginx/sites-available/dev.dobbe.ai /etc/nginx/sites-enabled/dev.dobbe.ai
echo -e "${GREEN}✅ Enabled site${NC}"

# Test Nginx configuration
echo -e "\n${YELLOW}Testing Nginx configuration...${NC}"
sudo nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration test passed${NC}\n"
    
    # Reload Nginx
    echo -e "${YELLOW}Reloading Nginx...${NC}"
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded${NC}\n"
    
    echo -e "${GREEN}✨ Configuration fixed!${NC}"
    echo -e "${YELLOW}Try visiting:${NC} https://dev.dobbe.ai/labelstudio-dashboard/"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    echo -e "${YELLOW}Restoring backup...${NC}"
    sudo cp /etc/nginx/sites-available/dev.dobbe.ai.backup /etc/nginx/sites-available/dev.dobbe.ai
    exit 1
fi
