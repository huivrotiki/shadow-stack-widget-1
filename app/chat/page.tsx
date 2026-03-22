'use client';

import { useChat } from 'ai/react';
import React, { useEffect, useRef } from 'react';

/**
 * Premium Chat Interface for Shadow Stack Widget
 * Uses Vercel AI SDK hooks.
 */
export default function ShadowStackChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="shadow-stack-container">
      <style jsx>{`
        .shadow-stack-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 800px;
          margin: 0 auto;
          background: #0f172a;
          color: #f8fafc;
          font-family: 'Inter', system-ui, sans-serif;
          border: 1px solid #334155;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border-radius: 12px;
          overflow: hidden;
        }
        .header {
          padding: 1.5rem;
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border-bottom: 1px solid #334155;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background: ${isLoading ? '#38bdf8' : '#10b981'};
          border-radius: 50%;
          box-shadow: 0 0 10px ${isLoading ? '#38bdf8' : '#10b981'};
          margin-right: 10px;
        }
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .message {
          max-width: 85%;
          padding: 1rem;
          border-radius: 12px;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .user-message {
          align-self: flex-end;
          background: #2563eb;
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .ai-message {
          align-self: flex-start;
          background: #1e293b;
          color: #f1f5f9;
          border: 1px solid #334155;
          backdrop-filter: blur(8px);
        }
        .input-form {
          padding: 1.5rem;
          background: #1e293b;
          border-top: 1px solid #334155;
          display: flex;
          gap: 0.75rem;
        }
        .input-field {
          flex: 1;
          background: #0f172a;
          border: 1px solid #334155;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          color: white;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-field:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        .send-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .send-button:hover:not(:disabled) {
          background: #2563eb;
        }
        .send-button:active {
          transform: scale(0.95);
        }
        .send-button:disabled {
          background: #334155;
          cursor: not-allowed;
        }
      `}</style>

      <header className="header">
        <h1 className="text-xl font-bold tracking-tight">Shadow Stack AI</h1>
        <div className="flex items-center">
          <span className="status-dot"></span>
          <span className="text-sm font-medium text-slate-400">
            {isLoading ? 'Processing' : 'Connected'}
          </span>
        </div>
      </header>

      <div className="messages-container">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`message ${m.role === 'user' ? 'user-message' : 'ai-message'}`}
          >
            <strong>{m.role === 'user' ? 'You' : 'AI'}:</strong>
            <div className="mt-2 text-slate-300">{m.content}</div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="ai-message message italic text-slate-400">
            Shadow AI is thinking...
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      <form className="input-form" onSubmit={handleSubmit}>
        <input
          className="input-field"
          value={input}
          placeholder="Type a message..."
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button className="send-button" type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
