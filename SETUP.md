# Setup Guide for Hamnen

This guide will help you get Hamnen up and running in just a few minutes.

## Step 1: Prerequisites Check

Before starting, verify you have the required software:

```bash
# Check Docker
docker --version
docker-compose --version

# Check Node.js (should be 16+)
node --version
npm --version
```

If any are missing:
- **Docker**: Install from [docker.com](https://docs.docker.com/get-docker/)
- **Node.js**: Install from [nodejs.org](https://nodejs.org/) or use [nvm](https://github.com/nvm-sh/nvm)

## Step 2: Install Dependencies

From the project root directory:

```bash
# Option 1: Install all at once (recommended)
npm run install:all

# Option 2: Install separately
cd backend && npm install
cd ../frontend && npm install
```

## Step 3: Start the Services

### Terminal 1 - Backend Server

```bash
cd backend
npm start
```

You should see:
```
🚀 Hamnen backend server running on port 3001
```

### Terminal 2 - Frontend Server

Open a new terminal window/tab:

```bash
cd frontend
npm start
```

The browser should automatically open to `http://localhost:3000`

## Step 4: Verify Installation

1. Open your browser to `http://localhost:3000`
2. You should see three example applications:
   - 🐳 Portainer
   - 🌐 Nginx Demo
   - 🔍 WhoAmI

3. Try launching an application:
   - Click "Launch" on the Nginx Demo card
   - Wait for the status to change to "Running"
   - The application should open in a new tab

## Step 5: Test Each Application

### Nginx Demo (Port 8080)
- Click "Launch" on Nginx Demo
- Should open to `http://localhost:8080`
- You'll see a welcome page

### WhoAmI (Port 8081)
- Click "Launch" on WhoAmI
- Should open to `http://localhost:8081`
- Displays system and request information

### Portainer (Port 9000)
- Click "Launch" on Portainer
- Should open to `http://localhost:9000`
- First time: Create an admin user
- Full Docker management interface

## Common Issues

### Issue: "Cannot connect to backend"

**Solution:**
- Verify backend is running on port 3001
- Check terminal for errors
- Try: `curl http://localhost:3001/health`

### Issue: "Port already in use"

**Solution:**
```bash
# Find what's using the port
lsof -i :3001  # or :3000, :8080, etc.

# Kill the process or change the port
PORT=3002 npm start
```

### Issue: "Docker command failed"

**Solution:**
- Verify Docker daemon is running: `docker ps`
- Check Docker permissions: `docker run hello-world`
- On Linux: Add user to docker group: `sudo usermod -aG docker $USER`

### Issue: Application stuck on "Starting"

**Solution:**
```bash
# Check container status
docker ps -a | grep hamnen

# View container logs
docker logs hamnen_APP_NAME

# Manually stop if needed
cd apps/APP_NAME
docker-compose down
```

## Development Mode

For development with auto-reload:

```bash
# Terminal 1 - Backend with nodemon
cd backend
npm run dev

# Terminal 2 - Frontend with hot-reload
cd frontend
npm start
```

## Next Steps

Now that Hamnen is running:

1. **Add your own applications** - See "Adding New Applications" in README.md
2. **Customize the UI** - Edit `frontend/src/App.css` for styling
3. **Configure settings** - Adjust ports and behavior as needed

## Quick Reference

### Start Everything
```bash
# Terminal 1
npm run start:backend

# Terminal 2
npm run start:frontend
```

### Stop Everything
```bash
# Ctrl+C in both terminals

# Stop all Hamnen containers
docker ps -a | grep hamnen | awk '{print $1}' | xargs docker stop
docker ps -a | grep hamnen | awk '{print $1}' | xargs docker rm
```

### Add New Application
```bash
# 1. Create directory
mkdir -p apps/my-app/volumes

# 2. Create description.json (see README.md)
nano apps/my-app/description.json

# 3. Create docker-compose.yml
nano apps/my-app/docker-compose.yml

# 4. Refresh browser - app appears automatically!
```

## Support

If you encounter issues:

1. Check the console in your browser (F12)
2. Check backend terminal for errors
3. Review the Troubleshooting section in README.md
4. Check Docker logs: `docker logs hamnen_APP_NAME`

---

**You're all set! Start launching applications! 🚀**
