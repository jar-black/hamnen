const NodeCache = require('node-cache');
const logger = require('./logger');

/**
 * Cache configuration
 * - App list cache: 60 seconds (apps don't change frequently)
 * - App status cache: 2 seconds (fast-changing data)
 * - Docker operation cache: 5 seconds
 */

// App list cache (longer TTL since apps rarely change)
const appListCache = new NodeCache({
  stdTTL: 60,  // 60 seconds
  checkperiod: 120,  // Check for expired keys every 2 minutes
  useClones: false  // Don't clone for better performance
});

// App status cache (shorter TTL for real-time updates)
const appStatusCache = new NodeCache({
  stdTTL: 2,  // 2 seconds
  checkperiod: 10,
  useClones: false
});

// General cache for miscellaneous data
const generalCache = new NodeCache({
  stdTTL: 30,
  checkperiod: 60,
  useClones: false
});

// Cache hit/miss tracking for monitoring
const stats = {
  appList: { hits: 0, misses: 0 },
  appStatus: { hits: 0, misses: 0 },
  general: { hits: 0, misses: 0 }
};

/**
 * Get from app list cache
 */
function getAppList() {
  const value = appListCache.get('appList');
  if (value !== undefined) {
    stats.appList.hits++;
    logger.debug('Cache HIT: appList');
    return value;
  }
  stats.appList.misses++;
  logger.debug('Cache MISS: appList');
  return null;
}

/**
 * Set app list cache
 */
function setAppList(apps) {
  appListCache.set('appList', apps);
  logger.debug(`Cache SET: appList (${apps.length} apps)`);
}

/**
 * Get app status from cache
 */
function getAppStatus(appId) {
  const value = appStatusCache.get(`status:${appId}`);
  if (value !== undefined) {
    stats.appStatus.hits++;
    logger.debug(`Cache HIT: status:${appId}`);
    return value;
  }
  stats.appStatus.misses++;
  logger.debug(`Cache MISS: status:${appId}`);
  return null;
}

/**
 * Set app status in cache
 */
function setAppStatus(appId, status) {
  appStatusCache.set(`status:${appId}`, status);
  logger.debug(`Cache SET: status:${appId}`);
}

/**
 * Invalidate app status cache for specific app
 */
function invalidateAppStatus(appId) {
  appStatusCache.del(`status:${appId}`);
  logger.debug(`Cache INVALIDATE: status:${appId}`);
}

/**
 * Invalidate all app status caches
 */
function invalidateAllAppStatus() {
  const keys = appStatusCache.keys();
  appStatusCache.flushAll();
  logger.debug(`Cache FLUSH: ${keys.length} status entries cleared`);
}

/**
 * Invalidate app list cache
 * Call this when apps directory changes
 */
function invalidateAppList() {
  appListCache.del('appList');
  logger.debug('Cache INVALIDATE: appList');
}

/**
 * Get general cache value
 */
function get(key) {
  const value = generalCache.get(key);
  if (value !== undefined) {
    stats.general.hits++;
    logger.debug(`Cache HIT: ${key}`);
    return value;
  }
  stats.general.misses++;
  logger.debug(`Cache MISS: ${key}`);
  return null;
}

/**
 * Set general cache value
 */
function set(key, value, ttl) {
  if (ttl) {
    generalCache.set(key, value, ttl);
  } else {
    generalCache.set(key, value);
  }
  logger.debug(`Cache SET: ${key}`);
}

/**
 * Get cache statistics
 */
function getStats() {
  return {
    ...stats,
    appListKeys: appListCache.keys().length,
    appStatusKeys: appStatusCache.keys().length,
    generalKeys: generalCache.keys().length,
    appListStats: appListCache.getStats(),
    appStatusStats: appStatusCache.getStats(),
    generalStats: generalCache.getStats()
  };
}

/**
 * Clear all caches
 */
function flushAll() {
  appListCache.flushAll();
  appStatusCache.flushAll();
  generalCache.flushAll();
  logger.info('All caches flushed');
}

module.exports = {
  // App list cache
  getAppList,
  setAppList,
  invalidateAppList,

  // App status cache
  getAppStatus,
  setAppStatus,
  invalidateAppStatus,
  invalidateAllAppStatus,

  // General cache
  get,
  set,

  // Utilities
  getStats,
  flushAll
};
