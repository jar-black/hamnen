const express = require('express');
const router = express.Router();
const appsController = require('../controllers/appsController');
const { validateAppIdMiddleware, validateQueryParams } = require('../middleware/validation');

// List all applications
router.get('/', appsController.listApps);

// Application routes - support both "name" and "category/name" formats
// Use wildcard (*) to match paths with slashes
// All routes below use validation middleware to prevent injection attacks

// Start an application
router.post(/^\/(.+)\/start$/, validateAppIdMiddleware, appsController.startApp);

// Stop an application
router.post(/^\/(.+)\/stop$/, validateAppIdMiddleware, appsController.stopApp);

// Get application logs
router.get(/^\/(.+)\/logs$/, validateAppIdMiddleware, validateQueryParams, appsController.getAppLogs);

// Get specific application (must be last to not conflict with /start, /stop, /logs)
router.get(/^\/(.+)$/, validateAppIdMiddleware, appsController.getApp);

module.exports = router;
