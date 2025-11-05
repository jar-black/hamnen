#!/usr/bin/env node

/**
 * Automated Test Script for Hamnen Application Launch Buttons
 *
 * This script tests all applications in Hamnen by:
 * 1. Starting each application
 * 2. Waiting 60 seconds for startup
 * 3. Checking if containers are running
 * 4. Optionally checking health endpoint
 * 5. Stopping the application
 * 6. Cleaning up Docker containers
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const APPS_DIR = process.env.APPS_DIR || path.join(__dirname, 'apps');
const WAIT_TIME_MS = 60000; // 60 seconds
const STARTUP_WAIT_MS = 5000; // 5 seconds after docker-compose up
const CHECK_HEALTH = process.env.CHECK_HEALTH !== 'false'; // Check health endpoints by default

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      details: []
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  /**
   * Load all applications from the apps directory
   */
  async loadApps() {
    const apps = [];
    const entries = await fs.readdir(APPS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const entryPath = path.join(APPS_DIR, entry.name);
        const hasDescription = await this.fileExists(path.join(entryPath, 'description.json'));

        if (hasDescription) {
          // Root-level app (backward compatibility)
          const app = await this.loadApp(entry.name, null);
          if (app) apps.push(app);
        } else {
          // Category directory
          const categoryApps = await this.loadCategoryApps(entry.name);
          apps.push(...categoryApps);
        }
      }
    }

    return apps;
  }

  /**
   * Load apps from a category directory
   */
  async loadCategoryApps(categoryName) {
    const categoryPath = path.join(APPS_DIR, categoryName);
    const entries = await fs.readdir(categoryPath, { withFileTypes: true });
    const apps = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const app = await this.loadApp(entry.name, categoryName);
        if (app) apps.push(app);
      }
    }

    return apps;
  }

  /**
   * Load a single application
   */
  async loadApp(appName, category) {
    const appPath = category
      ? path.join(APPS_DIR, category, appName)
      : path.join(APPS_DIR, appName);

    const descriptionPath = path.join(appPath, 'description.json');
    const composePath = path.join(appPath, 'docker-compose.yml');

    // Check if required files exist
    if (!await this.fileExists(descriptionPath) || !await this.fileExists(composePath)) {
      return null;
    }

    try {
      const descriptionContent = await fs.readFile(descriptionPath, 'utf8');
      const description = JSON.parse(descriptionContent);

      const appId = category ? `${category}/${appName}` : appName;

      return {
        id: appId,
        name: description.name || appName,
        category: category || 'uncategorized',
        path: appPath,
        healthCheck: description.healthCheck,
        port: description.port,
        ...description
      };
    } catch (error) {
      this.log(`Failed to load ${category}/${appName}: ${error.message}`, 'yellow');
      return null;
    }
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
   * Execute docker-compose command
   */
  async executeDockerCompose(app, command) {
    const projectName = `hamnen_${app.id.replace(/\//g, '-')}`;
    const composePath = path.join(app.path, 'docker-compose.yml');
    const cmd = `docker-compose -f ${composePath} -p ${projectName} ${command}`;

    try {
      const { stdout, stderr } = await execAsync(cmd, { cwd: app.path });
      return { stdout, stderr, success: true };
    } catch (error) {
      return { stdout: error.stdout || '', stderr: error.stderr || '', success: false, error };
    }
  }

  /**
   * Start an application
   */
  async startApp(app) {
    this.log(`  Starting containers...`, 'gray');
    const result = await this.executeDockerCompose(app, 'up -d');

    if (!result.success) {
      throw new Error(`Failed to start: ${result.stderr || result.error.message}`);
    }

    // Give it a moment to start
    await this.sleep(STARTUP_WAIT_MS);
    return result;
  }

  /**
   * Stop an application
   */
  async stopApp(app) {
    this.log(`  Stopping and cleaning up containers...`, 'gray');
    const result = await this.executeDockerCompose(app, 'down --volumes --remove-orphans');
    return result;
  }

  /**
   * Get application status
   */
  async getAppStatus(app) {
    const result = await this.executeDockerCompose(app, 'ps --format json');

    if (!result.success) {
      return { running: false, containers: [] };
    }

    const containers = result.stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const runningContainers = containers.filter(c => c.State === 'running');

    return {
      running: runningContainers.length > 0,
      allRunning: containers.length > 0 && containers.every(c => c.State === 'running'),
      containers: containers.map(c => ({
        name: c.Name,
        state: c.State,
        status: c.Status
      }))
    };
  }

  /**
   * Check health endpoint
   */
  async checkHealth(app) {
    if (!CHECK_HEALTH || !app.healthCheck) {
      return { checked: false };
    }

    try {
      // Use curl to check the health endpoint
      const { stdout, stderr } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" ${app.healthCheck}`, {
        timeout: 10000
      });

      const statusCode = parseInt(stdout.trim());
      const healthy = statusCode >= 200 && statusCode < 400;

      return {
        checked: true,
        healthy,
        statusCode,
        url: app.healthCheck
      };
    } catch (error) {
      return {
        checked: true,
        healthy: false,
        error: error.message,
        url: app.healthCheck
      };
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test a single application
   */
  async testApp(app) {
    const testResult = {
      app: app.id,
      name: app.name,
      category: app.category,
      success: false,
      steps: {},
      errors: []
    };

    this.log(`\nTesting: ${app.name} (${app.id})`, 'cyan');
    this.log(`Category: ${app.category}`, 'gray');

    try {
      // Step 1: Start the application
      testResult.steps.start = { attempted: true, success: false };
      await this.startApp(app);
      testResult.steps.start.success = true;
      this.log(`  ✓ Started successfully`, 'green');

      // Step 2: Wait for startup
      this.log(`  Waiting ${WAIT_TIME_MS / 1000} seconds for application to fully start...`, 'gray');
      await this.sleep(WAIT_TIME_MS);

      // Step 3: Check status
      testResult.steps.status = { attempted: true, success: false };
      const status = await this.getAppStatus(app);
      testResult.steps.status.success = status.running;
      testResult.steps.status.data = status;

      if (status.running) {
        this.log(`  ✓ Containers running: ${status.containers.length}`, 'green');
        status.containers.forEach(container => {
          this.log(`    - ${container.name}: ${container.state}`, 'gray');
        });
      } else {
        testResult.errors.push('No containers running');
        this.log(`  ✗ No containers running`, 'red');
      }

      // Step 4: Check health endpoint (optional)
      if (CHECK_HEALTH && app.healthCheck) {
        testResult.steps.health = { attempted: true, success: false };
        const health = await this.checkHealth(app);
        testResult.steps.health.data = health;

        if (health.checked) {
          if (health.healthy) {
            testResult.steps.health.success = true;
            this.log(`  ✓ Health check passed (HTTP ${health.statusCode})`, 'green');
          } else {
            testResult.errors.push(`Health check failed: ${health.statusCode || health.error}`);
            this.log(`  ✗ Health check failed: ${health.statusCode || health.error}`, 'red');
          }
        }
      }

      // Step 5: Stop and cleanup
      testResult.steps.stop = { attempted: true, success: false };
      await this.stopApp(app);
      testResult.steps.stop.success = true;
      this.log(`  ✓ Stopped and cleaned up`, 'green');

      // Overall success if start and stop worked, and containers were running
      testResult.success = testResult.steps.start.success &&
                          testResult.steps.status.success &&
                          testResult.steps.stop.success &&
                          (!CHECK_HEALTH || !app.healthCheck || testResult.steps.health?.success !== false);

      if (testResult.success) {
        this.log(`✓ PASSED: ${app.name}`, 'green');
        this.results.passed++;
      } else {
        this.log(`✗ FAILED: ${app.name} - ${testResult.errors.join(', ')}`, 'red');
        this.results.failed++;
      }

    } catch (error) {
      testResult.errors.push(error.message);
      this.log(`✗ FAILED: ${app.name} - ${error.message}`, 'red');
      this.results.failed++;

      // Try to cleanup even if test failed
      try {
        await this.stopApp(app);
      } catch (cleanupError) {
        this.log(`  Warning: Cleanup failed - ${cleanupError.message}`, 'yellow');
      }
    }

    this.results.details.push(testResult);
    this.results.total++;
  }

  /**
   * Run all tests
   */
  async runAllTests(apps, specificApps = null) {
    this.log('\n═══════════════════════════════════════════════════════════', 'blue');
    this.log('   Hamnen Application Launch Button Test Suite', 'blue');
    this.log('═══════════════════════════════════════════════════════════\n', 'blue');

    // Filter apps if specific ones requested
    const appsToTest = specificApps
      ? apps.filter(app => specificApps.includes(app.id) || specificApps.includes(app.name))
      : apps;

    this.log(`Found ${appsToTest.length} applications to test\n`, 'cyan');
    this.log(`Configuration:`, 'cyan');
    this.log(`  - Wait time: ${WAIT_TIME_MS / 1000} seconds`, 'gray');
    this.log(`  - Health checks: ${CHECK_HEALTH ? 'enabled' : 'disabled'}`, 'gray');
    this.log(`  - Apps directory: ${APPS_DIR}`, 'gray');

    const startTime = Date.now();

    for (const app of appsToTest) {
      await this.testApp(app);

      // Small delay between tests to prevent resource exhaustion
      await this.sleep(2000);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Print summary
    this.printSummary(duration);
  }

  /**
   * Print test summary
   */
  printSummary(duration) {
    this.log('\n═══════════════════════════════════════════════════════════', 'blue');
    this.log('   Test Summary', 'blue');
    this.log('═══════════════════════════════════════════════════════════\n', 'blue');

    this.log(`Total tests:    ${this.results.total}`, 'cyan');
    this.log(`Passed:         ${this.results.passed}`, 'green');
    this.log(`Failed:         ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'gray');
    this.log(`Skipped:        ${this.results.skipped}`, 'gray');
    this.log(`Duration:       ${duration} seconds\n`, 'gray');

    if (this.results.failed > 0) {
      this.log('Failed Applications:', 'red');
      this.results.details
        .filter(r => !r.success)
        .forEach(r => {
          this.log(`  - ${r.name} (${r.app}): ${r.errors.join(', ')}`, 'red');
        });
      this.log('');
    }

    // Write detailed results to file
    const resultsFile = path.join(__dirname, 'test-results.json');
    fs.writeFile(resultsFile, JSON.stringify(this.results, null, 2))
      .then(() => {
        this.log(`Detailed results written to: ${resultsFile}`, 'gray');
      })
      .catch(err => {
        this.log(`Failed to write results file: ${err.message}`, 'yellow');
      });

    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const specificApps = args.length > 0 ? args : null;

  const runner = new TestRunner();

  try {
    runner.log('Loading applications...', 'cyan');
    const apps = await runner.loadApps();

    if (apps.length === 0) {
      runner.log('No applications found!', 'red');
      process.exit(1);
    }

    if (specificApps) {
      runner.log(`Testing specific apps: ${specificApps.join(', ')}`, 'cyan');
    }

    await runner.runAllTests(apps, specificApps);
  } catch (error) {
    runner.log(`\nFATAL ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Handle interrupts gracefully
process.on('SIGINT', () => {
  console.log('\n\nTest interrupted by user');
  process.exit(130);
});

// Run the tests
main();
