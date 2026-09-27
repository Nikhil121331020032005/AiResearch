'use client';

import React, { useState } from 'react';
import { Sparkles, Search, Paperclip, FileText, X, ArrowRight, Zap, SlidersHorizontal } from 'lucide-react';
import { ResearchDepth, ResearchOptions, UploadedDoc } from '@/types/research';
import { parseUploadedDocument } from '@/lib/agent/docParser';

interface ResearchInputProps {
  onStartResearch: (question: string, options: ResearchOptions, docs: UploadedDoc[]) => void;
  isLoading: boolean;
}

const DEMO_PRESETS = [
  'Compare the benefits, risks, and major applications of generative AI in education and software development.',
  'What are the recent breakthroughs in room-temperature quantum computing architectures?',
  'Analyze the effectiveness of carbon capture technologies and global grid scalability.',
];

export const ResearchInput: React.FC<ResearchInputProps> = ({ onStartResearch, isLoading }) => {
  const [question, setQuestion] = useState('');
  const [depth, setDepth] = useState<ResearchDepth>('standard');
  const [maxSources, setMaxSources] = useState<number>(8);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    onStartResearch(
      question.trim(),
      { depth, maxSources },
      docs
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const parsedDocs: UploadedDoc[] = [];
      for (let i = 0; i < files.length; i++) {
        const doc = await parseUploadedDocument(files[i]);
        parsedDocs.push(doc);
      }
      setDocs((prev) => [...prev, ...parsedDocs]);
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col justify-center min-h-[calc(100vh-4rem)]">
      {/* Hero Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multi-Source Autonomous Agent</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          What do you want to research?
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
          Enter any query. The agent will formulate a research plan, query live web sources, extract factual evidence, and generate a cited report.
        </p>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-slate-200 p-5 space-y-4">
        {/* Textarea */}
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Compare the impact of generative AI on education and software development."
            rows={4}
            disabled={isLoading}
            className="w-full resize-none rounded-lg border border-slate-300 p-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-sm leading-relaxed"
          />
        </div>

        {/* Uploaded Documents List */}
        {docs.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-700"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate max-w-[180px] font-medium">{doc.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDoc(doc.id)}
                  className="p-0.5 text-slate-400 hover:text-red-500 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Controls Bar: Depth, Sources, Upload & Submit */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Settings / Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Depth Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200">
              <span className="text-slate-500 px-1.5 text-[11px] font-semibold">Depth:</span>
              {(['quick', 'standard', 'deep'] as ResearchDepth[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDepth(d);
                    setMaxSources(d === 'quick' ? 5 : d === 'deep' ? 10 : 8);
                  }}
                  className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                    depth === d
                      ? 'bg-white text-blue-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Max Sources */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Sources:</span>
              <select
                value={maxSources}
                onChange={(e) => setMaxSources(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value={3}>3 sources</option>
                <option value={5}>5 sources</option>
                <option value={8}>8 sources</option>
                <option value={10}>10 sources</option>
              </select>
            </div>

            {/* Document Upload Button */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer transition-colors">
              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
              <span>{isUploading ? 'Uploading...' : 'Attach Doc'}</span>
              <input
                type="file"
                accept=".txt,.md,.pdf"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading || isLoading}
                className="hidden"
              />
            </label>
          </div>

          {/* Start Research Button */}
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 text-sm ml-auto"
          >
            <span>Start Research</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Demo Presets Section */}
      <div className="mt-8 space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Try Hackathon Demo Queries</span>
        </div>
        <div className="grid gap-2">
          {DEMO_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuestion(preset)}
              className="text-left p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 transition-colors text-xs text-slate-700 leading-relaxed flex items-center justify-between group"
            >
              <span>{preset}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
