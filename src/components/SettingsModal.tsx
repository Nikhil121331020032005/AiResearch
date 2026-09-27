'use client';

import React, { useState } from 'react';
import { X, Key, ShieldCheck, Check, Sparkles, AlertCircle } from 'lucide-react';
import { ResearchOptions } from '@/types/research';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ResearchOptions;
  onSaveOptions: (opts: Partial<ResearchOptions>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  onSaveOptions,
}) => {
  const [geminiKey, setGeminiKey] = useState(options.customApiKey || '');
  const [tavilyKey, setTavilyKey] = useState(options.customSearchKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveOptions({
      customApiKey: geminiKey.trim() || undefined,
      customSearchKey: tavilyKey.trim() || undefined,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-slate-100">API Settings & Keys</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              API keys are stored strictly in your local session. By default, server environment variables are used. Enter custom keys below if desired.
            </div>
          </div>

          {/* Gemini Key */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900 block flex items-center justify-between">
              <span>Google Gemini API Key (LLM Engine)</span>
              <span className="text-[10px] font-normal text-slate-400">GEMINI_API_KEY</span>
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-lg border border-slate-300 p-2.5 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          {/* Tavily Key */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900 block flex items-center justify-between">
              <span>Tavily Search API Key (Web Engine)</span>
              <span className="text-[10px] font-normal text-slate-400">TAVILY_API_KEY</span>
            </label>
            <input
              type="password"
              value={tavilyKey}
              onChange={(e) => setTavilyKey(e.target.value)}
              placeholder="tvly-..."
              className="w-full rounded-lg border border-slate-300 p-2.5 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            <p className="text-[11px] text-slate-500">
              Note: If no Tavily key is provided, the agent uses built-in multi-source web search scraper fallback automatically.
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Settings Saved!
              </span>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
