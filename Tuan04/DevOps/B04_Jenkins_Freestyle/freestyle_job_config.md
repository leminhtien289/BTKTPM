# B04 — Jenkins Freestyle Job: Pull Code → Build → Test

## Setup Jenkins

```bash
# 1. Start Jenkins
docker compose -f docker-compose.jenkins.yml up -d

# 2. Get initial admin password
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# 3. Access http://localhost:8888 and complete setup wizard
# Install plugins: Git, NodeJS, Docker Pipeline
```

## Freestyle Job Configuration

**Job Name:** `myapp-build-test`

### General
- Description: Build and test MyApp Node.js application
- Discard old builds: Keep last 10 builds

### Source Code Management
```
Git:
  Repository URL: https://github.com/username/myapp.git
  Branch: */main
  Credentials: github-token (add in Manage Jenkins → Credentials)
```

### Build Triggers
```
☑ Poll SCM
  Schedule: H/5 * * * *   (check every 5 minutes)
  
☑ GitHub hook trigger for GITScm polling
  (for instant trigger on push — needs GitHub webhook)
```

### Build Environment
```
☑ Use secret text(s) or file(s)
  Secret text: DB_PASSWORD → credential: db-password-prod

☑ Delete workspace before build starts  (clean build)

☑ Add timestamps to Console Output
```

### Build Steps (Execute Shell)

**Step 1 — Install dependencies:**
```bash
#!/bin/bash
echo "=== Step 1: Install dependencies ==="
cd ${WORKSPACE}
node --version
npm --version
npm ci --prefer-offline   # ci = clean install (uses package-lock.json)
echo "Dependencies installed"
```

**Step 2 — Lint:**
```bash
#!/bin/bash
echo "=== Step 2: Lint ==="
cd ${WORKSPACE}
npm run lint
echo "Lint passed"
```

**Step 3 — Test:**
```bash
#!/bin/bash
echo "=== Step 3: Run tests ==="
cd ${WORKSPACE}
npm test -- --reporter=junit --reporter-options output=test-results/results.xml
echo "Tests complete"
```

**Step 4 — Build:**
```bash
#!/bin/bash
echo "=== Step 4: Build ==="
cd ${WORKSPACE}
npm run build
ls -la dist/
echo "Build complete"
```

### Post-build Actions

```
☑ Publish JUnit test result report
  Test report XMLs: **/test-results/*.xml

☑ Email Notification
  Recipients: team@example.com
  Send e-mail for every unstable build

☑ Archive the artifacts
  Files to archive: dist/**
```

## Kiểm tra kết quả

```
Console Output sẽ hiện:
  ✓ Checked out main branch
  ✓ Dependencies installed (npm ci)
  ✓ Lint passed
  ✓ 24 tests passed (0 failed)
  ✓ Build artifacts archived

Build Status: SUCCESS (xanh lá)
```
