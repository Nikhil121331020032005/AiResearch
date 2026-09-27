'use client';

import React, { useState } from 'react';
import { Send, MessageSquare, Sparkles, Search, User, Bot, Loader2 } from 'lucide-react';
import { FollowUpMessage, WebSource } from '@/types/research';

interface FollowUpChatProps {
  messages: FollowUpMessage[];
  sources: WebSource[];
  onSendFollowUp: (text: string) => void;
  isLoading: boolean;
  onSelectSource: (source: WebSource) => void;
}

const SUGGESTIONS = [
  'Which source supports the claim about personalized learning?',
  'What are the key limitations & risks?',
  'Explain the main findings in simple terms.',
  'Give me more evidence about developer productivity gains.',
];

export const FollowUpChat: React.FC<FollowUpChatProps> = ({
  messages,
  sources,
  onSendFollowUp,
  isLoading,
  onSelectSource,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendFollowUp(input.trim());
    setInput('');
  };

  const renderTextWithCitations = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const sourceId = parseInt(match[1], 10);
        const source = sources.find((s) => s.id === sourceId);

        return (
          <button
            key={index}
            onClick={() => source && onSelectSource(source)}
            className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-mono font-bold text-xs border border-blue-300 transition-colors cursor-pointer align-baseline"
          >
            [{sourceId}]
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <span>Follow-Up Conversation</span>
      </div>

      {/* Suggestion Chips */}
      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium">Suggested follow-ups:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(s);
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 p-3.5 rounded-lg text-xs leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-blue-50/80 border border-blue-100 ml-8 text-slate-900'
                : 'bg-slate-50 border border-slate-200 mr-8 text-slate-800'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white font-bold ${
                msg.sender === 'user' ? 'bg-blue-600' : 'bg-slate-800'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  {msg.sender === 'user' ? 'You' : 'Research Assistant'}
                </span>
                {msg.performedSearch && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-medium">
                    <Search className="w-3 h-3" /> Targeted Search Executed
                  </span>
                )}
              </div>
              <div className="text-slate-700 whitespace-pre-wrap">
                {msg.sender === 'assistant' ? renderTextWithCitations(msg.text) : msg.text}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <span>Analyzing research context and formulating answer...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-slate-100">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up about this research..."
          disabled={isLoading}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
