const appLoader = require('../utils/appLoader');
const dockerManager = require('../utils/docker');
const logger = require('../utils/logger');

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
    // Use validated app ID from middleware
    const appId = req.validatedAppId;
    const app = await appLoader.findAppById(appId);

    if (!app) {
      return res.status(404).json({ error: 'Application not found', code: 'APP_NOT_FOUND' });
    }

    const status = await dockerManager.getAppStatus(appId);
    res.json({ ...app, ...status });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'INTERNAL_ERROR' });
  }
}

/**
 * Start an application
 */
async function startApp(req, res) {
  const appId = req.validatedAppId;

  try {
    logger.info(`Starting application: ${appId}`, { ip: req.ip });

    // Check if app exists
    const app = await appLoader.findAppById(appId);
    if (!app) {
      logger.warn(`Application not found: ${appId}`, { ip: req.ip });
      return res.status(404).json({ error: 'Application not found', code: 'APP_NOT_FOUND' });
    }

    // Start the application
    await dockerManager.startApp(appId);
    logger.info(`Application started successfully: ${appId}`, { appName: app.name });

    // Wait a moment and get status
    await new Promise(resolve => setTimeout(resolve, 2000));
    const status = await dockerManager.getAppStatus(appId);

    res.json({
      message: `Application ${app.name || appId} started`,
      status,
      url: `http://localhost:${app.port}${app.path || '/'}`
    });
  } catch (error) {
    logger.error(`Failed to start application: ${appId}`, {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    res.status(500).json({ error: error.message, code: 'INTERNAL_ERROR' });
  }
}

/**
 * Stop an application
 */
async function stopApp(req, res) {
  const appId = req.validatedAppId;

  try {
    logger.info(`Stopping application: ${appId}`, { ip: req.ip });

    await dockerManager.stopApp(appId);

    logger.info(`Application stopped successfully: ${appId}`);

    res.json({
      message: `Application ${appId} stopped`,
      status: 'stopped'
    });
  } catch (error) {
    logger.error(`Failed to stop application: ${appId}`, {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    res.status(500).json({ error: error.message, code: 'INTERNAL_ERROR' });
  }
}

/**
 * Get application logs
 */
async function getAppLogs(req, res) {
  try {
    // Use validated app ID and lines from middleware
    const appId = req.validatedAppId;
    const lines = req.validatedLines || 100;

    const logs = await dockerManager.getAppLogs(appId, lines);

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'INTERNAL_ERROR' });
  }
}

module.exports = {
  listApps,
  getApp,
  startApp,
  stopApp,
  getAppLogs
};
