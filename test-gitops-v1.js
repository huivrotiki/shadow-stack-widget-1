fetch('http://localhost:3000/api/gitops', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'createPullRequest',
    params: {
      head: 'feature/new-branch',
      base: 'main',
      title: 'New Feature',
      body: 'This is a test PR creation.',
    },
  }),
})
.then(r => r.json())
.then(console.log);
