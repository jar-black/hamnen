/**
 * Docker Integration Tests for Hamnen
 * Tests Docker and docker-compose functionality
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class DockerTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.appsDir = process.env.APPS_DIR || path.join(__dirname, '../../../apps');
  }

  /**
   * Assert helper
   */
  assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      this.passed++;
      return true;
    } else {
      console.log(`  ✗ ${message}`);
      this.failed++;
      return false;
    }
  }

  /**
   * Execute command
   */
  async execute(command) {
    try {
      const { stdout, stderr } = await execAsync(command);
      return { success: true, stdout, stderr };
    } catch (error) {
      return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
    }
  }

  /**
   * Test: Docker is installed and running
   */
  async testDockerInstalled() {
    console.log('\n📍 Testing Docker installation...');
    const result = await this.execute('docker --version');
    this.assert(result.success, 'Docker is installed');
    if (result.success) {
      console.log(`     Version: ${result.stdout.trim()}`);
    }
  }

  /**
   * Test: Docker daemon is running
   */
  async testDockerRunning() {
    console.log('\n📍 Testing Docker daemon...');
    const result = await this.execute('docker ps');
    this.assert(result.success, 'Docker daemon is running');
  }

  /**
   * Test: Docker Compose is installed
   */
  async testDockerComposeInstalled() {
    console.log('\n📍 Testing Docker Compose installation...');
    const result = await this.execute('docker-compose --version');
    this.assert(result.success, 'Docker Compose is installed');
    if (result.success) {
      console.log(`     Version: ${result.stdout.trim()}`);
    }
  }

  /**
   * Test: Apps directory exists and is accessible
   */
  async testAppsDirectory() {
    console.log('\n📍 Testing apps directory...');
    try {
      const stats = await fs.stat(this.appsDir);
      this.assert(stats.isDirectory(), `Apps directory exists at ${this.appsDir}`);

      const entries = await fs.readdir(this.appsDir);
      this.assert(entries.length > 0, 'Apps directory is not empty');
      console.log(`     Found ${entries.length} categories/apps`);
    } catch (error) {
      this.assert(false, `Apps directory not accessible: ${error.message}`);
    }
  }

  /**
   * Test: Validate app structure
   */
  async testAppStructure() {
    console.log('\n📍 Testing app structure validation...');

    try {
      // Find all description.json files
      const findResult = await this.execute(`find "${this.appsDir}" -name "description.json" -type f`);

      if (!findResult.success) {
        this.assert(false, 'Could not search for app descriptions');
        return;
      }

      const descriptionFiles = findResult.stdout.trim().split('\n').filter(Boolean);
      console.log(`     Found ${descriptionFiles.length} applications`);

      let validApps = 0;
      let invalidApps = 0;

      for (const descFile of descriptionFiles.slice(0, 5)) { // Test first 5 apps
        const appDir = path.dirname(descFile);
        const appName = path.basename(appDir);
        const composeFile = path.join(appDir, 'docker-compose.yml');

        try {
          // Check description.json is valid JSON
          const descContent = await fs.readFile(descFile, 'utf8');
          const desc = JSON.parse(descContent);

          // Check docker-compose.yml exists
          await fs.access(composeFile);

          // Validate required fields
          const hasRequiredFields = desc.name && desc.description && desc.icon;

          if (hasRequiredFields) {
            validApps++;
          } else {
            invalidApps++;
            console.log(`     ⚠ Missing fields in ${appName}`);
          }
        } catch (error) {
          invalidApps++;
          console.log(`     ⚠ Invalid structure in ${appName}: ${error.message}`);
        }
      }

      this.assert(validApps > 0, `${validApps} apps have valid structure`);
      if (invalidApps > 0) {
        console.log(`     ⚠ ${invalidApps} apps have issues`);
      }
    } catch (error) {
      this.assert(false, `App structure test failed: ${error.message}`);
    }
  }

  /**
   * Test: Docker network capabilities
   */
  async testDockerNetwork() {
    console.log('\n📍 Testing Docker network capabilities...');

    // List networks
    const result = await this.execute('docker network ls');
    this.assert(result.success, 'Can list Docker networks');

    // Check if hamnen networks exist
    if (result.success) {
      const hasHamnenNetworks = result.stdout.includes('hamnen');
      if (hasHamnenNetworks) {
        console.log('     Found existing Hamnen networks');
      }
    }
  }

  /**
   * Test: Docker volume capabilities
   */
  async testDockerVolume() {
    console.log('\n📍 Testing Docker volume capabilities...');

    const result = await this.execute('docker volume ls');
    this.assert(result.success, 'Can list Docker volumes');
  }

  /**
   * Test: Check for running Hamnen containers
   */
  async testRunningContainers() {
    console.log('\n📍 Checking for running Hamnen containers...');

    const result = await this.execute('docker ps --filter "name=hamnen" --format "{{.Names}}"');

    if (result.success) {
      const containers = result.stdout.trim().split('\n').filter(Boolean);

      if (containers.length > 0) {
        console.log(`     Found ${containers.length} running Hamnen containers:`);
        containers.forEach(name => console.log(`       - ${name}`));
        this.assert(true, 'Hamnen containers are running');
      } else {
        console.log('     No Hamnen containers currently running');
        this.assert(true, 'Container check completed (none running)');
      }
    } else {
      this.assert(false, 'Could not check running containers');
    }
  }

  /**
   * Test: Docker socket access (required for backend)
   */
  async testDockerSocket() {
    console.log('\n📍 Testing Docker socket access...');

    try {
      const socketPath = '/var/run/docker.sock';
      await fs.access(socketPath);
      this.assert(true, 'Docker socket is accessible');

      // Check permissions
      const result = await this.execute(`ls -la ${socketPath}`);
      if (result.success) {
        console.log(`     Permissions: ${result.stdout.trim()}`);
      }
    } catch (error) {
      this.assert(false, 'Docker socket not accessible (may need to add user to docker group)');
    }
  }

  /**
   * Test: Memory and resource availability
   */
  async testSystemResources() {
    console.log('\n📍 Testing system resources...');

    // Check available memory
    const memResult = await this.execute('free -h | grep Mem');
    if (memResult.success) {
      console.log(`     Memory: ${memResult.stdout.trim()}`);
      this.assert(true, 'System memory check completed');
    }

    // Check disk space
    const diskResult = await this.execute('df -h /var/lib/docker 2>/dev/null || df -h /');
    if (diskResult.success) {
      const lines = diskResult.stdout.trim().split('\n');
      if (lines.length > 1) {
        console.log(`     Disk: ${lines[1]}`);
      }
      this.assert(true, 'Disk space check completed');
    }
  }

  /**
   * Test: Validate CI/CD compose file
   */
  async testCICDComposeFile() {
    console.log('\n📍 Testing CI/CD docker-compose file...');

    const cicdComposePath = path.join(this.appsDir, 'development/cicd-complete/docker-compose.yml');

    try {
      await fs.access(cicdComposePath);
      this.assert(true, 'CI/CD docker-compose.yml exists');

      // Validate compose file syntax
      const result = await this.execute(`docker-compose -f "${cicdComposePath}" config > /dev/null 2>&1`);
      this.assert(result.success, 'CI/CD compose file has valid syntax');

      // Count services
      const configResult = await this.execute(`docker-compose -f "${cicdComposePath}" config --services`);
      if (configResult.success) {
        const services = configResult.stdout.trim().split('\n').filter(Boolean);
        console.log(`     Services defined: ${services.length}`);
        console.log(`     Services: ${services.join(', ')}`);
        this.assert(services.length > 0, 'CI/CD compose file defines services');
      }
    } catch (error) {
      this.assert(false, `CI/CD compose file test failed: ${error.message}`);
    }
  }

  /**
   * Run all tests
   */
  async runAll() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🐳 HAMNEN DOCKER INTEGRATION TESTS');
    console.log('═══════════════════════════════════════════════════');

    await this.testDockerInstalled();
    await this.testDockerRunning();
    await this.testDockerComposeInstalled();
    await this.testDockerSocket();
    await this.testDockerNetwork();
    await this.testDockerVolume();
    await this.testAppsDirectory();
    await this.testAppStructure();
    await this.testRunningContainers();
    await this.testSystemResources();
    await this.testCICDComposeFile();

    // Print summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✓ Passed: ${this.passed}`);
    console.log(`✗ Failed: ${this.failed}`);
    console.log(`Total: ${this.passed + this.failed}`);

    const successRate = ((this.passed / (this.passed + this.failed)) * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}%`);

    if (this.failed === 0) {
      console.log('\n🎉 All Docker tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some Docker tests failed!');
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new DockerTester();
  tester.runAll().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = DockerTester;
