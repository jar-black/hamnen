const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execFileAsync = promisify(execFile);

class DockerManager {
  constructor() {
    // Support both local development and Docker deployment
    this.appsDir = process.env.APPS_DIR || path.join(__dirname, '../../apps');
  }

  /**
   * Execute docker-compose command
   * @param {string} appId - App ID which can be "appname" or "category/appname"
   * @param {Array<string>} commandArgs - Array of command arguments (e.g., ['up', '-d'])
   */
  async executeDockerCompose(appId, commandArgs, options = {}) {
    const appPath = path.join(this.appsDir, appId);
    const composeFile = path.join(appPath, 'docker-compose.yml');

    // Check if docker-compose file exists
    try {
      await fs.access(composeFile);
    } catch (error) {
      throw new Error(`docker-compose.yml not found for ${appId}`);
    }

    // Validate appId to prevent path traversal
    if (appId.includes('..') || appId.startsWith('/')) {
      throw new Error('Invalid app ID');
    }

    // Use sanitized app name for project (replace / with -)
    const projectName = `hamnen_${appId.replace(/\//g, '-')}`;

    // Build argument array safely (no shell interpretation)
    const args = ['-f', composeFile, '-p', projectName, ...commandArgs];

    try {
      const { stdout, stderr } = await execFileAsync('docker-compose', args, {
        cwd: appPath,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        ...options
      });
      return { stdout, stderr, success: true };
    } catch (error) {
      throw new Error(`Docker command failed: ${error.message}`);
    }
  }

  /**
   * Start an application
   */
  async startApp(appName) {
    return await this.executeDockerCompose(appName, ['up', '-d']);
  }

  /**
   * Stop an application
   */
  async stopApp(appName) {
    return await this.executeDockerCompose(appName, ['down']);
  }

  /**
   * Get application status
   */
  async getAppStatus(appName) {
    try {
      const result = await this.executeDockerCompose(appName, ['ps', '--format', 'json']);
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

      if (containers.length === 0) {
        return { status: 'stopped', containers: [] };
      }

      const allRunning = containers.every(c => c.State === 'running');
      return {
        status: allRunning ? 'running' : 'partial',
        containers: containers.map(c => ({
          name: c.Name,
          state: c.State,
          status: c.Status
        }))
      };
    } catch (error) {
      return { status: 'stopped', containers: [], error: error.message };
    }
  }

  /**
   * Get application logs
   */
  async getAppLogs(appName, lines = 100) {
    // Validate lines parameter to prevent injection
    const validatedLines = parseInt(lines, 10);
    if (isNaN(validatedLines) || validatedLines < 1 || validatedLines > 10000) {
      throw new Error('Invalid lines parameter. Must be between 1 and 10000');
    }

    try {
      const result = await this.executeDockerCompose(appName, ['logs', `--tail=${validatedLines}`]);
      return result.stdout;
    } catch (error) {
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  }
}

module.exports = new DockerManager();
