import express from 'express';
import { z } from 'zod';
import { runPrompt } from './router.js';
import { generateGenericText } from './ai-service.js';
import gitops from './gitops-service.js';
import logger from './logger.js';

const app = express();
const port = 3001;

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

const gitopsSchema = z.object({
  action: z.string(),
  params: z.any().optional(),
});

app.post('/api/gitops', async (req, res, next) => {
  try {
    const { action, params } = gitopsSchema.parse(req.body);
    logger.info(`GitOps Action: ${action}`);

    if (action === 'queryFiles') {
      const result = await gitops.queryFiles(params?.pattern);
      return res.json(result);
    }
    
    if (action === 'createCommit') {
      const result = await gitops.createCommit(params?.message, params?.files);
      return res.json(result);
    }
    
    res.status(400).json({ status: 'error', error: `Unknown Action: ${action}` });
  } catch (err) {
    next(err);
  }
});

app.post('/api/chat', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const text = await generateGenericText(prompt);
    res.json({ text });
  } catch (err) {
    next(err);
  }
});

app.post('/api/orchestrator/prompt', async (req, res, next) => {
  try {
    const { text, sessionId } = req.body;
    const result = await runPrompt(text, sessionId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Centralized error handling
app.use((err, req, res, next) => {
  if (err instanceof z.ZodError) {
    logger.warn('Validation error', { issues: err.issues });
    return res.status(400).json({ status: 'error', error: 'Validation failed', details: err.issues });
  }
  
  logger.error('Unhandled Server Error', { error: err.message, stack: err.stack });
  res.status(500).json({ status: 'error', error: err.message });
});

app.listen(port, () => {
  logger.info(`GitOps API & Orchestrator (ESM) listening at http://localhost:${port}`);
});
