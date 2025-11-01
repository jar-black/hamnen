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
   * Load all available applications (supports nested category structure)
   */
  async loadApps() {
    try {
      const entries = await fs.readdir(this.appsDir, { withFileTypes: true });
      const apps = [];

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'README.md') {
          // Check if this is a category directory or an app directory
          const entryPath = path.join(this.appsDir, entry.name);
          const hasDescription = await this.fileExists(path.join(entryPath, 'description.json'));

          if (hasDescription) {
            // This is an app directory at the root level (backward compatibility)
            try {
              const app = await this.loadApp(entry.name, null);
              if (app) {
                apps.push(app);
              }
            } catch (error) {
              console.warn(`Failed to load app ${entry.name}:`, error.message);
            }
          } else {
            // This is a category directory, scan for apps inside
            try {
              const categoryApps = await this.loadCategoryApps(entry.name);
              apps.push(...categoryApps);
            } catch (error) {
              console.warn(`Failed to load category ${entry.name}:`, error.message);
            }
          }
        }
      }

      return apps;
    } catch (error) {
      throw new Error(`Failed to load applications: ${error.message}`);
    }
  }

  /**
   * Load all apps from a category directory
   */
  async loadCategoryApps(categoryName) {
    const categoryPath = path.join(this.appsDir, categoryName);
    const entries = await fs.readdir(categoryPath, { withFileTypes: true });
    const apps = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const app = await this.loadApp(entry.name, categoryName);
          if (app) {
            apps.push(app);
          }
        } catch (error) {
          console.warn(`Failed to load app ${categoryName}/${entry.name}:`, error.message);
        }
      }
    }

    return apps;
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Find and load an app by its ID (can be "appname" or "category/appname")
   * @param {string} appId - The app ID to find
   */
  async findAppById(appId) {
    // Check if appId contains a category
    if (appId.includes('/')) {
      const [category, appName] = appId.split('/');
      return await this.loadApp(appName, category);
    }

    // Otherwise search for the app in all categories
    const apps = await this.loadApps();
    return apps.find(app => app.id === appId);
  }

  /**
   * Load a single application
   * @param {string} appName - The name of the app directory
   * @param {string|null} category - The category directory name (null for root-level apps)
   */
  async loadApp(appName, category = null) {
    const appPath = category
      ? path.join(this.appsDir, category, appName)
      : path.join(this.appsDir, appName);

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

    // Use category/appname as ID for nested structure, just appname for root level
    const appId = category ? `${category}/${appName}` : appName;

    return {
      id: appId,
      name: description.name || appName,
      category: category || 'uncategorized',
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
