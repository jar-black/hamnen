# Applications Directory

Each application should follow this structure:

```
app-name/
├── description.json    # Application metadata
├── docker-compose.yml  # Docker compose configuration
└── volumes/           # Optional: persistent volumes
```

## Description Schema

```json
{
  "name": "Application Name",
  "description": "Brief description of the application",
  "icon": "🐳",
  "port": 8080,
  "path": "/",
  "healthCheck": "http://localhost:8080/health",
  "tags": ["category1", "category2"]
}
```

### Fields:
- **name**: Display name of the application
- **description**: Short description shown on the card
- **icon**: Emoji or icon identifier
- **port**: Main port the application exposes
- **path**: URL path to access the application
- **healthCheck**: URL to check if application is running
- **tags**: Categories for filtering
