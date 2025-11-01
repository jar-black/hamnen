const express = require('express');
const router = express.Router();
const appsController = require('../controllers/appsController');

// List all applications
router.get('/', appsController.listApps);

// Application routes - support both "name" and "category/name" formats
// Use wildcard (*) to match paths with slashes

// Start an application
router.post(/^\/(.+)\/start$/, appsController.startApp);

// Stop an application
router.post(/^\/(.+)\/stop$/, appsController.stopApp);

// Get application logs
router.get(/^\/(.+)\/logs$/, appsController.getAppLogs);

// Get specific application (must be last to not conflict with /start, /stop, /logs)
router.get(/^\/(.+)$/, appsController.getApp);

module.exports = router;
