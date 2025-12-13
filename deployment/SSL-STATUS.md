# SSL Setup Fix - Current Status

## ✅ What's Working

Your Nginx configuration is now **correctly installed** for HTTP:
- Server block properly configured
- Location blocks for `/labelstudio-dashboard` working
- API proxy configured correctly
- File permissions fixed

## 🔐 SSL Issue

The config requires SSL certificates that don't exist at:
- `/etc/letsencrypt/live/dev.dobbe.ai/fullchain.pem`
- `/etc/letsencrypt/live/dev.dobbe.ai/privkey.pem`

## 🚀 Two Options to Access Your Dashboard

### Option 1: Access via HTTP (Works Now!)

Your dashboard is accessible RIGHT NOW at:
**http://dev.dobbe.ai/labelstudio-dashboard/**

> [!NOTE]
> Since dev.dobbe.ai appears to have Cloudflare or another proxy forcing HTTPS redirects, you might need to access it directly by IP or configure Cloudflare to allow HTTP.

### Option 2: Generate SSL Certificates (Recommended)

Run this command to generate SSL certificates:

```bash
sudo certbot certonly --nginx -d dev.dobbe.ai
```

Then apply the complete HTTPS config:

```bash
sudo cp /home/ashilirishik/Label-studio-dashboard/deployment/dev.dobbe.ai.nginx-COMPLETE.conf /etc/nginx/sites-available/dev.dobbe.ai
sudo nginx -t && sudo systemctl reload nginx
```

Or use the automated script:
```bash
./deployment/setup-ssl.sh
```

## 📋 Quick Commands

```bash
# Check what's currently configured
sudo nginx -t

# View current config
sudo cat /etc/nginx/sites-available/dev.dobbe.ai

# Test HTTP access (bypassing HTTPS redirect)
curl -L http://dev.dobbe.ai/labelstudio-dashboard/

# Check backend is running
sudo systemctl status labelstudio-dashboard
```

## 🔍 Current Configuration Files

- **HTTP-only** (currently active): `deployment/dev.dobbe.ai.nginx-HTTP-ONLY.conf`
- **HTTPS** (needs SSL certs): `deployment/dev.dobbe.ai.nginx-COMPLETE.conf`
- **SSL setup script**: `deployment/setup-ssl.sh`

## Summary

✅ **HTTP configuration is working** - just needs SSL certificates to enable HTTPS access or bypass Cloudflare redirect to access via HTTP.
