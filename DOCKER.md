# Docker Deployment Guide

This guide covers running Hamnen using Docker Compose for a containerized deployment.

## Architecture

The Docker Compose setup consists of:

- **Frontend Container**: Nginx serving the React production build
- **Backend Container**: Node.js/Express API server
- **Shared Network**: `hamnen_network` for inter-container communication
- **Volume Mounts**:
  - Docker socket: `/var/run/docker.sock` (for container management)
  - Apps directory: `./apps` (application definitions)

## Quick Start

### 1. Build and Start

```bash
# Build and start all services
docker-compose up --build

# Or run in background (detached mode)
docker-compose up -d --build
```

### 2. Access Hamnen

Open your browser to: `http://localhost:3000`

### 3. Stop Services

```bash
# Stop and remove containers
docker-compose down

# Stop without removing
docker-compose stop
```

## Docker Compose Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Rebuild After Changes

```bash
# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Rebuild everything
docker-compose build
docker-compose up -d
```

### Check Status

```bash
# View running containers
docker-compose ps

# View resource usage
docker stats hamnen_backend hamnen_frontend
```

## Configuration

### Port Mapping

Default ports:
- Frontend: `3000:80`
- Backend: `3001:3001`

To change, edit `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Access on port 8080
```

### Environment Variables

Add environment variables in `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - PORT=3001
      - NODE_ENV=production
      - LOG_LEVEL=debug
```

Or use an `.env` file:

```bash
# .env file
BACKEND_PORT=3001
FRONTEND_PORT=3000
```

Then reference in `docker-compose.yml`:

```yaml
ports:
  - "${FRONTEND_PORT}:80"
```

## Volume Mounts

### Docker Socket

Required for Hamnen to manage Docker containers:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

**Security Note**: This gives the container full Docker access. Only run in trusted environments.

### Apps Directory

Mounted as read-only for security:

```yaml
volumes:
  - ./apps:/app/apps:ro
```

### Persistent Data

To persist application data, ensure volumes are properly configured in your app's `docker-compose.yml`:

```yaml
volumes:
  - ./volumes/data:/data
```

## Networking

### Container Communication

Services communicate via the `hamnen_network`:

- Frontend → Backend: `http://backend:3001`
- External → Frontend: `http://localhost:3000`
- External → Backend: `http://localhost:3001`

### Accessing Launched Applications

Applications launched by Hamnen need exposed ports. Example:

```yaml
# apps/myapp/docker-compose.yml
services:
  myapp:
    ports:
      - "8080:80"  # Accessible at localhost:8080
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check if port is in use
lsof -i :3000
lsof -i :3001

# Remove and rebuild
docker-compose down
docker-compose up --build
```

### Can't Manage Docker Containers

Ensure Docker socket is mounted:

```bash
# Check mount
docker exec hamnen_backend ls -la /var/run/docker.sock

# Verify permissions
docker exec hamnen_backend docker ps
```

### Frontend Can't Reach Backend

Check network configuration:

```bash
# Inspect network
docker network inspect hamnen_network

# Test connection from frontend
docker exec hamnen_frontend wget -O- http://backend:3001/health
```

### Application Volumes Not Persisting

Verify volume paths in app's `docker-compose.yml`:

```bash
# Check volumes
docker volume ls | grep hamnen

# Inspect volume
docker volume inspect hamnen_app_data
```

## Production Deployment

### Security Considerations

1. **Docker Socket**: Consider using Docker socket proxy (e.g., tecnativa/docker-socket-proxy)
2. **Network Isolation**: Use separate networks for different services
3. **SSL/TLS**: Add reverse proxy (Nginx/Traefik) with HTTPS
4. **Authentication**: Implement user authentication before deploying publicly

### Reverse Proxy Setup (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name hamnen.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Resource Limits

Add resource constraints:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Updating Hamnen

### Pull Latest Changes

```bash
# Stop services
docker-compose down

# Pull updates
git pull

# Rebuild and restart
docker-compose up --build -d
```

### Update Individual Service

```bash
# Backend only
docker-compose build backend
docker-compose up -d backend

# Frontend only
docker-compose build frontend
docker-compose up -d frontend
```

## Development with Docker

### Live Reloading

For development, mount source code as volumes:

```yaml
# docker-compose.dev.yml
services:
  backend:
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Backup and Restore

### Backup Application Data

```bash
# Backup apps directory
tar -czf hamnen-apps-backup.tar.gz apps/

# Backup running app volumes
docker run --rm -v hamnen_portainer_data:/data -v $(pwd):/backup \
  alpine tar -czf /backup/portainer-data.tar.gz -C /data .
```

### Restore

```bash
# Restore apps directory
tar -xzf hamnen-apps-backup.tar.gz

# Restart services
docker-compose up -d
```

## Complete Example

Full `docker-compose.yml` with all options:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: hamnen_backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./apps:/app/apps:ro
    environment:
      - PORT=3001
      - NODE_ENV=production
    networks:
      - hamnen-network
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: hamnen_frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - hamnen-network

networks:
  hamnen-network:
    name: hamnen_network
    driver: bridge
```

---

**Ready to set sail! ⚓**
