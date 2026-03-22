const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

app.post('/api/gitops', (req, res) => {
  const { action, params } = req.body;
  console.log(`GitOps Action: ${action}`, params);
  res.json({ status: 'success', action, params });
});

app.listen(port, () => {
  console.log(`GitOps API listening at http://localhost:${port}`);
});
