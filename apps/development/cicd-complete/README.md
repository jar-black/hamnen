# Complete CI/CD Development Environment

A comprehensive, integrated DevOps platform combining the most powerful CI/CD tools in a single, unified environment. All services run on a shared network and start from one Hamnen card.

## 🎯 What's Included

### Core CI/CD Services

1. **GitLab CE** - Full DevOps Platform
   - Git repository management
   - Built-in CI/CD pipelines
   - Issue tracking and project management
   - Container registry
   - Access: http://localhost:8180
   - SSH: localhost:2222

2. **Jenkins** - Advanced CI/CD Automation
   - Extensive plugin ecosystem
   - Complex pipeline orchestration
   - Multi-branch builds
   - Access: http://localhost:8181

3. **Harbor** - Enterprise Container Registry
   - Docker image storage
   - Vulnerability scanning
   - Image signing
   - Replication support
   - Access: http://localhost:8182

4. **Nexus Repository** - Universal Artifact Manager
   - Maven, npm, PyPI, Docker, NuGet support
   - Proxy caching
   - Release and snapshot repositories
   - Access: http://localhost:8184

5. **SonarQube** - Code Quality Platform
   - Static code analysis
   - Security vulnerability detection
   - Technical debt tracking
   - Access: http://localhost:8186

6. **Selenium Grid** - Automated Testing
   - Parallel browser testing
   - Chrome and Firefox nodes
   - Scalable test execution
   - Access: http://localhost:8187

### Supporting Services

- **PostgreSQL** - Shared database for GitLab and SonarQube
- **Redis** - Caching layer for GitLab
- **GitLab Runner** - CI/CD job executor with Docker-in-Docker
- **Selenium Chrome/Firefox Nodes** - Browser test execution

## 📊 Resource Requirements

- **RAM**: 6-8GB minimum recommended
- **Disk**: 20GB+ for volumes and images
- **CPU**: 4+ cores recommended
- **Startup Time**: 3-5 minutes for full initialization

## 🚀 Getting Started

### Starting the Environment

Simply click the "Start" button on the Hamnen card, or use:

```bash
cd apps/development/cicd-complete
docker-compose up -d
```

### Default Credentials

**GitLab**
- Username: `root`
- Password: `cicd_admin_password`
- SSH Port: 2222

**Jenkins**
- Setup wizard is disabled
- Initial admin password: check `/var/jenkins_home/secrets/initialAdminPassword` in container

**Harbor**
- Username: `admin`
- Password: Check Harbor documentation for default

**Nexus**
- Username: `admin`
- Password: Check `nexus-data/admin.password` file on first run

**SonarQube**
- Username: `admin`
- Password: `admin` (change on first login)

## 🔄 Complete DevOps Workflow

This environment enables end-to-end CI/CD workflows:

```
1. Code → GitLab (Git repository)
2. Push triggers → GitLab CI/Jenkins Pipeline
3. Build & Test → Selenium Grid (automated tests)
4. Code Analysis → SonarQube (quality gates)
5. Build Artifacts → Nexus (Maven/npm/PyPI packages)
6. Container Images → Harbor (Docker registry)
7. Deploy → Use any deployment target
```

## 🔗 Service Integration Examples

### GitLab CI with Nexus

```yaml
# .gitlab-ci.yml
deploy:
  script:
    - mvn deploy -DaltDeploymentRepository=nexus::default::http://nexus:8081/repository/maven-releases/
```

### Jenkins with SonarQube

```groovy
// Jenkinsfile
stage('Code Quality') {
    steps {
        withSonarQubeEnv('SonarQube') {
            sh 'mvn sonar:sonar'
        }
    }
}
```

### Selenium Tests with GitLab CI

```yaml
# .gitlab-ci.yml
test:
  script:
    - pytest --selenium-hub=http://selenium-hub:4444/wd/hub
```

### Push to Harbor from GitLab

```yaml
# .gitlab-ci.yml
build:
  script:
    - docker build -t harbor-proxy:8080/library/myapp:latest .
    - docker push harbor-proxy:8080/library/myapp:latest
```

## 🌐 Network Architecture

All services communicate on the `hamnen_cicd_network` bridge network. Services can reach each other using their container names:

- `gitlab` → GitLab CE
- `jenkins` → Jenkins
- `harbor-proxy` → Harbor UI
- `nexus` → Nexus Repository
- `sonarqube` → SonarQube
- `selenium-hub` → Selenium Grid Hub
- `postgresql` → PostgreSQL Database
- `redis` → Redis Cache

## 📁 Volume Structure

All persistent data is stored in the `volumes/` directory:

```
volumes/
├── gitlab/          # GitLab configuration, logs, and data
├── jenkins/         # Jenkins home directory
├── harbor/          # Harbor registry and database
├── nexus/           # Nexus repository data
├── sonarqube/       # SonarQube data, logs, extensions
├── postgresql/      # PostgreSQL databases
└── redis/           # Redis cache data
```

## 🔧 Configuration

### Registering GitLab Runner

After GitLab starts, register the runner:

```bash
# Get the registration token from GitLab UI: Admin Area → CI/CD → Runners
docker exec -it hamnen_cicd_gitlab_runner gitlab-runner register \
  --url http://gitlab \
  --registration-token YOUR_TOKEN \
  --executor docker \
  --docker-image docker:latest \
  --docker-volumes /var/run/docker.sock:/var/run/docker.sock
```

### Configuring Harbor in GitLab

1. Go to Admin Area → Settings → CI/CD → Container Registry
2. Add Harbor as an external registry
3. URL: `http://harbor-proxy:8080`

### Setting up Nexus Repositories

1. Access Nexus at http://localhost:8184
2. Sign in with admin credentials
3. Create repositories:
   - Docker (hosted) on port 8082
   - Maven (hosted/proxy)
   - npm (hosted/proxy)
   - PyPI (hosted/proxy)

## 🔍 Health Checks

All services include health checks to monitor readiness:

- **GitLab**: Polls `/-/health` endpoint
- **Jenkins**: Checks login page availability
- **PostgreSQL**: Uses `pg_isready`
- **Redis**: Pings Redis server
- **SonarQube**: Checks system status API
- **Selenium Hub**: Checks hub status endpoint

## 🛠️ Troubleshooting

### Services Not Starting

Check logs for specific services:
```bash
docker-compose logs -f gitlab
docker-compose logs -f jenkins
```

### High Memory Usage

GitLab and Nexus are memory-intensive. To reduce usage:
- Disable GitLab Prometheus: Already done in configuration
- Reduce Nexus heap: Adjust `INSTALL4J_ADD_VM_PARAMS`

### Port Conflicts

If ports are already in use, edit `docker-compose.yml` and change port mappings:
```yaml
ports:
  - "NEW_PORT:CONTAINER_PORT"
```

### GitLab Taking Too Long

GitLab can take 2-3 minutes to fully initialize. Check status:
```bash
docker exec hamnen_cicd_gitlab gitlab-ctl status
```

## 📚 Documentation Links

- [GitLab Docs](https://docs.gitlab.com/)
- [Jenkins Docs](https://www.jenkins.io/doc/)
- [Harbor Docs](https://goharbor.io/docs/)
- [Nexus Docs](https://help.sonatype.com/repomanager3)
- [SonarQube Docs](https://docs.sonarqube.org/)
- [Selenium Grid Docs](https://www.selenium.dev/documentation/grid/)

## 🔒 Security Notes

**IMPORTANT**: This configuration uses default passwords and is intended for development environments only.

For production use:
1. Change all default passwords
2. Enable HTTPS/TLS for all services
3. Configure proper authentication (LDAP/OAuth)
4. Set up network isolation
5. Enable Harbor vulnerability scanning
6. Configure SonarQube quality gates
7. Implement secrets management (Vault)

## 🎓 Learning Resources

This environment is perfect for:
- Learning DevOps practices
- Testing CI/CD pipelines
- Experimenting with automation
- Building complete workflows
- Training and education
- POC and prototyping

## 📝 Notes

- All services are configured to restart automatically unless stopped
- Data persists across container restarts in volumes
- GitLab includes built-in container registry
- Jenkins has Docker socket access for Docker-in-Docker builds
- Selenium Grid includes both Chrome and Firefox nodes
- PostgreSQL is shared between GitLab and SonarQube for efficiency

## 🤝 Integration Tips

1. **Use GitLab as the central hub** - Its built-in CI/CD can trigger Jenkins jobs
2. **Store all artifacts in Nexus** - Maven, npm, Python packages
3. **Push all containers to Harbor** - Better than GitLab registry for production
4. **Gate all merges with SonarQube** - Enforce quality standards
5. **Run all tests on Selenium Grid** - Parallel execution for faster feedback

## 🎯 Next Steps

1. Access GitLab and create your first project
2. Set up a GitLab CI pipeline
3. Configure Jenkins for additional automation
4. Create repositories in Nexus
5. Set up Harbor projects and registries
6. Configure SonarQube quality profiles
7. Write Selenium tests for your applications

Enjoy your complete CI/CD environment!
