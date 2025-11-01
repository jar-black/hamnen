const appLoader = require('../utils/appLoader');
const dockerManager = require('../utils/docker');

/**
 * Get all available applications
 */
async function listApps(req, res) {
  try {
    const apps = await appLoader.loadApps();

    // Get status for each app
    const appsWithStatus = await Promise.all(
      apps.map(async (app) => {
        try {
          const status = await dockerManager.getAppStatus(app.id);
          return { ...app, status: status.status };
        } catch (error) {
          return { ...app, status: 'unknown' };
        }
      })
    );

    res.json({ apps: appsWithStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get a single application by ID
 */
async function getApp(req, res) {
  try {
    // Support both "name" and "category/name" format
    const appId = req.params[0] || req.params.name;
    const app = await appLoader.findAppById(appId);

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const status = await dockerManager.getAppStatus(appId);
    res.json({ ...app, ...status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Start an application
 */
async function startApp(req, res) {
  try {
    // Support both "name" and "category/name" format
    const appId = req.params[0] || req.params.name;

    // Check if app exists
    const app = await appLoader.findAppById(appId);
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Start the application
    await dockerManager.startApp(appId);

    // Wait a moment and get status
    await new Promise(resolve => setTimeout(resolve, 2000));
    const status = await dockerManager.getAppStatus(appId);

    res.json({
      message: `Application ${app.name || appId} started`,
      status,
      url: `http://localhost:${app.port}${app.path || '/'}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Stop an application
 */
async function stopApp(req, res) {
  try {
    // Support both "name" and "category/name" format
    const appId = req.params[0] || req.params.name;

    await dockerManager.stopApp(appId);

    res.json({
      message: `Application ${appId} stopped`,
      status: 'stopped'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get application logs
 */
async function getAppLogs(req, res) {
  try {
    // Support both "name" and "category/name" format
    const appId = req.params[0] || req.params.name;
    const lines = req.query.lines || 100;

    const logs = await dockerManager.getAppLogs(appId, lines);

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listApps,
  getApp,
  startApp,
  stopApp,
  getAppLogs
};
