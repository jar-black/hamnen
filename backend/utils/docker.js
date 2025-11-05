const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

class DockerManager {
  constructor() {
    // Support both local development and Docker deployment
    this.appsDir = process.env.APPS_DIR || path.join(__dirname, '../../apps');
  }

  /**
   * Execute docker-compose command
   * @param {string} appId - App ID which can be "appname" or "category/appname"
   */
  async executeDockerCompose(appId, command, options = {}) {
    const appPath = path.join(this.appsDir, appId);
    const composeFile = path.join(appPath, 'docker-compose.yml');

    // Check if docker-compose file exists
    try {
      await fs.access(composeFile);
    } catch (error) {
      throw new Error(`docker-compose.yml not found for ${appId}`);
    }

    // Use sanitized app name for project (replace / with -)
    const projectName = `hamnen_${appId.replace(/\//g, '-')}`;
    const cmd = `docker-compose -f ${composeFile} -p ${projectName} ${command}`;

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
      // Use docker ps with label filter instead of docker-compose ps for more reliable results
      // This avoids issues with project name mismatches when container_name is hardcoded
      const projectName = `hamnen_${appName.replace(/\//g, '-')}`;
      const cmd = `docker ps -a --filter "label=com.docker.compose.project=${projectName}" --format "{{json .}}"`;

      const { stdout, stderr } = await execAsync(cmd);
      const containers = stdout
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
          name: c.Names,
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
