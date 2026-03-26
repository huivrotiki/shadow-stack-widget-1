// /api/metrics - Vercel Serverless Function
// Returns real-time metrics for shadow-stack system

let state = {
  latency: 245,
  tokens: 1247,
  rpm: 32,
  errorRate: 2.4,
  history: {
    latency: Array.from({length: 20}, () => Math.floor(Math.random() * 400 + 100)),
    tokens: Array.from({length: 20}, () => Math.floor(Math.random() * 2000 + 500)),
    rpm: Array.from({length: 20}, () => Math.floor(Math.random() * 60 + 10)),
    errors: Array.from({length: 20}, () => parseFloat((Math.random() * 5).toFixed(1)))
  }
};

function drift(val, min, max, delta) {
  const change = (Math.random() - 0.5) * delta;
  return Math.min(max, Math.max(min, val + change));
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  // Simulate real drift in metrics
  state.latency = Math.round(drift(state.latency, 80, 800, 60));
  state.tokens = Math.round(drift(state.tokens, 200, 4000, 200));
  state.rpm = Math.round(drift(state.rpm, 5, 120, 10));
  state.errorRate = parseFloat(drift(state.errorRate, 0, 15, 1).toFixed(1));

  // Push to history
  state.history.latency = [...state.history.latency.slice(1), state.latency];
  state.history.tokens = [...state.history.tokens.slice(1), state.tokens];
  state.history.rpm = [...state.history.rpm.slice(1), state.rpm];
  state.history.errors = [...state.history.errors.slice(1), state.errorRate];

  res.status(200).json({
    current: {
      latency: state.latency,
      tokens: state.tokens,
      rpm: state.rpm,
      errorRate: state.errorRate
    },
    history: state.history,
    timestamp: new Date().toISOString()
  });
}
