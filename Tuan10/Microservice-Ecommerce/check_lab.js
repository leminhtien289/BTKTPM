/**
 * Lab B10 — CI/CD check
 * Verifies the workflow file exists and contains all required B10 components.
 * Does NOT require Docker or a running service — static analysis only.
 */
const fs   = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT     = path.resolve(__dirname, '..', '..');
const WORKFLOW = path.join(ROOT, '.github', 'workflows', 'deploy.yml');
const RENDER   = path.join(__dirname, 'render.yaml');

let passed = 0, failed = 0;

function test(label, fn) {
  try { fn(); console.log(`  [PASS] ${label}`); passed++; }
  catch (e) { console.log(`  [FAIL] ${label} — ${e.message}`); failed++; }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

function run() {
  console.log('\nLab B10 — CI/CD GitHub Actions\n');

  // ── Workflow file exists ─────────────────────────────────────────────────────
  console.log('=== Workflow File ===');
  test('deploy.yml exists at .github/workflows/deploy.yml', () => {
    assert(fs.existsSync(WORKFLOW), `file not found: ${WORKFLOW}`);
  });

  // Parse the YAML
  let wf = null;
  test('deploy.yml is valid YAML', () => {
    const raw = fs.readFileSync(WORKFLOW, 'utf8');
    wf = yaml.load(raw);
    assert(wf && typeof wf === 'object', 'YAML parse returned empty/null');
  });

  if (!wf) { console.log('\nCannot continue — YAML parse failed'); process.exit(1); }

  // ── Trigger ───────────────────────────────────────────────────────────────────
  console.log('\n=== Trigger ===');
  test('Triggers on push to main branch', () => {
    const branches = wf.on?.push?.branches ?? [];
    assert(branches.includes('main'), `push.branches must include "main", got: ${JSON.stringify(branches)}`);
  });

  test('workflow_dispatch (manual trigger) is present', () => {
    assert('workflow_dispatch' in wf.on, 'workflow_dispatch trigger missing');
  });

  // ── Jobs ──────────────────────────────────────────────────────────────────────
  console.log('\n=== Jobs & Steps ===');
  const jobs = Object.values(wf.jobs ?? {});
  test('At least one job is defined', () => {
    assert(jobs.length > 0, 'no jobs found in workflow');
  });

  const allSteps = jobs.flatMap(j => j.steps ?? []);
  const stepNames  = allSteps.map(s => (s.name || '').toLowerCase());
  const stepUses   = allSteps.map(s => (s.uses || '').toLowerCase());
  const stepRuns   = allSteps.map(s => (s.run || '').toLowerCase());
  const everything = [...stepNames, ...stepUses, ...stepRuns].join(' ');

  // Step 1 — checkout
  test('Step 1: actions/checkout present', () => {
    assert(stepUses.some(u => u.startsWith('actions/checkout')), 'actions/checkout not found');
  });

  // Step 2 — buildx
  test('Step 2: Docker Buildx setup present', () => {
    assert(
      stepUses.some(u => u.includes('setup-buildx')) || everything.includes('buildx'),
      'Docker Buildx setup not found'
    );
  });

  // Step 3 — login
  test('Step 3: Docker Hub login present', () => {
    assert(
      stepUses.some(u => u.includes('login-action')) || everything.includes('docker/login'),
      'Docker login step not found'
    );
  });

  test('Step 3: DOCKER_USERNAME secret referenced', () => {
    const raw = fs.readFileSync(WORKFLOW, 'utf8');
    assert(raw.includes('DOCKER_USERNAME'), 'DOCKER_USERNAME secret not referenced');
  });

  test('Step 3: DOCKER_PASSWORD secret referenced', () => {
    const raw = fs.readFileSync(WORKFLOW, 'utf8');
    assert(raw.includes('DOCKER_PASSWORD'), 'DOCKER_PASSWORD secret not referenced');
  });

  // Step 4+5 — build and push
  test('Step 4+5: Docker build-push-action present', () => {
    assert(
      stepUses.some(u => u.includes('build-push-action')) || everything.includes('docker build'),
      'build-and-push step not found'
    );
  });

  test('Step 4+5: image tagged with :latest', () => {
    const raw = fs.readFileSync(WORKFLOW, 'utf8');
    assert(raw.includes(':latest'), 'image tag :latest not found');
  });

  test('Step 4+5: image tagged with commit SHA', () => {
    const raw = fs.readFileSync(WORKFLOW, 'utf8');
    assert(raw.includes('github.sha'), 'github.sha tag not found — cannot trace deployments to commits');
  });

  // Step 6 — Render deploy hook
  test('Step 6: Render.com deploy hook step present', () => {
    const raw = fs.readFileSync(WORKFLOW, 'utf8');
    assert(
      raw.includes('RENDER_DEPLOY_HOOK_URL') || raw.includes('render.com'),
      'Render deploy hook (RENDER_DEPLOY_HOOK_URL) not found'
    );
  });

  // Step 7 — summary
  test('Step 7: deployment summary step present', () => {
    assert(
      stepNames.some(n => n.includes('summar') || n.includes('result') || n.includes('complete') || n.includes('deploy')),
      'no summary/result step found'
    );
  });

  // ── Render Blueprint ──────────────────────────────────────────────────────────
  console.log('\n=== Render Blueprint ===');
  test('render.yaml exists', () => {
    assert(fs.existsSync(RENDER), `file not found: ${RENDER}`);
  });

  test('render.yaml is valid YAML with at least one service', () => {
    const r = yaml.load(fs.readFileSync(RENDER, 'utf8'));
    assert(Array.isArray(r?.services) && r.services.length > 0, 'render.yaml must define at least one service');
    console.log(`       Service defined: ${r.services[0].name}`);
  });

  test('render.yaml has healthCheckPath', () => {
    const r = yaml.load(fs.readFileSync(RENDER, 'utf8'));
    assert(r.services[0].healthCheckPath, 'healthCheckPath not set in render.yaml');
  });

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(45)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('All checks PASSED — Lab B10 complete!');
    console.log('\nNext: push to GitHub, add Secrets, watch Actions run.');
  } else {
    console.log('Some checks FAILED — review output above.');
  }
  process.exit(failed > 0 ? 1 : 0);
}

run();
