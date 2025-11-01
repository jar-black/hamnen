/**
 * Input validation middleware and utilities
 */

/**
 * Validate app ID format
 * Allows: alphanumeric, hyphens, underscores, and forward slashes for categories
 * Prevents: path traversal attempts, special characters
 */
function validateAppId(appId) {
  if (!appId || typeof appId !== 'string') {
    return { valid: false, error: 'App ID is required and must be a string' };
  }

  // Check for path traversal attempts
  if (appId.includes('..') || appId.startsWith('/') || appId.endsWith('/')) {
    return { valid: false, error: 'Invalid app ID format' };
  }

  // Allow alphanumeric, hyphens, underscores, and single forward slash for category
  const validPattern = /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?$/;
  if (!validPattern.test(appId)) {
    return { valid: false, error: 'App ID contains invalid characters' };
  }

  // Additional length check
  if (appId.length > 100) {
    return { valid: false, error: 'App ID too long' };
  }

  return { valid: true };
}

/**
 * Validate numeric parameter
 */
function validateNumber(value, min, max, paramName = 'parameter') {
  const num = parseInt(value, 10);

  if (isNaN(num)) {
    return { valid: false, error: `${paramName} must be a number` };
  }

  if (num < min || num > max) {
    return { valid: false, error: `${paramName} must be between ${min} and ${max}` };
  }

  return { valid: true, value: num };
}

/**
 * Middleware to validate app ID in route parameters
 */
function validateAppIdMiddleware(req, res, next) {
  // Extract app ID from various route patterns
  const appId = req.params[0] || req.params.name || req.params.id;

  if (!appId) {
    return res.status(400).json({
      error: 'App ID is required',
      code: 'MISSING_APP_ID'
    });
  }

  const validation = validateAppId(appId);
  if (!validation.valid) {
    return res.status(400).json({
      error: validation.error,
      code: 'INVALID_APP_ID'
    });
  }

  // Store validated app ID for use in controllers
  req.validatedAppId = appId;
  next();
}

/**
 * Middleware to validate query parameters
 */
function validateQueryParams(req, res, next) {
  // Validate 'lines' parameter if present (for logs endpoint)
  if (req.query.lines !== undefined) {
    const validation = validateNumber(req.query.lines, 1, 10000, 'lines');
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
        code: 'INVALID_QUERY_PARAM'
      });
    }
    req.validatedLines = validation.value;
  }

  next();
}

/**
 * Sanitize object to remove potentially dangerous properties
 */
function sanitizeObject(obj, allowedKeys) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = {};
  for (const key of allowedKeys) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
}

module.exports = {
  validateAppId,
  validateNumber,
  validateAppIdMiddleware,
  validateQueryParams,
  sanitizeObject
};
