# Quick Deployment Reference

## 🚀 First Time Setup

```bash
cd /home/ashilirishik/Label-studio-dashboard
./deployment/setup.sh
```

Then manually configure Nginx:
```bash
sudo nano /etc/nginx/sites-available/dev.dobbe.ai
# Paste contents from deployment/labelstudio-dashboard.nginx.conf
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📦 Deploy Updates

```bash
cd /home/ashilirishik/Label-studio-dashboard
./deployment/deploy.sh
```

---

## 🔍 Quick Commands

```bash
# View logs
sudo journalctl -u labelstudio-dashboard -f

# Restart backend
sudo systemctl restart labelstudio-dashboard

# Check status
sudo systemctl status labelstudio-dashboard

# Test API
curl http://localhost:3000/api/notifications
```

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `deployment/labelstudio-dashboard.nginx.conf` | Nginx reverse proxy config |
| `deployment/labelstudio-dashboard.service` | Systemd service file |
| `deployment/setup.sh` | One-time setup script |
| `deployment/deploy.sh` | Deployment script |
| `deployment/README.md` | Full documentation |
| `frontend/vite.config.js` | Updated with base path |

---

## 🌐 Access

**URL:** https://dev.dobbe.ai/labelstudio-dashboard/

---

## 🆘 Troubleshooting

**Blank page?** Check browser console, rebuild: `npm run build`

**API errors?** Check backend: `sudo systemctl status labelstudio-dashboard`

**404 on assets?** Verify Nginx config and reload

See `deployment/README.md` for full troubleshooting guide.
