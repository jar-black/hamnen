# Hamnen - 100 Dockerized Applications

This document provides a comprehensive overview of all 100 dockerized applications available in Hamnen.

## Table of Contents

- [Container Management & Infrastructure (1-5)](#container-management--infrastructure)
- [Reverse Proxies & Web Servers (6-12)](#reverse-proxies--web-servers)
- [Databases (13-20)](#databases)
- [Media Servers & Management (21-35)](#media-servers--management)
- [Download Clients (36-40)](#download-clients)
- [Home Automation & IoT (41-50)](#home-automation--iot)
- [Network Security (51-58)](#network-security)
- [Monitoring & Analytics (59-68)](#monitoring--analytics)
- [Dashboards (69-73)](#dashboards)
- [File Management (74-80)](#file-management)
- [Development Tools (81-88)](#development-tools)
- [Productivity (89-95)](#productivity)
- [AI & Machine Learning (96-100)](#ai--machine-learning)

## Container Management & Infrastructure

### 1. Portainer (Port: 9001)
Docker container management platform with a web-based UI for managing Docker environments.

### 2. Watchtower (Port: 8080)
Automatically update running Docker containers to the latest available image.

### 3. Dockge (Port: 5001)
Fancy, easy-to-use and reactive self-hosted docker compose.yaml stack-oriented manager.

### 4. Yacht (Port: 8000)
Web interface for managing Docker containers with an emphasis on templating.

### 5. Diun (Port: 8081)
Docker Image Update Notifier - receive notifications when a Docker image is updated.

## Reverse Proxies & Web Servers

### 6. Nginx Proxy Manager (Port: 81)
Docker container for managing Nginx proxy hosts with a simple, powerful interface.

### 7. Traefik (Port: 8084)
Modern HTTP reverse proxy and load balancer with automatic HTTPS.

### 8. Caddy (Port: 2019)
Fast, multi-platform web server with automatic HTTPS.

### 9. HAProxy (Port: 8404)
Reliable, high performance TCP/HTTP load balancer.

### 10. Apache (Port: 8091)
The Apache HTTP Server - world's most used web server software.

### 11. Nginx (Port: 80)
High-performance web server and reverse proxy.

### 12. Swag (Port: 8092)
Nginx webserver with PHP support, reverse proxy and Let's Encrypt SSL.

## Databases

### 13. PostgreSQL (Port: 5432)
Powerful, open source object-relational database system.

### 14. MySQL (Port: 3306)
World's most popular open source relational database.

### 15. MariaDB (Port: 3307)
Community-developed, commercially supported fork of MySQL.

### 16. MongoDB (Port: 27017)
Source-available cross-platform document-oriented NoSQL database.

### 17. Redis (Port: 6379)
In-memory data structure store, used as database, cache, and message broker.

### 18. InfluxDB (Port: 8086)
Time series database designed to handle high write and query loads.

### 19. CouchDB (Port: 5984)
Seamless multi-master sync, stores data safely on your own servers.

### 20. Elasticsearch (Port: 9200)
Distributed, RESTful search and analytics engine.

## Media Servers & Management

### 21. Plex (Port: 32400)
Stream your media to all of your devices from your own server.

### 22. Jellyfin (Port: 8096)
Free Software Media System that puts you in control of your media.

### 23. Emby (Port: 8097)
Personal media server with apps on just about every device.

### 24. Sonarr (Port: 8989)
PVR for Usenet and BitTorrent users - automatically downloads TV shows.

### 25. Radarr (Port: 7878)
Movie collection manager for Usenet and BitTorrent users.

### 26. Lidarr (Port: 8686)
Music collection manager for Usenet and BitTorrent users.

### 27. Readarr (Port: 8787)
Book and audiobook collection manager for Usenet and BitTorrent users.

### 28. Prowlarr (Port: 9696)
Indexer manager/proxy built on the popular *arr .net/reactjs base stack.

### 29. Bazarr (Port: 6767)
Companion application to Sonarr and Radarr for downloading subtitles.

### 30. Overseerr (Port: 5055)
Request management and media discovery tool for Plex ecosystem.

### 31. Tautulli (Port: 8181)
Monitoring and tracking tool for Plex Media Server.

### 32. PhotoPrism (Port: 2342)
AI-powered photos app for the decentralized web.

### 33. Immich (Port: 2283)
High performance self-hosted photo and video backup solution.

### 34. Navidrome (Port: 4533)
Modern Music Server and Streamer compatible with Subsonic/Airsonic.

### 35. Airsonic (Port: 4040)
Free, web-based media streamer providing ubiquitous access to your music.

## Download Clients

### 36. qBittorrent (Port: 8098)
Free and reliable P2P BitTorrent client with web UI.

### 37. Transmission (Port: 9091)
Fast, easy, and free BitTorrent client.

### 38. Deluge (Port: 8112)
Lightweight, Free Software, cross-platform BitTorrent client.

### 39. SABnzbd (Port: 8099)
Free and easy binary newsreader for Usenet.

### 40. NZBGet (Port: 6789)
Efficient Usenet downloader.

## Home Automation & IoT

### 41. Home Assistant (Port: 8123)
Open source home automation that puts local control and privacy first.

### 42. Node-RED (Port: 1880)
Flow-based programming for the Internet of Things.

### 43. Mosquitto (Port: 1883)
Open source message broker that implements MQTT protocol.

### 44. Zigbee2MQTT (Port: 8100)
Zigbee to MQTT bridge, get rid of proprietary Zigbee bridges.

### 45. ESPHome (Port: 6052)
System to control ESP8266/ESP32 devices with simple yet powerful configuration.

### 46. Domoticz (Port: 8101)
Home automation system with a lightweight and simple design.

### 47. openHAB (Port: 8102)
Vendor and technology agnostic open source automation software.

### 48. Homebridge (Port: 8103)
HomeKit support for the impatient - add HomeKit to any smart home device.

### 49. Jackett (Port: 9117)
API Support for your favorite torrent trackers.

### 50. FlareSolverr (Port: 8191)
Proxy server to bypass Cloudflare protection for web scrapers.

## Network Security

### 51. Pi-hole (Port: 8104)
Network-wide ad blocking via your own Linux hardware.

### 52. AdGuard Home (Port: 3000)
Network-wide software for blocking ads & tracking.

### 53. WireGuard (Port: 51820)
Fast, modern, secure VPN tunnel.

### 54. OpenVPN (Port: 1194)
Full-featured open source SSL VPN solution.

### 55. Vaultwarden (Port: 8105)
Unofficial Bitwarden compatible server written in Rust.

### 56. Authelia (Port: 9092)
Single Sign-On Multi-Factor portal for web apps.

### 57. Cloudflare Tunnel (Port: 8106)
Secure tunnel to expose local services via Cloudflare.

### 58. Tailscale (Port: 41641)
Zero config VPN for building secure networks.

## Monitoring & Analytics

### 59. Grafana (Port: 3001)
Open source analytics and interactive visualization web application.

### 60. Prometheus (Port: 9090)
Open-source systems monitoring and alerting toolkit.

### 61. Uptime Kuma (Port: 3002)
Fancy self-hosted monitoring tool like Uptime Robot.

### 62. Dozzle (Port: 8107)
Real-time log viewer for docker containers.

### 63. Glances (Port: 61208)
Cross-platform system monitoring tool written in Python.

### 64. cAdvisor (Port: 8108)
Container Advisor - analyzes resource usage and performance of containers.

### 65. Scrutiny (Port: 8109)
Hard drive S.M.A.R.T monitoring, historical trends and real-time alerting.

### 66. Speedtest Tracker (Port: 8110)
Self-hosted internet performance tracking application.

### 67. LibreSpeed (Port: 8111)
Self-hosted HTML5 speed test, no Flash, No Java, No Websocket.

### 68. Statping (Port: 8112)
Status page for monitoring your websites and applications.

## Dashboards

### 69. Heimdall (Port: 8113)
Application dashboard and launcher with a modern design.

### 70. Homepage (Port: 3004)
Modern, fully customizable application dashboard with integrations.

### 71. Dashy (Port: 4000)
Feature-rich homepage for your homelab with easy YAML configuration.

### 72. Organizr (Port: 8114)
HTPC/Homelab services organizer with tabs and authentication.

### 73. Homarr (Port: 7575)
Customizable browser's home page to interact with your homeserver's services.

## File Management

### 74. Nextcloud (Port: 8115)
Safe home for all your data with file sync and sharing.

### 75. FileRun (Port: 8116)
Self-hosted file manager and file sharing application.

### 76. FileBrowser (Port: 8117)
Web file browser with a clean and simple interface.

### 77. Syncthing (Port: 8384)
Continuous file synchronization program.

### 78. Seafile (Port: 8118)
High performance file syncing and sharing with encryption.

### 79. Duplicati (Port: 8200)
Free backup software to store encrypted backups online.

### 80. Restic (Port: 8119)
Fast, secure, efficient backup program with web UI.

## Development Tools

### 81. GitLab (Port: 8120)
Complete DevOps platform with Git repository manager, CI/CD, and more.

### 82. Gitea (Port: 3005)
Painless self-hosted Git service written in Go.

### 83. Jenkins (Port: 8121)
Leading open source automation server for CI/CD.

### 84. Drone (Port: 8122)
Container-native continuous delivery platform.

### 85. SonarQube (Port: 9002)
Continuous code quality and security inspection platform.

### 86. JupyterLab (Port: 8888)
Web-based interactive development environment for notebooks, code, and data.

### 87. Code Server (Port: 8123)
VS Code in the browser - run Visual Studio Code on any machine.

### 88. Ansible Semaphore (Port: 3006)
Modern UI for Ansible with task execution and inventory management.

## Productivity

### 89. Bookstack (Port: 8124)
Simple, self-hosted, easy-to-use platform for organizing and storing information.

### 90. Outline (Port: 3007)
Fast, collaborative knowledge base for growing teams.

### 91. Joplin Server (Port: 22300)
Sync server for Joplin note taking and to-do application.

### 92. Memos (Port: 5230)
Privacy-first, lightweight note-taking service with markdown support.

### 93. Excalidraw (Port: 8125)
Virtual collaborative whiteboard tool for sketching hand-drawn diagrams.

### 94. Stirling PDF (Port: 8126)
Locally hosted web application for PDF manipulation and operations.

### 95. Paperless-ngx (Port: 8127)
Document management system with OCR and full-text search.

## AI & Machine Learning

### 96. Ollama (Port: 11434)
Get up and running with large language models locally.

### 97. Open WebUI (Port: 8128)
User-friendly WebUI for LLMs (formerly Ollama WebUI).

### 98. Stable Diffusion WebUI (Port: 7860)
Web interface for Stable Diffusion AI image generation.

### 99. LocalAI (Port: 8129)
OpenAI alternative - self-hosted, community-driven AI API.

### 100. n8n (Port: 5678)
Workflow automation tool with visual editor for complex integrations.

---

## Testing Applications

Use the included testing script to test applications:

```bash
# Test a specific application
./test-apps.sh portainer

# Test all applications
./test-apps.sh all
```

## Default Credentials

Many applications use default credentials for initial setup:
- **Username**: admin / hamnen
- **Password**: hamnen / hamnen_password

**⚠️ Important**: Change these default credentials after first login!

## Network Configuration

All applications are configured to use the `hamnen-network` Docker network for inter-container communication.

## Volume Management

Each application stores its data in the `volumes/` directory within its application folder. This ensures data persistence across container restarts.

## Support & Contributions

For issues or feature requests, please visit the project repository.

---

**Note**: This collection represents the most popular and widely-used dockerized applications as of 2025, covering everything from infrastructure and databases to AI and productivity tools.
