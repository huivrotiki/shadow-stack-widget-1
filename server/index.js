import express from 'express';
import { runPrompt } from './router.js';
import { generateGenericText } from './ai-service.js';
import gitops from './gitops-service.js';

const app = express();
const port = 3001;

app.use(express.json());

app.post('/api/gitops', async (req, res) => {
  const { action, params } = req.body;
  
  if (action === 'queryFiles') {
    const result = await gitops.queryFiles(params.pattern);
    return res.json(result);
  }
  
  if (action === 'createCommit') {
    const result = await gitops.createCommit(params.message, params.files);
    return res.json(result);
  }

  res.status(400).json({ status: 'error', error: `Unknown Action: ${action}` });
});

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  try {
    const text = await generateGenericText(prompt);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orchestrator/prompt', async (req, res) => {
  const { text, sessionId } = req.body;

  try {
    const result = await runPrompt(text, sessionId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`GitOps API & Orchestrator (ESM) listening at http://localhost:${port}`);
});
