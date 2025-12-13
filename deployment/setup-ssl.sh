#!/bin/bash

# Quick SSL setup for dev.dobbe.ai using certbot

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📜 Generating SSL certificate for dev.dobbe.ai${NC}\n"

# Run certbot for dev.dobbe.ai
sudo certbot certonly --nginx -d dev.dobbe.ai

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ SSL certificate generated${NC}"
    
    # Now install the complete HTTPS config
    echo -e "${YELLOW}Installing HTTPS configuration...${NC}"
    sudo cp /home/ashilirishik/Label-studio-dashboard/deployment/dev.dobbe.ai.nginx-COMPLETE.conf /etc/nginx/sites-available/dev.dobbe.ai
    
    # Test and reload
    sudo nginx -t && sudo systemctl reload nginx
    
    echo -e "${GREEN}✨ Done! Visit: https://dev.dobbe.ai/labelstudio-dashboard/${NC}"
else
    echo -e "${RED}❌ SSL generation failed${NC}"
    echo -e "${YELLOW}You can access via HTTP: http://dev.dobbe.ai/labelstudio-dashboard/${NC}"
fi
