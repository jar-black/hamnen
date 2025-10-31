const express = require('express');
const router = express.Router();
const appsController = require('../controllers/appsController');

// List all applications
router.get('/', appsController.listApps);

// Get specific application
router.get('/:name', appsController.getApp);

// Start an application
router.post('/:name/start', appsController.startApp);

// Stop an application
router.post('/:name/stop', appsController.stopApp);

// Get application logs
router.get('/:name/logs', appsController.getAppLogs);

module.exports = router;
