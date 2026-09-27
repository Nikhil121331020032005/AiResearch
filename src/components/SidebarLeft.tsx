'use client';

import React from 'react';
import { Plus, BookOpen, Clock, Settings, FileText, Trash2, Sparkles, ChevronRight } from 'lucide-react';
import { ResearchSession } from '@/types/research';

interface SidebarLeftProps {
  sessions: ResearchSession[];
  activeSessionId: string | null;
  onNewResearch: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  sessions,
  activeSessionId,
  onNewResearch,
  onSelectSession,
  onDeleteSession,
  onOpenSettings,
}) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base leading-none">ResearchAI</h1>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">AUTONOMOUS AGENT</span>
          </div>
        </div>
      </div>

      {/* New Research Button */}
      <div className="p-3">
        <button
          onClick={onNewResearch}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-150 shadow-sm hover:shadow-blue-500/20 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Research</span>
        </button>
      </div>

      {/* Recent Sessions */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Recent Sessions</span>
          <Clock className="w-3 h-3 text-slate-500" />
        </div>

        {sessions.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
            No research sessions yet.<br />Start your first inquiry above.
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const formattedDate = new Date(session.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors text-xs ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 font-medium border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <BookOpen className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <div className="flex-1 min-w-0 pr-5">
                  <p className="truncate font-medium text-slate-200 leading-snug">
                    {session.question}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span>{session.sources?.length || 0} sources</span>
                  </div>
                </div>

                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  title="Delete session"
                  className="opacity-0 group-hover:opacity-100 absolute right-2 top-2.5 p-1 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Settings */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <span>API Settings & Keys</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>
    </aside>
  );
};
