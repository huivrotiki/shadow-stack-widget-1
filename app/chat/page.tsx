'use client';

import { useChat } from '@ai-sdk/react';
import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    electronAPI: {
      listPhases: () => Promise<any[]>;
      runTask: (phaseId: number, taskId: string) => Promise<string>;
      onLog: (callback: (data: { taskId: string; line: string; level?: string }) => void) => void;
    };
  }
}

export default function ShadowStackDashboard() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');
  const isLoading = status === 'streaming' || status === 'submitted';
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ parts: [{ type: 'text' as const, text: input }] });
    setInput('');
  };
  const [phases, setPhases] = useState<any[]>([]);
  const [logs, setLogs] = useState<{ taskId: string; line: string; level?: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, logs]);

  useEffect(() => {
    // Load initial phases
    if (window.electronAPI) {
      window.electronAPI.listPhases().then(setPhases);
      window.electronAPI.onLog((data) => {
        setLogs((prev) => [...prev.slice(-50), data]);
      });
    }
  }, []);

  const runTask = async (phaseId: number, taskId: string) => {
    if (window.electronAPI) {
      setLogs((prev) => [...prev, { taskId, line: `🚀 Starting task ${taskId}...` }]);
      const result = await window.electronAPI.runTask(phaseId, taskId);
      setLogs((prev) => [...prev, { taskId, line: `🏁 Task result: ${result}` }]);
      // Refresh phases status
      const updated = await window.electronAPI.listPhases();
      setPhases(updated);
    }
  };

  return (
    <div className="shadow-stack-layout">
      <style jsx>{`
        .shadow-stack-layout {
          display: flex;
          height: 100vh;
          background: #020617;
          color: #f8fafc;
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
        }

        /* Sidebar for Orchestration */
        .sidebar {
          width: 350px;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(12px);
          border-right: 1px solid rgba(51, 65, 85, 0.5);
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          overflow-y: auto;
        }

        .phase-card {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(51, 65, 85, 0.5);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .phase-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.5);
        }

        .task-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          border-radius: 6px;
          margin-top: 0.5rem;
          background: rgba(15, 23, 42, 0.3);
          font-size: 0.85rem;
        }

        .btn-run {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
        }

        /* Main Chat Area */
        .main-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .message {
          max-width: 80%;
          padding: 1rem 1.25rem;
          border-radius: 16px;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .user-message {
          align-self: flex-end;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 8px 16px -4px rgba(37, 99, 235, 0.4);
        }

        .ai-message {
          align-self: flex-start;
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(51, 65, 85, 0.5);
          backdrop-filter: blur(4px);
        }

        .input-area {
          padding: 1.5rem 2rem;
          background: rgba(15, 23, 42, 0.9);
          border-top: 1px solid rgba(51, 65, 85, 0.5);
        }

        .input-wrapper {
          display: flex;
          gap: 1rem;
          background: #020617;
          border: 1px solid #334155;
          padding: 0.5rem;
          border-radius: 12px;
        }

        .input-field {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          padding: 0.75rem;
          outline: none;
        }

        .btn-send {
          background: #3b82f6;
          border: none;
          color: white;
          padding: 0 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Logs Console */
        .logs-console {
          height: 150px;
          background: #000;
          border-top: 1px solid #334155;
          padding: 1rem;
          font-family: 'Fira Code', monospace;
          font-size: 0.75rem;
          overflow-y: auto;
          color: #10b981;
        }
      `}</style>

      {/* Sidebar: Orchestration */}
      <aside className="sidebar">
        <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
            Orchestrator
          </div>
          <a href="/agents" className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 text-slate-300 no-underline transition-colors">
            Agents ⚡
          </a>
        </h2>
        
        {phases.map(phase => (
          <div key={phase.id} className="phase-card">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm">{phase.title}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded ${
                phase.status === 'COMPLETE' ? 'bg-green-500/20 text-green-400' : 
                phase.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' : 
                'bg-slate-500/20 text-slate-400'
              }`}>
                {phase.status}
              </span>
            </div>
            {phase.tasks.map((task: any) => (
              <div key={task.id} className="task-item">
                <span className="text-slate-300 truncate mr-2" title={task.title}>{task.title}</span>
                <button 
                  className="btn-run"
                  onClick={() => runTask(phase.id, task.id)}
                >
                  Run
                </button>
              </div>
            ))}
          </div>
        ))}
      </aside>

      {/* Main Content: Chat */}
      <main className="main-chat">
        <div className="messages-container">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`message ${m.role === 'user' ? 'user-message' : 'ai-message'}`}
            >
              {m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') ?? ''}
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>

        <div className="input-area">
          <form className="input-wrapper" onSubmit={handleSubmit}>
            <input
              className="input-field"
              value={input}
              placeholder="Ask Shadow Stack anything..."
              onChange={handleInputChange}
            />
            <button className="btn-send" type="submit" disabled={isLoading}>
              Send
            </button>
          </form>
        </div>

        {/* Real-time Logs Console */}
        <div className="logs-console">
          {logs.map((log, i) => (
            <div key={i} className={log.level === 'error' ? 'text-red-400' : ''}>
              [{log.taskId}] {log.line}
            </div>
          ))}
          {logs.length === 0 && <div className="text-slate-600">Waiting for logs...</div>}
        </div>
      </main>
    </div>
  );
}
