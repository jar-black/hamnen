# 🚢 Hamnen - Docker Application Launcher

Hamnen (Swedish for "the harbor") is a web-based UI that allows you to launch Docker applications with a single click. Each application is represented as a card, and clicking "Launch" will start the Docker containers and redirect you to the application's interface.

## Features

- 🎯 **One-Click Launch**: Start Docker applications instantly from a beautiful card interface
- 📊 **Status Monitoring**: Real-time status updates for all applications
- 🔄 **Auto-Redirect**: Automatically opens application UI after successful launch
- 🏷️ **Tagging & Search**: Organize and find applications easily
- 🎨 **Modern UI**: Responsive design with visual status indicators
- 🐳 **Docker Native**: Uses docker-compose for reliable container management

## Prerequisites

- Docker and Docker Compose installed
- Node.js 16+ (for running the backend and frontend)
- Linux/macOS (or WSL2 on Windows)

## Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start the Backend

```bash
cd backend
npm start
```

The backend server will start on `http://localhost:3001`

### 3. Start the Frontend

In a new terminal:

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

### 4. Launch Applications

- Browse the available applications on the main page
- Click "Launch" on any card to start the application
- Wait for the application to start (status will update automatically)
- The application will open in a new tab once ready
- Use "Stop" to shut down running applications

## Project Structure

```
hamnen/
├── backend/                  # Node.js/Express backend
│   ├── server.js            # Main server file
│   ├── routes/              # API routes
│   ├── controllers/         # Request handlers
│   └── utils/               # Docker & app management utilities
├── frontend/                # React frontend
│   ├── src/
│   │   ├── App.js          # Main app component
│   │   └── components/     # React components
│   └── public/             # Static files
└── apps/                   # Application definitions
    ├── portainer/
    │   ├── description.json
    │   ├── docker-compose.yml
    │   └── volumes/
    ├── nginx-demo/
    └── whoami/
```

## Adding New Applications

To add a new application to Hamnen:

### 1. Create Application Directory

```bash
mkdir -p apps/my-app/volumes
```

### 2. Create `description.json`

```json
{
  "name": "My Application",
  "description": "Brief description of what this app does",
  "icon": "🚀",
  "port": 8080,
  "path": "/",
  "healthCheck": "http://localhost:8080/health",
  "tags": ["category1", "category2"]
}
```

**Fields:**
- `name`: Display name shown on the card
- `description`: Short description (2-3 sentences)
- `icon`: Emoji or icon character
- `port`: Main port the application exposes
- `path`: URL path to access the app (usually `/`)
- `healthCheck`: URL to check if app is running (optional)
- `tags`: Array of category tags for filtering

### 3. Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  my-app:
    image: my-app:latest
    container_name: hamnen_my_app
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./volumes/data:/data
```

**Important:**
- Use `hamnen_` prefix for container names to keep things organized
- Mount volumes to the `./volumes/` directory within the app folder
- The project name is automatically set to `hamnen_{app-name}`

### 4. Restart Backend

The backend automatically scans the `apps/` directory on each request, so your new application will appear immediately!

## API Endpoints

The backend provides a REST API for managing applications:

### List All Applications
```
GET /api/apps
```

Returns all available applications with their current status.

### Get Specific Application
```
GET /api/apps/:name
```

Returns details for a specific application.

### Start Application
```
POST /api/apps/:name/start
```

Starts the application's Docker containers.

### Stop Application
```
POST /api/apps/:name/stop
```

Stops and removes the application's Docker containers.

### Get Application Logs
```
GET /api/apps/:name/logs?lines=100
```

Returns recent logs from the application's containers.

## Example Applications

Hamnen comes with three example applications:

### 1. Portainer (Port 9000)
Docker management UI for managing containers, images, networks, and volumes.

### 2. Nginx Demo (Port 8080)
Simple static website served by Nginx, demonstrating volume mounting.

### 3. WhoAmI (Port 8081)
Tiny Go webserver that displays OS and HTTP request information.

## Configuration

### Backend Port
The backend runs on port 3001 by default. To change this:

```bash
PORT=3002 npm start
```

### Frontend Proxy
The frontend proxies API requests to `http://localhost:3001` by default. This is configured in `frontend/package.json`:

```json
"proxy": "http://localhost:3001"
```

## Troubleshooting

### Applications Won't Start

1. Check if Docker is running:
   ```bash
   docker ps
   ```

2. Check backend logs for error messages

3. Verify the docker-compose.yml file is valid:
   ```bash
   cd apps/my-app
   docker-compose config
   ```

### Port Conflicts

If an application fails to start due to port conflicts:

1. Check what's using the port:
   ```bash
   lsof -i :PORT_NUMBER
   ```

2. Either stop the conflicting service or change the port in the app's `docker-compose.yml`

### Applications Stuck in "Starting"

1. Check container status:
   ```bash
   docker ps -a
   ```

2. View container logs:
   ```bash
   docker logs hamnen_APP_NAME
   ```

## Development

### Running in Development Mode

Backend with auto-reload:
```bash
cd backend
npm run dev
```

Frontend with hot-reload:
```bash
cd frontend
npm start
```

### Building for Production

```bash
cd frontend
npm run build
```

This creates an optimized production build in `frontend/build/`.

## Security Considerations

⚠️ **Important Security Notes:**

- Hamnen requires access to the Docker socket (`/var/run/docker.sock`)
- Only run Hamnen in trusted environments
- Do not expose the backend directly to the internet without authentication
- Consider implementing authentication if deploying in shared environments

## Future Enhancements

Potential features for future versions:

- [ ] User authentication and multi-tenancy
- [ ] Application categories and favorites
- [ ] Resource usage monitoring (CPU, memory)
- [ ] Automated health checks
- [ ] Application updates and version management
- [ ] Custom application icons/images
- [ ] Backup and restore functionality
- [ ] Environment variable configuration UI

## Contributing

Contributions are welcome! To add new features:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for any purpose.

## Credits

Built with:
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [React](https://reactjs.org/)
- [Docker](https://www.docker.com/)
- [dockerode](https://github.com/apocas/dockerode)

---

**Happy Harboring! ⚓**
