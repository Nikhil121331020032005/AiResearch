'use client';

import React, { useState } from 'react';
import { ResearchReport, WebSource, ExtractedEvidence } from '@/types/research';
import { ExternalLink, BookOpen, CheckCircle, AlertTriangle, Scale, ShieldAlert, Sparkles, Layers, ListFilter } from 'lucide-react';

interface ReportViewerProps {
  question: string;
  report: ResearchReport | null;
  sources: WebSource[];
  evidence: ExtractedEvidence[];
  onSelectSource: (source: WebSource) => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  question,
  report,
  sources,
  evidence,
  onSelectSource,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'evidence' | 'sources'>('report');

  if (!report) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="font-medium text-slate-700">Synthesizing research report and evidence...</p>
        <p className="text-xs text-slate-400 mt-1">Extracting claims across {sources.length} sources.</p>
      </div>
    );
  }

  // Render text with clickable citation badges like [1], [2]
  const renderTextWithCitations = (text: string) => {
    if (!text) return null;

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
            title={source ? `${source.title} (${source.domain})` : `Source ${sourceId}`}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Final Synthesis Report</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
          {question}
        </h1>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <BookOpen className="w-4 h-4 text-blue-500" />
            {sources.length} Web Sources Analyzed
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            {evidence.length} Extracted Claims
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'report'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Structured Report</span>
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'evidence'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Evidence Table ({evidence.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'sources'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Retrieved Sources ({sources.length})</span>
        </button>
      </div>

      {/* Tab 1: Structured Report */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Executive Summary
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed space-y-3">
              {renderTextWithCitations(report.executiveSummary)}
            </div>
          </section>

          {/* Key Findings */}
          <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              Key Findings
            </h2>
            <div className="grid gap-4">
              {report.keyFindings.map((finding, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                  <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    {finding.title}
                  </h3>
                  <div className="text-xs text-slate-700 leading-relaxed pl-7">
                    {renderTextWithCitations(finding.content)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Comparison Matrix (if present) */}
          {report.comparison && report.comparison.length > 0 && (
            <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                Comparative Matrix
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700 border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="p-3 border-b border-slate-200">Dimension / Aspect</th>
                      <th className="p-3 border-b border-slate-200">Subject A Analysis</th>
                      <th className="p-3 border-b border-slate-200">Subject B Analysis</th>
                      <th className="p-3 border-b border-slate-200">Synthesis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {report.comparison.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900 bg-slate-50/50">{row.aspect}</td>
                        <td className="p-3 leading-relaxed">{renderTextWithCitations(row.optionA)}</td>
                        <td className="p-3 leading-relaxed">{renderTextWithCitations(row.optionB)}</td>
                        <td className="p-3 leading-relaxed font-medium text-slate-800 bg-blue-50/30">
                          {renderTextWithCitations(row.analysis)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Limitations & Risks */}
          {report.limitations && report.limitations.length > 0 && (
            <section className="bg-amber-50/60 rounded-xl p-6 border border-amber-200 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Limitations & Conflicting Evidence
              </h2>
              <ul className="space-y-2 text-xs text-amber-900/90 pl-5 list-disc">
                {report.limitations.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {renderTextWithCitations(item)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Conclusion */}
          <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              Strategic Conclusion
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed">
              {renderTextWithCitations(report.conclusion)}
            </div>
          </section>
        </div>
      )}

      {/* Tab 2: Evidence Table */}
      {activeTab === 'evidence' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            Extracted Factual Evidence ({evidence.length})
          </h2>
          <div className="space-y-3">
            {evidence.map((ev, idx) => {
              const source = sources.find((s) => s.id === ev.sourceId);
              return (
                <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-bold text-slate-900 text-xs flex-1">{ev.claim}</h4>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border shrink-0 ${
                        ev.confidence === 'high'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {ev.confidence} confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded border border-slate-200">
                    "{ev.evidence}"
                  </p>
                  {source && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <button
                        onClick={() => onSelectSource(source)}
                        className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>Source [{source.id}]: {source.title}</span>
                      </button>
                      <span className="font-mono text-slate-400">{source.domain}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Sources List */}
      {activeTab === 'sources' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            Retrieved Sources & References ({sources.length})
          </h2>
          <div className="grid gap-4">
            {sources.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50 hover:border-blue-300 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                      [{s.id}]
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {s.title}
                    </h3>
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0 bg-blue-50 px-2.5 py-1 rounded border border-blue-200"
                  >
                    <span>Visit Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  Domain: {s.domain}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded border border-slate-200">
                  {s.snippet}
                </p>

                {s.whyRelevant && (
                  <div className="text-[11px] text-slate-500 italic">
                    Relevance: {s.whyRelevant}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
