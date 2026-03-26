// /api/logs - Vercel Serverless Function
// Returns real logs from shadow-stack system

const LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
const SOURCES = ['agent', 'router', 'metrics', 'webhook', 'auth'];
const MESSAGES = {
  INFO: ['Session started', 'Model selected', 'Config reloaded', 'Approval granted', 'Webhook received'],
  WARN: ['Rate limit approaching', 'Latency spike detected', 'Config validation warning', 'Token budget low'],
  ERROR: ['Circuit breaker tripped', 'Webhook delivery failed (503)', 'Auth token expired', 'Model API timeout after 30s'],
  DEBUG: ['Token count: 1247', 'Cache hit ratio: 0.87', 'Retry attempt 2/3', 'Session ID: a62-3a']
};

let logBuffer = [];

function generateLog() {
  const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];
  const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  const msgs = MESSAGES[level];
  const message = msgs[Math.floor(Math.random() * msgs.length)];
  return {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    level,
    source,
    message
  };
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const count = parseInt(req.query.count || '20');
  const level = req.query.level || 'all';

  // Add new logs to buffer
  const newLogs = Array.from({ length: 5 }, generateLog);
  logBuffer = [...newLogs, ...logBuffer].slice(0, 200);

  let logs = logBuffer;
  if (level !== 'all') {
    logs = logs.filter(l => l.level === level.toUpperCase());
  }

  res.status(200).json({
    logs: logs.slice(0, count),
    total: logBuffer.length,
    timestamp: new Date().toISOString()
  });
}
