# Label Studio Dashboard

A React-based analytics dashboard for monitoring Label Studio annotation projects, deployed at **https://ovhlabel.dobbe.ai/labelstudio-dashboard/**

## 📋 Table of Contents

- [System Architecture](#system-architecture)
- [Quick Start](#quick-start)
- [Making Changes](#making-changes)
- [Server Management](#server-management)
- [Deployment Commands](#deployment-commands)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

---

## 🏗️ System Architecture

### Components

```
┌─────────────────────────────────────────────────┐
│  Browser: https://ovhlabel.dobbe.ai/           │
│           labelstudio-dashboard/                │
└────────────────┬────────────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────┐
│  Nginx (Port 443)                               │
│  ├─ /labelstudio-dashboard/     → Static Files │
│  ├─ /labelstudio-dashboard/api  → Backend API  │
│  └─ /                            → Label Studio │
└────────────┬────────────────────────────────────┘
             │
             ├──────────────────┬──────────────────┐
             ▼                  ▼                  ▼
    ┌─────────────────┐  ┌─────────────┐  ┌──────────────┐
    │ Static Files    │  │ Backend API │  │ Label Studio │
    │ (React Build)   │  │ Node.js     │  │ (Port 8080)  │
    │ frontend/dist/  │  │ Port 3000   │  └──────────────┘
    └─────────────────┘  └─────────────┘
```

### Technology Stack

- **Frontend**: React + Vite, Recharts, TailwindCSS
- **Backend**: Node.js + Express
- **Web Server**: Nginx (reverse proxy + static file serving)
- **Process Manager**: systemd
- **Deployment**: Built static files + systemd service

---

## 🚀 Quick Start

### Access the Dashboard

URL: **https://ovhlabel.dobbe.ai/labelstudio-dashboard/**

### Check if Everything is Running

```bash
# Check backend service
sudo systemctl status labelstudio-dashboard

# Check Nginx
sudo systemctl status nginx

# Test backend API
curl https://ovhlabel.dobbe.ai/labelstudio-dashboard/api/notifications
```

---

## 🛠️ Making Changes

### Frontend Changes (React UI)

When you make changes to any file in `frontend/src/`:

```bash
# 1. Navigate to project root
cd /home/ashilirishik/Label-studio-dashboard

# 2. Rebuild the frontend
npm run build

# 3. Refresh your browser (Ctrl + Shift + R)
# Backend doesn't need restart for frontend changes
```

**What happens:**
- React app is rebuilt into `frontend/dist/`
- Static files are updated
- Nginx serves the new files automatically
- No backend restart needed

### Backend Changes (Node.js API)

When you make changes to any file in `backend/src/`:

```bash
# 1. Navigate to project root
cd /home/ashilirishik/Label-studio-dashboard

# 2. Restart the backend service
sudo systemctl restart labelstudio-dashboard

# 3. Check it started correctly
sudo systemctl status labelstudio-dashboard

# 4. View logs if needed
sudo journalctl -u labelstudio-dashboard -f
```

**What happens:**
- Backend service restarts with new code
- API endpoints reload
- Takes ~2-5 seconds
- No frontend rebuild needed

### Both Frontend and Backend Changes

```bash
# Quick rebuild and restart everything
npm run build && sudo systemctl restart labelstudio-dashboard
```

### Nginx Configuration Changes

When you modify Nginx config in `deployment/`:

```bash
# 1. Copy new config to Nginx
sudo cp deployment/ovhlabel.dobbe.ai.nginx.conf /etc/nginx/sites-available/ovhlabel.dobbe.ai

# 2. Test configuration
sudo nginx -t

# 3. Reload Nginx (if test passed)
sudo systemctl reload nginx
```

---

## 🔄 Server Management

### Backend Service (Node.js)

```bash
# Start the service
sudo systemctl start labelstudio-dashboard

# Stop the service
sudo systemctl stop labelstudio-dashboard

# Restart the service (use this after code changes)
sudo systemctl restart labelstudio-dashboard

# Check status
sudo systemctl status labelstudio-dashboard

# Enable auto-start on boot (already enabled)
sudo systemctl enable labelstudio-dashboard

# Disable auto-start on boot
sudo systemctl disable labelstudio-dashboard
```

### View Logs

```bash
# Follow logs in real-time
sudo journalctl -u labelstudio-dashboard -f

# View last 100 lines
sudo journalctl -u labelstudio-dashboard -n 100

# View logs from last hour
sudo journalctl -u labelstudio-dashboard --since "1 hour ago"

# View logs from specific time
sudo journalctl -u labelstudio-dashboard --since "2025-12-13 10:00:00"
```

### Nginx Management

```bash
# Reload configuration (no downtime)
sudo systemctl reload nginx

# Restart Nginx (brief downtime)
sudo systemctl restart nginx

# Test configuration before applying
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

---

## 📦 Deployment Commands

### Full Deployment (Automated)

```bash
cd /home/ashilirishik/Label-studio-dashboard
./deployment/deploy.sh
```

This script automatically:
1. ✅ Builds frontend (`npm run build`)
2. ✅ Restarts backend service
3. ✅ Reloads Nginx
4. ✅ Verifies everything is working

### Manual Deployment

```bash
# Step by step
cd /home/ashilirishik/Label-studio-dashboard

# 1. Build frontend
npm run build

# 2. Restart backend
sudo systemctl restart labelstudio-dashboard

# 3. Reload Nginx (if config changed)
sudo systemctl reload nginx

# 4. Verify
curl https://ovhlabel.dobbe.ai/labelstudio-dashboard/api/notifications
```

---

## 🐛 Troubleshooting

### Dashboard Not Loading

**Check 1: Is Nginx running?**
```bash
sudo systemctl status nginx
```

**Check 2: Are static files built?**
```bash
ls -la frontend/dist/
# Should show index.html and assets/
```

**Check 3: Browser cache**
- Hard refresh: `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)

### API Errors / No Data

**Check 1: Is backend running?**
```bash
sudo systemctl status labelstudio-dashboard
```

**Check 2: Test API directly**
```bash
curl http://localhost:3000/api/notifications
```

**Check 3: View backend logs**
```bash
sudo journalctl -u labelstudio-dashboard -n 50
```

### Backend Won't Start

**View error logs:**
```bash
sudo journalctl -u labelstudio-dashboard -n 50 --no-pager
```

**Common issues:**
1. Port 3000 already in use
   ```bash
   sudo lsof -i :3000
   ```

2. Working directory doesn't exist
   ```bash
   ls -la /home/ashilirishik/Label-studio-dashboard/backend
   ```

3. Node.js not installed
   ```bash
   node --version  # Should show v18+
   ```

### Changes Not Reflecting

1. **Frontend changes not showing:**
   ```bash
   npm run build  # Rebuild
   # Then hard refresh browser (Ctrl+Shift+R)
   ```

2. **Backend changes not applying:**
   ```bash
   sudo systemctl restart labelstudio-dashboard
   ```

3. **Still not working:**
   ```bash
   # Clear browser cache completely
   # Check browser console for errors (F12)
   ```

---

## 📁 Project Structure

```
Label-studio-dashboard/
├── frontend/                      # React application
│   ├── src/                       # Source code
│   │   ├── components/            # React components
│   │   ├── services/              # API services
│   │   │   └── api.js            # API configuration
│   │   └── utils/                 # Utilities
│   ├── dist/                      # Built files (generated)
│   ├── vite.config.js            # Vite config (base: '/labelstudio-dashboard/')
│   └── package.json
│
├── backend/                       # Node.js API server
│   ├── src/
│   │   ├── server.js             # Entry point
│   │   ├── routes/               # API routes
│   │   └── services/             # Business logic
│   ├── storage/                   # Data cache
│   └── package.json
│
├── deployment/                    # Deployment configs
│   ├── labelstudio-dashboard.service      # Systemd service file
│   ├── ovhlabel.dobbe.ai.nginx.conf      # Nginx configuration
│   ├── deploy.sh                          # Automated deployment script
│   ├── README.md                          # Deployment guide
│   └── QUICK_START.md                     # Quick reference
│
├── package.json                   # Root package.json
└── README.md                      # This file
```

### Important Files

| File | Purpose | When to Edit |
|------|---------|--------------|
| `frontend/src/services/api.js` | API endpoint URL | Never (already configured) |
| `frontend/vite.config.js` | Build configuration | Never (already configured) |
| `backend/src/server.js` | Backend entry point | When changing port or adding routes |
| `deployment/*.nginx.conf` | Nginx configuration | When changing paths or proxy settings |
| `deployment/*.service` | Systemd service | When changing port or working directory |

---

## 🔧 Configuration

### Environment Variables

Backend uses these environment variables (set in systemd service):

```bash
NODE_ENV=production
PORT=3000
```

To change them:
```bash
sudo nano /etc/systemd/system/labelstudio-dashboard.service
# Edit the Environment lines
sudo systemctl daemon-reload
sudo systemctl restart labelstudio-dashboard
```

### API Base URL

Frontend API calls go to: `/labelstudio-dashboard/api`

This is configured in `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = '/labelstudio-dashboard/api';
```

Nginx proxies this to: `http://localhost:3000/api`

### Build Configuration

Frontend base path is set in `frontend/vite.config.js`:
```javascript
export default defineConfig({
  base: '/labelstudio-dashboard/',
  // ...
})
```

This ensures all assets load from the correct subdomain path.

---

## 🎯 Common Tasks

### Task 1: Update Dashboard Code

```bash
# Pull latest code from git
git pull

# Install any new dependencies
npm install

# Rebuild and restart
npm run build
sudo systemctl restart labelstudio-dashboard
```

### Task 2: Check Logs for Errors

```bash
# Backend logs
sudo journalctl -u labelstudio-dashboard -f

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Browser console
# Press F12 in browser → Console tab
```

### Task 3: Server Reboot Recovery

After server reboot, everything starts automatically because:
- Systemd service is enabled: `WantedBy=multi-user.target`
- Nginx is enabled by default

Verify after reboot:
```bash
sudo systemctl status labelstudio-dashboard
sudo systemctl status nginx
```

### Task 4: Change Backend Port

```bash
# 1. Edit systemd service
sudo nano /etc/systemd/system/labelstudio-dashboard.service
# Change: Environment="PORT=3000" to new port

# 2. Edit Nginx config
sudo nano /etc/nginx/sites-available/ovhlabel.dobbe.ai
# Change: proxy_pass http://localhost:3000 to new port

# 3. Apply changes
sudo systemctl daemon-reload
sudo systemctl restart labelstudio-dashboard
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📞 Support & Resources

### Documentation

- **Full Deployment Guide**: `deployment/README.md`
- **Quick Reference**: `deployment/QUICK_START.md`
- **Walkthrough**: `.gemini/antigravity/brain/.../walkthrough.md`

### Useful Commands Cheat Sheet

```bash
# Most common commands you'll use:

# After changing frontend code:
npm run build

# After changing backend code:
sudo systemctl restart labelstudio-dashboard

# View backend logs:
sudo journalctl -u labelstudio-dashboard -f

# Test API:
curl https://ovhlabel.dobbe.ai/labelstudio-dashboard/api/notifications

# Check what's running:
sudo systemctl status labelstudio-dashboard
sudo systemctl status nginx
```

---

## 🔐 Security Notes

- Backend runs as user `ashilirishik` (non-root)
- API only accessible through Nginx proxy (not exposed directly)
- HTTPS enabled with SSL certificates
- Security hardening enabled in systemd service

---

## 🚀 Access URL

**Production Dashboard**: https://ovhlabel.dobbe.ai/labelstudio-dashboard/

**Label Studio** (existing): https://ovhlabel.dobbe.ai/

---

**Version**: 1.0.0  
**Last Updated**: December 2025
