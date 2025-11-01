#!/usr/bin/env node

/**
 * CI/CD Complete Environment Validation Script
 * Validates all services in the CI/CD environment are running and accessible
 */

const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class CICDValidator {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;

    // Define all services to check
    this.services = [
      { name: 'PostgreSQL', container: 'hamnen_cicd_postgresql', port: null },
      { name: 'Redis', container: 'hamnen_cicd_redis', port: null },
      { name: 'GitLab', container: 'hamnen_cicd_gitlab', port: 8180, path: '/-/health' },
      { name: 'GitLab Runner', container: 'hamnen_cicd_gitlab_runner', port: null },
      { name: 'Jenkins', container: 'hamnen_cicd_jenkins', port: 8181, path: '/login' },
      { name: 'Harbor Core', container: 'hamnen_cicd_harbor_core', port: null },
      { name: 'Harbor Portal', container: 'hamnen_cicd_harbor_portal', port: null },
      { name: 'Harbor Registry', container: 'hamnen_cicd_harbor_registry', port: null },
      { name: 'Harbor Proxy', container: 'hamnen_cicd_harbor_proxy', port: 8182, path: '/' },
      { name: 'Nexus', container: 'hamnen_cicd_nexus', port: 8184, path: '/' },
      { name: 'SonarQube', container: 'hamnen_cicd_sonarqube', port: 8186, path: '/api/system/status' },
      { name: 'Selenium Hub', container: 'hamnen_cicd_selenium_hub', port: 8187, path: '/wd/hub/status' },
      { name: 'Selenium Chrome', container: 'hamnen_cicd_selenium_chrome', port: null },
      { name: 'Selenium Firefox', container: 'hamnen_cicd_selenium_firefox', port: null }
    ];
  }

  /**
   * Assert helper
   */
  assert(condition, message, isWarning = false) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      this.passed++;
      return true;
    } else {
      if (isWarning) {
        console.log(`  ⚠ ${message}`);
        this.warnings++;
      } else {
        console.log(`  ✗ ${message}`);
        this.failed++;
      }
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
   * Make HTTP request
   */
  async httpRequest(port, path = '/', timeout = 5000) {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port,
        path,
        method: 'GET',
        timeout
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({ success: true, status: res.statusCode, body });
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
      });

      req.end();
    });
  }

  /**
   * Check if container is running
   */
  async isContainerRunning(containerName) {
    const result = await this.execute(`docker inspect -f '{{.State.Running}}' ${containerName} 2>/dev/null`);
    return result.success && result.stdout.trim() === 'true';
  }

  /**
   * Get container status
   */
  async getContainerStatus(containerName) {
    const result = await this.execute(`docker inspect -f '{{.State.Status}}' ${containerName} 2>/dev/null`);
    return result.success ? result.stdout.trim() : 'not found';
  }

  /**
   * Get container health
   */
  async getContainerHealth(containerName) {
    const result = await this.execute(`docker inspect -f '{{.State.Health.Status}}' ${containerName} 2>/dev/null`);
    return result.success ? result.stdout.trim() : 'no healthcheck';
  }

  /**
   * Test: Check if CI/CD environment is running
   */
  async testEnvironmentRunning() {
    console.log('\n📍 Checking if CI/CD environment is started...');

    const result = await this.execute('docker ps --filter "name=hamnen_cicd" --format "{{.Names}}"');

    if (!result.success) {
      this.assert(false, 'Could not check Docker containers');
      return false;
    }

    const containers = result.stdout.trim().split('\n').filter(Boolean);

    if (containers.length === 0) {
      console.log('\n⚠️  CI/CD environment is not running!');
      console.log('   To start it, run:');
      console.log('   cd apps/development/cicd-complete && docker-compose up -d');
      this.assert(false, 'CI/CD environment is not running');
      return false;
    }

    this.assert(true, `Found ${containers.length} CI/CD containers running`);
    return true;
  }

  /**
   * Test: Validate all services
   */
  async testAllServices() {
    console.log('\n📍 Validating all CI/CD services...');

    for (const service of this.services) {
      console.log(`\n   ${service.name}:`);

      // Check if container is running
      const isRunning = await this.isContainerRunning(service.container);
      const status = await this.getContainerStatus(service.container);
      const health = await this.getContainerHealth(service.container);

      this.assert(isRunning, `Container ${service.container} is running`);

      if (!isRunning) {
        console.log(`     Status: ${status}`);
        continue;
      }

      // Show health status if available
      if (health !== 'no healthcheck' && health !== '') {
        const isHealthy = health === 'healthy';
        this.assert(isHealthy, `Health check: ${health}`, !isHealthy);
      }

      // Check HTTP endpoint if specified
      if (service.port && service.path) {
        const httpResult = await this.httpRequest(service.port, service.path);

        if (httpResult.success) {
          this.assert(
            httpResult.status < 500,
            `HTTP endpoint responding on port ${service.port} (status: ${httpResult.status})`
          );
        } else {
          this.assert(
            false,
            `HTTP endpoint on port ${service.port} not accessible: ${httpResult.error}`,
            true
          );
        }
      }
    }
  }

  /**
   * Test: Network connectivity
   */
  async testNetworkConnectivity() {
    console.log('\n📍 Testing network connectivity...');

    // Check if hamnen_cicd_network exists
    const networkResult = await this.execute('docker network inspect hamnen_cicd_network');
    this.assert(networkResult.success, 'CI/CD network (hamnen_cicd_network) exists');

    if (networkResult.success) {
      // Count connected containers
      try {
        const networkInfo = JSON.parse(networkResult.stdout);
        const containers = Object.keys(networkInfo[0].Containers || {});
        console.log(`     Connected containers: ${containers.length}`);
        this.assert(containers.length > 0, 'Containers are connected to CI/CD network');
      } catch (e) {
        console.log('     Could not parse network info');
      }
    }
  }

  /**
   * Test: Volume persistence
   */
  async testVolumePersistence() {
    console.log('\n📍 Testing volume persistence...');

    const volumeDirs = [
      'apps/development/cicd-complete/volumes/gitlab',
      'apps/development/cicd-complete/volumes/jenkins',
      'apps/development/cicd-complete/volumes/nexus',
      'apps/development/cicd-complete/volumes/sonarqube',
      'apps/development/cicd-complete/volumes/postgresql',
      'apps/development/cicd-complete/volumes/harbor'
    ];

    let existingVolumes = 0;

    for (const volDir of volumeDirs) {
      const result = await this.execute(`test -d ${volDir} && echo "exists"`);
      if (result.success && result.stdout.trim() === 'exists') {
        existingVolumes++;
      }
    }

    this.assert(
      existingVolumes > 0,
      `${existingVolumes}/${volumeDirs.length} volume directories exist`
    );
  }

  /**
   * Test: Port availability
   */
  async testPortAvailability() {
    console.log('\n📍 Testing port availability...');

    const ports = [8180, 8181, 8182, 8184, 8186, 8187];
    let listeningPorts = 0;

    for (const port of ports) {
      const result = await this.execute(`lsof -i :${port} -sTCP:LISTEN -t 2>/dev/null || netstat -tln | grep :${port} 2>/dev/null`);
      if (result.success && result.stdout.trim()) {
        listeningPorts++;
      }
    }

    this.assert(
      listeningPorts > 0,
      `${listeningPorts}/${ports.length} expected ports are listening`
    );
  }

  /**
   * Test: Resource usage
   */
  async testResourceUsage() {
    console.log('\n📍 Checking resource usage...');

    const result = await this.execute('docker stats --no-stream --format "table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}" --filter "name=hamnen_cicd"');

    if (result.success) {
      console.log('\n' + result.stdout);
      this.assert(true, 'Resource usage statistics retrieved');
    } else {
      this.assert(false, 'Could not retrieve resource usage');
    }
  }

  /**
   * Provide service access information
   */
  printServiceAccess() {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🌐 SERVICE ACCESS INFORMATION');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📍 Web Interfaces:');
    console.log('   GitLab:       http://localhost:8180');
    console.log('                 User: root | Pass: cicd_admin_password');
    console.log('   Jenkins:      http://localhost:8181');
    console.log('   Harbor:       http://localhost:8182');
    console.log('                 User: admin');
    console.log('   Nexus:        http://localhost:8184');
    console.log('                 User: admin | Pass: (see nexus-data/admin.password)');
    console.log('   SonarQube:    http://localhost:8186');
    console.log('                 User: admin | Pass: admin');
    console.log('   Selenium:     http://localhost:8187');
    console.log('\n📍 SSH:');
    console.log('   GitLab SSH:   localhost:2222');
  }

  /**
   * Run all validation tests
   */
  async runAll() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🚀 CI/CD COMPLETE ENVIRONMENT VALIDATION');
    console.log('═══════════════════════════════════════════════════');

    const isRunning = await this.testEnvironmentRunning();

    if (!isRunning) {
      console.log('\n═══════════════════════════════════════════════════');
      console.log('❌ CI/CD environment is not running. Please start it first.');
      console.log('═══════════════════════════════════════════════════');
      process.exit(1);
    }

    await this.testAllServices();
    await this.testNetworkConnectivity();
    await this.testVolumePersistence();
    await this.testPortAvailability();
    await this.testResourceUsage();

    // Print service access info
    this.printServiceAccess();

    // Print summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 VALIDATION SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✓ Passed:   ${this.passed}`);
    console.log(`⚠ Warnings: ${this.warnings}`);
    console.log(`✗ Failed:   ${this.failed}`);
    console.log(`Total:      ${this.passed + this.failed + this.warnings}`);

    const total = this.passed + this.failed;
    const successRate = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0;
    console.log(`Success Rate: ${successRate}%`);

    if (this.failed === 0) {
      if (this.warnings > 0) {
        console.log('\n⚠️  All tests passed with warnings!');
        console.log('Some services may still be initializing.');
      } else {
        console.log('\n🎉 All validation tests passed!');
        console.log('Your CI/CD environment is fully operational!');
      }
      process.exit(0);
    } else {
      console.log('\n❌ Some validation tests failed!');
      console.log('Please check the logs above for details.');
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new CICDValidator();
  validator.runAll().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = CICDValidator;
