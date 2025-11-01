#!/usr/bin/env node

/**
 * Hamnen Test Suite Runner
 * Master test script that runs all tests for the Hamnen application
 */

const { spawn } = require('child_process');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  /**
   * Print banner
   */
  printBanner() {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║                                                   ║');
    console.log('║           HAMNEN TEST SUITE v1.0                  ║');
    console.log('║      Complete Application Testing Framework      ║');
    console.log('║                                                   ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');
  }

  /**
   * Execute a test script
   */
  async runTest(name, scriptPath, requireBackend = false) {
    console.log('\n' + '─'.repeat(50));
    console.log(`Running: ${name}`);
    console.log('─'.repeat(50));

    // Check if backend is required and running
    if (requireBackend) {
      const isBackendRunning = await this.checkBackendRunning();
      if (!isBackendRunning) {
        console.log('⚠️  Warning: Backend is not running!');
        console.log('   Some tests may fail. Start backend with:');
        console.log('   cd backend && npm run dev');
        console.log('');
      }
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        cwd: path.dirname(scriptPath)
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        const result = {
          name,
          success: code === 0,
          duration,
          exitCode: code
        };

        this.results.push(result);
        resolve(result);
      });

      child.on('error', (error) => {
        const duration = Date.now() - startTime;
        const result = {
          name,
          success: false,
          duration,
          error: error.message
        };

        this.results.push(result);
        resolve(result);
      });
    });
  }

  /**
   * Check if backend is running
   */
  async checkBackendRunning() {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      const result = await execAsync('curl -s http://localhost:3001/health');
      return result.stdout.includes('"status":"ok"');
    } catch {
      return false;
    }
  }

  /**
   * Print summary
   */
  printSummary() {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;

    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║              FINAL TEST SUMMARY                   ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');

    // Print individual test results
    this.results.forEach(result => {
      const status = result.success ? '✓' : '✗';
      const symbol = result.success ? '🟢' : '🔴';
      const duration = (result.duration / 1000).toFixed(2);

      console.log(`${symbol} ${status} ${result.name.padEnd(40)} ${duration}s`);
    });

    console.log('');
    console.log('─'.repeat(50));
    console.log(`Total Tests:    ${this.results.length}`);
    console.log(`Passed:         ${passed} ✓`);
    console.log(`Failed:         ${failed} ✗`);
    console.log(`Success Rate:   ${((passed / this.results.length) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('─'.repeat(50));

    if (failed === 0) {
      console.log('\n🎉 All test suites passed successfully!');
      return 0;
    } else {
      console.log(`\n❌ ${failed} test suite(s) failed!`);
      return 1;
    }
  }

  /**
   * Print usage instructions
   */
  printUsage() {
    console.log('\n📚 USAGE INSTRUCTIONS:');
    console.log('');
    console.log('Run all tests:');
    console.log('  npm test');
    console.log('  node test.js');
    console.log('');
    console.log('Run specific test suites:');
    console.log('  node test.js --docker         # Docker integration tests only');
    console.log('  node test.js --api            # API tests only');
    console.log('  node test.js --cicd           # CI/CD validation only');
    console.log('  node test.js --quick          # Quick smoke tests');
    console.log('');
    console.log('Run individual test files:');
    console.log('  node backend/tests/api.test.js');
    console.log('  node backend/tests/docker.test.js');
    console.log('  node tests/cicd-validation.js');
    console.log('');
    console.log('Prerequisites:');
    console.log('  • Docker and Docker Compose installed');
    console.log('  • Backend server running for API tests (cd backend && npm run dev)');
    console.log('  • CI/CD environment started for CI/CD tests (cd apps/development/cicd-complete && docker-compose up -d)');
    console.log('');
  }

  /**
   * Run quick smoke tests
   */
  async runQuickTests() {
    console.log('\n🚀 Running Quick Smoke Tests...\n');

    // Just run Docker tests (fastest and doesn't require backend)
    await this.runTest(
      'Docker Integration Tests',
      path.join(__dirname, 'backend/tests/docker.test.js'),
      false
    );
  }

  /**
   * Run full test suite
   */
  async runAll() {
    this.printBanner();

    const args = process.argv.slice(2);

    // Handle command-line arguments
    if (args.includes('--help') || args.includes('-h')) {
      this.printUsage();
      return 0;
    }

    if (args.includes('--quick')) {
      await this.runQuickTests();
      return this.printSummary();
    }

    // Check what to run based on arguments
    const runDocker = args.length === 0 || args.includes('--docker');
    const runApi = args.length === 0 || args.includes('--api');
    const runCicd = args.length === 0 || args.includes('--cicd');

    console.log('Starting Hamnen test suite...\n');

    // Run Docker tests (these don't require backend)
    if (runDocker) {
      await this.runTest(
        'Docker Integration Tests',
        path.join(__dirname, 'backend/tests/docker.test.js'),
        false
      );
    }

    // Run API tests (these require backend)
    if (runApi) {
      await this.runTest(
        'Backend API Tests',
        path.join(__dirname, 'backend/tests/api.test.js'),
        true
      );
    }

    // Run CI/CD validation (only if CI/CD environment might be running)
    if (runCicd) {
      console.log('\n📍 Checking if CI/CD environment is running...');
      try {
        const { stdout } = await execAsync('docker ps --filter "name=hamnen_cicd" --format "{{.Names}}" | wc -l');
        const containerCount = parseInt(stdout.trim());

        if (containerCount > 0) {
          await this.runTest(
            'CI/CD Environment Validation',
            path.join(__dirname, 'tests/cicd-validation.js'),
            false
          );
        } else {
          console.log('⚠️  CI/CD environment is not running, skipping CI/CD validation tests.');
          console.log('   To run CI/CD tests, start the environment first:');
          console.log('   cd apps/development/cicd-complete && docker-compose up -d');
        }
      } catch (error) {
        console.log('⚠️  Could not check CI/CD environment status, skipping tests.');
      }
    }

    return this.printSummary();
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAll()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = TestRunner;
