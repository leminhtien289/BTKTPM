# XLSX B10 — CI/CD GitHub Actions

## What this does

Push to `main` → GitHub Actions automatically:
1. Checks out code
2. Sets up Docker Buildx
3. Logs in to Docker Hub
4. Builds the `api-gateway` Docker image
5. Pushes to Docker Hub with tags `:latest` and `:<commit-sha>`
6. Calls Render.com Deploy Hook → Render pulls new image → restarts service
7. Prints a deployment summary

## One-time setup

### 1. Push repo to GitHub

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 2. Create Docker Hub Access Token

1. hub.docker.com → Account Settings → Security → New Access Token
2. Name: `github-actions`, Access: Read/Write/Delete
3. Copy the token

### 3. Add GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret name | Value |
|-------------|-------|
| `DOCKER_USERNAME` | your Docker Hub username |
| `DOCKER_PASSWORD` | the access token from step 2 |
| `RENDER_DEPLOY_HOOK_URL` | deploy hook URL from Render (step 4 below) |

### 4. Create service on Render.com

**Option A — Deploy from Docker Hub (recommended for this lab)**

1. render.com → New → Web Service
2. Choose "Deploy an existing image from a registry"
3. Image URL: `docker.io/<DOCKER_USERNAME>/microservice-api-gateway:latest`
4. Name: `microservice-api-gateway`, Region: Singapore, Instance: Free
5. Set environment variables (JWT_SECRET etc.)
6. Create service → copy the **Deploy Hook URL** from Settings → Deploy Hook
7. Paste it as the `RENDER_DEPLOY_HOOK_URL` secret in GitHub

**Option B — Render Blueprint (render.yaml)**

1. render.com → New → Blueprint
2. Connect your GitHub repo
3. Render reads `Tuan10/Microservice-Ecommerce/render.yaml` and creates the service
4. Get the Deploy Hook URL from the created service's Settings

### 5. Test the pipeline

```bash
# Make any change and push
git commit --allow-empty -m "test: trigger CI/CD pipeline"
git push origin main
```

Then open: `https://github.com/<your-username>/<your-repo>/actions`

You should see the workflow running with 7 steps.

## Workflow file

```
.github/workflows/deploy.yml
```

## Verify locally

```bash
cd Tuan10/Microservice-Ecommerce
npm install
npm run check
```

This checks the workflow file has all required B10 components without needing Docker or a live service.

## Architecture

```
Developer pushes to main
        │
        ▼
 GitHub Actions (.github/workflows/deploy.yml)
        │
        ├─ Step 1: git checkout
        ├─ Step 2: docker/setup-buildx-action
        ├─ Step 3: docker/login-action (Docker Hub)
        ├─ Step 4+5: docker/build-push-action
        │            → push :latest + :<sha>
        │
        ├─ Step 6: curl RENDER_DEPLOY_HOOK_URL
        │          → Render pulls :latest from Docker Hub
        │          → restarts api-gateway container
        │
        └─ Step 7: print summary
```

## Rollback

To roll back to a previous commit:

```bash
# Find the commit SHA from Docker Hub tags or GitHub Actions logs
docker pull <DOCKER_USERNAME>/microservice-api-gateway:<old-sha>

# Re-tag and push to trigger redeploy
docker tag <DOCKER_USERNAME>/microservice-api-gateway:<old-sha> \
           <DOCKER_USERNAME>/microservice-api-gateway:latest
docker push <DOCKER_USERNAME>/microservice-api-gateway:latest

# Trigger Render deploy manually (or use workflow_dispatch in Actions UI)
```
