const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

class DockerManager {
  constructor() {
    this.appsDir = path.join(__dirname, '../../apps');
  }

  /**
   * Execute docker-compose command
   */
  async executeDockerCompose(appName, command, options = {}) {
    const appPath = path.join(this.appsDir, appName);
    const composeFile = path.join(appPath, 'docker-compose.yml');

    // Check if docker-compose file exists
    try {
      await fs.access(composeFile);
    } catch (error) {
      throw new Error(`docker-compose.yml not found for ${appName}`);
    }

    const cmd = `docker-compose -f ${composeFile} -p hamnen_${appName} ${command}`;

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: appPath,
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
    return await this.executeDockerCompose(appName, 'up -d');
  }

  /**
   * Stop an application
   */
  async stopApp(appName) {
    return await this.executeDockerCompose(appName, 'down');
  }

  /**
   * Get application status
   */
  async getAppStatus(appName) {
    try {
      const result = await this.executeDockerCompose(appName, 'ps --format json');
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
    try {
      const result = await this.executeDockerCompose(appName, `logs --tail=${lines}`);
      return result.stdout;
    } catch (error) {
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  }
}

module.exports = new DockerManager();
