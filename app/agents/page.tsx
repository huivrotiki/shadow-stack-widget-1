'use client';

import React, { useState, useEffect } from 'react';

// Premium Glassmorphism Agent Control Panel

const AGENTS = [
  {
    id: 'local-qwen',
    name: 'Context Engine (Local)',
    role: 'Researcher',
    model: 'qwen:latest',
    status: 'online',
    description: 'Handles >5k long context tasks securely on-device.',
    color: '#10b981' // emerald
  },
  {
    id: 'groq-llama3',
    name: 'Logic Refactor (Groq)',
    role: 'Coder',
    model: 'llama-3-8b',
    status: 'online',
    description: 'Lightning fast execution for refactoring & fixes.',
    color: '#3b82f6' // blue
  },
  {
    id: 'openrouter-gpt4',
    name: 'Universal Base',
    role: 'Generalist',
    model: 'gpt-4.1-mini',
    status: 'idle',
    description: 'Fallback agent for generic queries via API.',
    color: '#8b5cf6' // purple
  }
];

export default function AgentControlPanel() {
  const [agents, setAgents] = useState(AGENTS);
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState<{ router?: string, response?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestRouting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPrompt.trim()) return;

    setIsTesting(true);
    setTestResult(null);

    // Simulate routing or call the actual endpoint
    try {
      const res = await fetch('/api/orchestrator/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testPrompt, sessionId: 'agent-control' })
      });
      const data = await res.json();
      
      // Flash the targeted agent to indicate activity (Simulation)
      const routerMatch = data.response?.toLowerCase() || '';
      let targetId = 'openrouter-gpt4';
      if (testPrompt.length > 50 || routerMatch.includes('long context')) targetId = 'local-qwen';
      else if (testPrompt.includes('code') || testPrompt.includes('refactor')) targetId = 'groq-llama3';

      setAgents(prev => prev.map(a => 
        a.id === targetId ? { ...a, status: 'active' } : { ...a, status: 'idle' }
      ));

      setTimeout(() => {
        setAgents(prev => prev.map(a => ({ ...a, status: a.id === targetId ? 'online' : 'idle' })));
      }, 2000);

      setTestResult({
        router: targetId,
        response: data.response || JSON.stringify(data)
      });
    } catch (err: any) {
      setTestResult({ response: `Error: ${err.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="control-center">
      <style jsx>{`
        .control-center {
          min-height: 100vh;
          background: #020617;
          color: #f8fafc;
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
          padding: 3rem;
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(59, 130, 246, 0.15), transparent 25%),
            radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.15), transparent 25%);
        }

        .header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .title {
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(to right, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: #94a3b8;
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto 4rem auto;
        }

        .agent-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(51, 65, 85, 0.5);
          border-radius: 24px;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .agent-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);
          border-color: rgba(148, 163, 184, 0.3);
        }

        .agent-card.active {
          border-color: #3b82f6;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.2);
        }

        .status-badge {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-online { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .status-active { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); animation: pulse 1.5s infinite; }
        .status-idle { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }

        .agent-role {
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          opacity: 0.9;
        }

        .agent-name {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .agent-model {
          display: inline-block;
          font-family: 'Fira Code', monospace;
          background: rgba(0,0,0,0.3);
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.8rem;
          color: #cbd5e1;
          margin-bottom: 1.5rem;
        }

        .agent-desc {
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .router-test {
          max-width: 800px;
          margin: 0 auto;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(51, 65, 85, 0.5);
          border-radius: 20px;
          padding: 2.5rem;
        }

        .test-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #334155;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 1.5rem;
        }

        .test-input:focus {
          border-color: #3b82f6;
        }

        .btn-test {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.1s, opacity 0.2s;
        }

        .btn-test:hover { opacity: 0.9; }
        .btn-test:active { transform: scale(0.98); }
        .btn-test:disabled { opacity: 0.5; cursor: not-allowed; }

        .result-box {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(0,0,0,0.4);
          border-radius: 12px;
          border-left: 4px solid #3b82f6;
          font-family: 'Fira Code', monospace;
          font-size: 0.9rem;
          color: #cbd5e1;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>

      <div className="header">
        <h1 className="title">Agents Control</h1>
        <p className="subtitle">
          Monitor active agents and analyze real-time routing logic across Local, Groq, and OpenRouter engines.
        </p>
      </div>

      <div className="grid">
        {agents.map(agent => (
          <div key={agent.id} className={`agent-card ${agent.status === 'active' ? 'active' : ''}`}>
            <div className={`status-badge status-${agent.status}`}>
              {agent.status}
            </div>
            <div className="agent-role" style={{ color: agent.color }}>
              {agent.role}
            </div>
            <h2 className="agent-name">{agent.name}</h2>
            <div className="agent-model">{agent.model}</div>
            <p className="agent-desc">{agent.description}</p>
          </div>
        ))}
      </div>

      <div className="router-test">
        <h3 className="text-xl font-bold mb-4">Dry Run Router</h3>
        <p className="text-slate-400 mb-6">Type a prompt to see which agent handles it based on task type.</p>
        
        <form onSubmit={handleTestRouting}>
          <input
            className="test-input"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="e.g. 'Refactor the authentication logic' or 'Analyze this long context...'"
          />
          <button className="btn-test" type="submit" disabled={isTesting || !testPrompt.trim()}>
            {isTesting ? 'Routing...' : 'Test Routing Matrix'}
          </button>
        </form>

        {testResult && (
          <div className="result-box">
            <div className="text-blue-400 mb-2">// Router trace completed</div>
            <div>{testResult.response}</div>
          </div>
        )}
      </div>
    </div>
  );
}
