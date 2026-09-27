'use client';

import React from 'react';
import { X, ExternalLink, Globe, BookOpen, CheckCircle, Info } from 'lucide-react';
import { WebSource, ExtractedEvidence } from '@/types/research';

interface SourceModalProps {
  source: WebSource | null;
  evidenceList: ExtractedEvidence[];
  onClose: () => void;
}

export const SourceModal: React.FC<SourceModalProps> = ({ source, evidenceList, onClose }) => {
  if (!source) return null;

  const relevantEvidence = evidenceList.filter((e) => e.sourceId === source.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-600 font-mono font-bold text-sm flex items-center justify-center shrink-0 shadow-md">
              [{source.id}]
            </span>
            <div>
              <h3 className="font-bold text-base text-slate-100 leading-snug">
                {source.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>{source.domain}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Action Link */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-mono text-slate-500 truncate max-w-md">{source.url}</span>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
            >
              <span>Open Source</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Relevance Explanation */}
          {source.whyRelevant && (
            <div className="space-y-1 bg-blue-50/70 p-3.5 rounded-lg border border-blue-100">
              <div className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Agent Relevance Evaluation</span>
              </div>
              <p className="text-blue-950 leading-relaxed pl-5">{source.whyRelevant}</p>
            </div>
          )}

          {/* Source Snippet / Content Excerpt */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Extracted Source Snippet & Content</span>
            </h4>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 leading-relaxed font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {source.fullContent || source.snippet}
            </div>
          </div>

          {/* Associated Evidence Claims */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Attributed Claims ({relevantEvidence.length})</span>
            </h4>

            {relevantEvidence.length === 0 ? (
              <p className="text-slate-400 italic">No direct claims linked to this source ID.</p>
            ) : (
              <div className="space-y-2">
                {relevantEvidence.map((ev, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                    <div className="font-semibold text-slate-900">{ev.claim}</div>
                    <div className="text-slate-600 italic font-mono text-[11px]">"{ev.evidence}"</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
