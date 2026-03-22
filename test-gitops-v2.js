// Using native fetch from Node.js 22.

async function testGitOps() {
  console.log('--- Testing queryFiles ---');
  const res1 = await fetch('http://localhost:3001/api/gitops', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'queryFiles', params: { pattern: 'PHASES.md' } }),
  });
  console.log('Query PHASES.md:', await res1.json());

  console.log('\n--- Testing createCommit (Dry Run Simulation) ---');
  // We'll just test if it identifies an error if nothing added, 
  // or we can try a real commit if we have changes.
  const res2 = await fetch('http://localhost:3001/api/gitops', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'createCommit', params: { message: 'test: gitops v2 validation', files: 'TRACKING.md' } }),
  });
  console.log('Create Commit:', await res2.json());
}

testGitOps();
