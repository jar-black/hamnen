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
    const { name } = req.params;
    const app = await appLoader.loadApp(name);

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const status = await dockerManager.getAppStatus(name);
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
    const { name } = req.params;

    // Check if app exists
    const app = await appLoader.loadApp(name);
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Start the application
    await dockerManager.startApp(name);

    // Wait a moment and get status
    await new Promise(resolve => setTimeout(resolve, 2000));
    const status = await dockerManager.getAppStatus(name);

    res.json({
      message: `Application ${name} started`,
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
    const { name } = req.params;

    await dockerManager.stopApp(name);

    res.json({
      message: `Application ${name} stopped`,
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
    const { name } = req.params;
    const lines = req.query.lines || 100;

    const logs = await dockerManager.getAppLogs(name, lines);

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
