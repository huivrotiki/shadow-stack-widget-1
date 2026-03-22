const { runPrompt } = require('./router');
const { generateGenericText } = require('./ai-service');
const app = express();
const port = 3001;

app.use(express.json());

app.post('/api/gitops', (req, res) => {
  const { action, params } = req.body;
  console.log(`GitOps Action: ${action}`, params);
  res.json({ status: 'success', action, params });
});

/**
 * AI Chat Endpoint (Vercel AI SDK wrapper for Node)
 */
app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  try {
    const text = await generateGenericText(prompt);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Orchestrator Endpoint: Routes prompts through opencode SDK with multi-routing logic.
 */
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
  console.log(`GitOps API & Orchestrator listening at http://localhost:${port}`);
});
