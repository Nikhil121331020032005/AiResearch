'use client';

import React from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle, Cpu, Database, Search, FileCheck, Network, Layers, BarChart3, HelpCircle } from 'lucide-react';
import { AgentStep, AgentStepId, StepStatus, WebSource } from '@/types/research';

interface SidebarRightProps {
  steps: AgentStep[];
  sources: WebSource[];
  evidenceCount: number;
  currentStepId?: AgentStepId;
  error?: string;
  onSelectSource?: (source: WebSource) => void;
}

const STEP_ORDER: { id: AgentStepId; label: string; icon: any }[] = [
  { id: 'analyzing', label: 'Analyzing research question', icon: Cpu },
  { id: 'planning', label: 'Formulating research plan', icon: Layers },
  { id: 'subqueries', label: 'Generating search sub-questions', icon: Network },
  { id: 'searching', label: 'Searching multi-source web', icon: Search },
  { id: 'extracting', label: 'Extracting evidence & claims', icon: Database },
  { id: 'visualizing', label: 'Generating data visualizations', icon: BarChart3 },
  { id: 'synthesizing', label: 'Synthesizing cited report', icon: FileCheck },
];

export const SidebarRight: React.FC<SidebarRightProps> = ({
  steps,
  sources,
  evidenceCount,
  currentStepId,
  error,
  onSelectSource,
}) => {
  const getStep = (stepId: AgentStepId): AgentStep | undefined => {
    return steps.find((s) => s.id === stepId);
  };

  const getStepStatus = (stepId: AgentStepId): StepStatus => {
    const found = getStep(stepId);
    if (found) return found.status;
    return 'pending';
  };

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const totalSteps = STEP_ORDER.length;
  const progressPercent = Math.min(100, Math.round((completedCount / totalSteps) * 100));

  // Extract sub-questions if available from subqueries or planning step
  const subqueriesStep = getStep('subqueries');
  const activeSubQuestions = subqueriesStep?.subQuestions || [];

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 text-slate-200 flex flex-col h-screen select-none shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <h2 className="font-bold text-slate-100 text-sm">Agent Activity & Progress</h2>
        </div>
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
          {completedCount}/{totalSteps}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 bg-slate-950/50 border-b border-slate-800/80">
        <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-1.5">
          <span>Workflow Execution</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Workflow Steps List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
          Execution Pipeline
        </div>

        {STEP_ORDER.map((item) => {
          const stepObj = getStep(item.id);
          const status = stepObj?.status || 'pending';
          const details = stepObj?.details;
          const StepIcon = item.icon;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-lg border transition-all text-xs ${
                status === 'running'
                  ? 'bg-blue-950/40 border-blue-600/50 text-blue-100'
                  : status === 'completed'
                  ? 'bg-slate-800/40 border-slate-800 text-slate-300'
                  : status === 'error'
                  ? 'bg-red-950/30 border-red-800 text-red-200'
                  : 'bg-slate-950/30 border-slate-900 text-slate-500'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {status === 'running' && (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  )}
                  {status === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {status === 'pending' && (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                  {status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${status === 'running' ? 'text-blue-300' : 'text-slate-200'}`}>
                      {item.label}
                    </span>
                  </div>

                  {details && (
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug break-words">
                      {details}
                    </p>
                  )}

                  {/* Render Sub-questions list if this is the subqueries step */}
                  {item.id === 'subqueries' && activeSubQuestions.length > 0 && (
                    <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block">
                        Generated {activeSubQuestions.length} Sub-Questions:
                      </span>
                      {activeSubQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-1.5 text-[11px] text-slate-300 bg-slate-900/80 p-1.5 rounded border border-slate-800"
                        >
                          <span className="font-mono text-blue-400 font-bold shrink-0">{idx + 1}.</span>
                          <span className="leading-tight">{q}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Execution Error</p>
              <p className="text-[11px] mt-0.5 text-red-300/80">{error}</p>
            </div>
          </div>
        )}

        {/* Live Metrics Summary */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Collected Telemetry
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Sources Analyzed</span>
              <span className="text-sm font-bold text-blue-400">{sources.length}</span>
            </div>
            <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Evidence Claims</span>
              <span className="text-sm font-bold text-emerald-400">{evidenceCount}</span>
            </div>
          </div>
        </div>

        {/* Sources Quick Drawer in Right Sidebar */}
        {sources.length > 0 && (
          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
              Retrieved Sources ({sources.length})
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {sources.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSelectSource && onSelectSource(s)}
                  className="p-2 rounded bg-slate-800/40 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 cursor-pointer transition-colors text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="truncate pr-2">
                      <span className="font-semibold text-blue-300 mr-1 shadow-sm">[{s.id}]</span>
                      <span className="text-slate-300 truncate font-medium">{s.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">{s.domain}</span>
                  </div>
                  {s.subQuestion && (
                    <div className="text-[10px] text-blue-400/90 italic truncate">
                      Sub-Q: "{s.subQuestion}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

