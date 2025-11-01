# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hamnen (Swedish for "the harbor") is a web-based Docker application launcher that allows users to start Docker applications with one click. It consists of a Node.js/Express backend and React frontend, with applications defined in docker-compose files.

## Architecture

### Core Components
- **Backend** (`backend/`): Express server managing Docker containers via dockerode and shell commands
- **Frontend** (`frontend/`): React SPA with proxy to backend API
- **Applications** (`apps/`): Directory containing application definitions with `description.json` and `docker-compose.yml`

### Key Backend Files
- `server.js`: Main Express server entry point
- `utils/appLoader.js`: Scans and loads application definitions from `apps/` directory
- `utils/docker.js`: Manages Docker Compose operations (start, stop, status, logs)
- `controllers/appsController.js`: API endpoints for application management
- `routes/apps.js`: Express routing for `/api/apps` endpoints

### Application Structure
Each app in `apps/` directory requires:
- `description.json`: Metadata (name, description, icon, port, path, healthCheck, tags)
- `docker-compose.yml`: Docker Compose configuration
- `volumes/` (optional): Persistent data storage

## Development Commands

### Setup and Installation
```bash
# Install all dependencies
npm run install:all

# Or install separately
cd backend && npm install
cd frontend && npm install
```

### Development Mode (Local)
```bash
# Terminal 1 - Backend with auto-reload
cd backend && npm run dev

# Terminal 2 - Frontend with hot-reload
cd frontend && npm start
```

### Production Mode (Docker)
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down
```

### Individual Service Management
```bash
# Start/restart specific services
npm run start:backend
npm run start:frontend
npm run dev:backend
npm run dev:frontend

# Build frontend
npm run build:frontend
```

### Docker Commands
```bash
# View logs
docker-compose logs -f
docker-compose logs -f backend

# Restart services
docker-compose restart
docker-compose restart backend

# Check status
docker-compose ps
```

## Development Workflow

### Adding New Applications
1. Create directory: `mkdir -p apps/my-app/volumes`
2. Create `description.json` with required fields (name, description, icon, port, path, tags)
3. Create `docker-compose.yml` with container configuration
4. Use `hamnen_` prefix for container names and `hamnen_{app-name}` project name
5. Applications appear automatically on frontend refresh

### Testing Applications
- Use health check URLs defined in `description.json`
- Check container status via Docker API
- View logs through API endpoint: `/api/apps/:name/logs`

### API Development
Backend exposes REST API at `/api/apps`:
- `GET /api/apps` - List all applications with status
- `GET /api/apps/:name` - Get specific application
- `POST /api/apps/:name/start` - Start application containers
- `POST /api/apps/:name/stop` - Stop and remove containers
- `GET /api/apps/:name/logs?lines=100` - Get application logs

## Architecture Notes

### Docker Integration
- Backend mounts Docker socket (`/var/run/docker.sock`) for container management
- Uses docker-compose with project naming: `hamnen_{app-name}`
- Applications run in separate compose projects for isolation

### Environment Configuration
- **Development**: Backend on 3001, Frontend on 3000 with proxy
- **Docker**: Frontend on port 3003 (configurable), Backend on 3001
- Apps directory: `/app/apps` in Docker, `../../apps` locally (via `APPS_DIR` env var)

### Frontend-Backend Communication
- Development: Frontend proxies API calls to `localhost:3001`
- Docker: Both services communicate via `hamnen-network`
- Real-time status updates through polling (not WebSocket)

### Security Considerations
- Docker socket access required - only run in trusted environments
- Applications directory mounted read-only in Docker
- No built-in authentication - consider adding for production use

## Common Issues and Solutions

### Port Conflicts
```bash
# Check what's using a port
lsof -i :PORT_NUMBER

# Kill conflicting processes or change ports in docker-compose.yml
```

### Application Stuck Starting
```bash
# Check container status
docker ps -a | grep hamnen

# View container logs
docker logs hamnen_APP_NAME

# Manual cleanup
cd apps/APP_NAME && docker-compose down
```

### Development Environment
- Use `nodemon` for backend auto-reload
- Frontend hot-reload enabled by default with react-scripts
- Docker socket must be accessible (Linux: add user to docker group)