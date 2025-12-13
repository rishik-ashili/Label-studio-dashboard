# Deployment Guide: Label Studio Dashboard

Deploy the Label Studio Dashboard to **dev.dobbe.ai/labelstudio-dashboard**

## 📋 Prerequisites

- Ubuntu/Debian server with sudo access
- Nginx installed
- Node.js v18+ installed
- Git repository cloned to `/home/ashilirishik/Label-studio-dashboard`

## 🚀 One-Time Setup

### 1. Install Systemd Service

Copy and enable the systemd service for the backend:

```bash
cd /home/ashilirishik/Label-studio-dashboard

# Copy service file to systemd directory
sudo cp deployment/labelstudio-dashboard.service /etc/systemd/system/

# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable labelstudio-dashboard

# Start the service
sudo systemctl start labelstudio-dashboard

# Verify service is running
sudo systemctl status labelstudio-dashboard
```

**Expected output:** Service should show `Active: active (running)`

### 2. Configure Nginx

Add the configuration to your existing Nginx site configuration:

```bash
# Option 1: Add to existing dev.dobbe.ai config
sudo nano /etc/nginx/sites-available/dev.dobbe.ai

# Paste the contents of deployment/labelstudio-dashboard.nginx.conf
# inside the server block
```

**OR**

```bash
# Option 2: Create separate config (if using includes)
sudo cp deployment/labelstudio-dashboard.nginx.conf /etc/nginx/conf.d/labelstudio-dashboard.conf
```

#### Complete Nginx Server Block Example

If you need a complete example, your Nginx config should look like:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name dev.dobbe.ai;

    # SSL configuration (if using HTTPS)
    # listen 443 ssl http2;
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/key.pem;

    # Root for main site
    root /var/www/dev.dobbe.ai;
    index index.html;

    # Label Studio Dashboard (paste nginx config here)
    location /labelstudio-dashboard {
        # ... config from labelstudio-dashboard.nginx.conf
    }
    
    location /labelstudio-dashboard/api {
        # ... config from labelstudio-dashboard.nginx.conf
    }
}
```

### 3. Test and Reload Nginx

```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### 4. Build Frontend

```bash
cd /home/ashilirishik/Label-studio-dashboard
npm run build
```

Verify the build:
- Check that `frontend/dist/` directory exists
- Contains `index.html` and `assets/` folder

---

## 📦 Deployment Process

### Automated Deployment

Use the deployment script for quick deployments:

```bash
cd /home/ashilirishik/Label-studio-dashboard
./deployment/deploy.sh
```

This script will:
1. ✅ Build the frontend
2. ✅ Restart the backend service
3. ✅ Reload Nginx configuration
4. ✅ Verify deployment

### Manual Deployment

If you prefer manual deployment:

```bash
# 1. Build frontend
npm run build

# 2. Restart backend service
sudo systemctl restart labelstudio-dashboard

# 3. Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔍 Verification

### Check Backend Service

```bash
# View service status
sudo systemctl status labelstudio-dashboard

# View real-time logs
sudo journalctl -u labelstudio-dashboard -f

# View last 50 lines of logs
sudo journalctl -u labelstudio-dashboard -n 50
```

### Test Backend API

```bash
# Test API endpoint
curl http://localhost:3000/api/notifications

# Expected: JSON response with notifications
```

### Test Frontend Access

1. Open browser: `https://dev.dobbe.ai/labelstudio-dashboard/`
2. Dashboard should load correctly
3. Check browser console for errors
4. Verify API calls in Network tab

### Test from Outside

```bash
# Test public access (from another machine or use curl)
curl https://dev.dobbe.ai/labelstudio-dashboard/

# Should return HTML content
```

---

## 🛠️ Common Commands

### Service Management

```bash
# Start service
sudo systemctl start labelstudio-dashboard

# Stop service
sudo systemctl stop labelstudio-dashboard

# Restart service
sudo systemctl restart labelstudio-dashboard

# View status
sudo systemctl status labelstudio-dashboard

# Enable auto-start on boot
sudo systemctl enable labelstudio-dashboard

# Disable auto-start
sudo systemctl disable labelstudio-dashboard
```

### Logs

```bash
# Follow logs in real-time
sudo journalctl -u labelstudio-dashboard -f

# View last 100 lines
sudo journalctl -u labelstudio-dashboard -n 100

# View logs from last hour
sudo journalctl -u labelstudio-dashboard --since "1 hour ago"

# View logs with timestamps
sudo journalctl -u labelstudio-dashboard -o short-iso
```

### Nginx

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🐛 Troubleshooting

### Issue: Dashboard page is blank

**Symptoms:** Page loads but shows blank screen

**Solutions:**
1. Check browser console for errors
2. Verify assets are loading from correct path
3. Rebuild frontend: `npm run build`
4. Clear browser cache

### Issue: API calls failing (CORS errors)

**Symptoms:** Network errors in browser console, CORS policy errors

**Solutions:**
1. Verify Nginx configuration has CORS headers
2. Check backend is running: `sudo systemctl status labelstudio-dashboard`
3. Test API directly: `curl http://localhost:3000/api/notifications`
4. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Issue: 404 errors for assets

**Symptoms:** CSS/JS files not loading, 404 errors in Network tab

**Solutions:**
1. Verify `base: '/labelstudio-dashboard/'` is set in `frontend/vite.config.js`
2. Rebuild frontend: `npm run build`
3. Check Nginx alias path is correct
4. Verify file permissions: `ls -la frontend/dist/`

### Issue: Backend service won't start

**Symptoms:** `systemctl status` shows failed state

**Solutions:**
1. Check logs: `sudo journalctl -u labelstudio-dashboard -n 50`
2. Verify working directory exists
3. Check Node.js is installed: `node --version`
4. Test backend manually: `cd backend && node src/server.js`
5. Check port 3000 is not in use: `sudo lsof -i :3000`

### Issue: Changes not reflecting

**Symptoms:** Updates to code not showing on website

**Solutions:**
1. Rebuild frontend: `npm run build`
2. Restart backend: `sudo systemctl restart labelstudio-dashboard`
3. Reload Nginx: `sudo systemctl reload nginx`
4. Clear browser cache (Ctrl+Shift+R)

---

## 📁 File Structure

```
/home/ashilirishik/Label-studio-dashboard/
├── backend/
│   └── src/
│       └── server.js          # Backend entry point
├── frontend/
│   ├── dist/                  # Built frontend (generated)
│   │   ├── index.html
│   │   └── assets/
│   └── vite.config.js         # Vite config with base path
└── deployment/
    ├── labelstudio-dashboard.nginx.conf  # Nginx config
    ├── labelstudio-dashboard.service     # Systemd service
    ├── deploy.sh                          # Deployment script
    └── README.md                          # This file
```

---

## 🔐 Security Notes

- Backend runs as user `ashilirishik` (non-root)
- Service has `NoNewPrivileges=true` for security
- API is only exposed through Nginx reverse proxy
- Consider adding rate limiting in Nginx for production
- Keep Node.js and dependencies updated

---

## 🔄 Updating the Application

### For Code Changes

```bash
# 1. Pull latest code
git pull origin main

# 2. Install any new dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# 3. Deploy
./deployment/deploy.sh
```

### For Configuration Changes

```bash
# If Nginx config changed
sudo cp deployment/labelstudio-dashboard.nginx.conf /etc/nginx/sites-available/dev.dobbe.ai
sudo nginx -t && sudo systemctl reload nginx

# If systemd service changed
sudo cp deployment/labelstudio-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart labelstudio-dashboard
```

---

## 📞 Support

If you encounter issues:
1. Check logs: `sudo journalctl -u labelstudio-dashboard -n 100`
2. Verify Nginx config: `sudo nginx -t`
3. Test backend directly: `curl http://localhost:3000/api/notifications`
4. Check this troubleshooting guide

---

**Dashboard URL:** https://dev.dobbe.ai/labelstudio-dashboard/
