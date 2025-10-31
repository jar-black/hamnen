const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class AppLoader {
  constructor() {
    // Support both local development and Docker deployment
    // In Docker: /app/apps (set via APPS_DIR env var)
    // Locally: ../../apps (relative to this file)
    this.appsDir = process.env.APPS_DIR || path.join(__dirname, '../../apps');
  }

  /**
   * Load all available applications
   */
  async loadApps() {
    try {
      const entries = await fs.readdir(this.appsDir, { withFileTypes: true });
      const apps = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          try {
            const app = await this.loadApp(entry.name);
            if (app) {
              apps.push(app);
            }
          } catch (error) {
            console.warn(`Failed to load app ${entry.name}:`, error.message);
          }
        }
      }

      return apps;
    } catch (error) {
      throw new Error(`Failed to load applications: ${error.message}`);
    }
  }

  /**
   * Load a single application
   */
  async loadApp(appName) {
    const appPath = path.join(this.appsDir, appName);
    const descriptionPath = path.join(appPath, 'description.json');
    const composePath = path.join(appPath, 'docker-compose.yml');

    // Check if required files exist
    try {
      await fs.access(descriptionPath);
      await fs.access(composePath);
    } catch (error) {
      return null; // Skip if required files are missing
    }

    // Load description
    const descriptionContent = await fs.readFile(descriptionPath, 'utf8');
    const description = JSON.parse(descriptionContent);

    // Load docker-compose to extract additional info
    const composeContent = await fs.readFile(composePath, 'utf8');
    const composeConfig = yaml.load(composeContent);

    return {
      id: appName,
      ...description,
      composeInfo: this.extractComposeInfo(composeConfig)
    };
  }

  /**
   * Extract useful information from docker-compose config
   */
  extractComposeInfo(composeConfig) {
    const services = Object.keys(composeConfig.services || {});
    const ports = [];

    // Extract ports from all services
    for (const service of services) {
      const serviceConfig = composeConfig.services[service];
      if (serviceConfig.ports) {
        serviceConfig.ports.forEach(port => {
          const portStr = String(port);
          const match = portStr.match(/(\d+):(\d+)/);
          if (match) {
            ports.push({
              host: match[1],
              container: match[2]
            });
          }
        });
      }
    }

    return {
      services,
      ports
    };
  }
}

module.exports = new AppLoader();
