'use client';

import React, { useState, useEffect } from 'react';
import {
  AgentStep,
  ExtractedEvidence,
  FollowUpMessage,
  ResearchOptions,
  ResearchReport,
  ResearchSession,
  UploadedDoc,
  WebSource,
} from '@/types/research';
import { SidebarLeft } from '@/components/SidebarLeft';
import { SidebarRight } from '@/components/SidebarRight';
import { ResearchInput } from '@/components/ResearchInput';
import { ReportViewer } from '@/components/ReportViewer';
import { FollowUpChat } from '@/components/FollowUpChat';
import { SourceModal } from '@/components/SourceModal';
import { SettingsModal } from '@/components/SettingsModal';

const LOCAL_STORAGE_KEY = 'ai_research_sessions_v1';

export default function HomePage() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  // Transient state during active research stream
  const [currentSteps, setCurrentSteps] = useState<AgentStep[]>([]);
  const [currentSources, setCurrentSources] = useState<WebSource[]>([]);
  const [currentEvidence, setCurrentEvidence] = useState<ExtractedEvidence[]>([]);
  const [currentReport, setCurrentReport] = useState<ResearchReport | null>(null);

  // Modals & settings
  const [selectedSource, setSelectedSource] = useState<WebSource | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [globalOptions, setGlobalOptions] = useState<ResearchOptions>({
    depth: 'standard',
    maxSources: 8,
  });

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: ResearchSession[] = JSON.parse(saved);
        setSessions(parsed);
      }
    } catch (e) {
      console.warn('Failed to load sessions from localStorage:', e);
    }
  }, []);

  // Save sessions helper
  const updateSessionsStateAndStorage = (updater: (prev: ResearchSession[]) => ResearchSession[]) => {
    setSessions((prev) => {
      const updated = updater(prev);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save sessions to localStorage:', e);
      }
      return updated;
    });
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Handler: Start New Research
  const handleStartResearch = async (
    question: string,
    options: ResearchOptions,
    docs: UploadedDoc[]
  ) => {
    const sessionId = `session-${Date.now()}`;
    const mergedOptions: ResearchOptions = {
      ...globalOptions,
      ...options,
    };

    const newSession: ResearchSession = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      question,
      options: mergedOptions,
      steps: [],
      sources: [],
      evidence: [],
      report: null,
      followUps: [],
      docs,
    };

    setActiveSessionId(sessionId);
    setIsResearching(true);
    setCurrentSteps([]);
    setCurrentSources([]);
    setCurrentEvidence([]);
    setCurrentReport(null);

    // Save initial session draft
    updateSessionsStateAndStorage((prev) => [newSession, ...prev]);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          options: mergedOptions,
          docs,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Research request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      let accumSteps: AgentStep[] = [];
      let accumSources: WebSource[] = [];
      let accumEvidence: ExtractedEvidence[] = [];
      let accumReport: ResearchReport | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'step') {
              const stepData: AgentStep = event.data;
              accumSteps = updateOrAddStep(accumSteps, stepData);
              setCurrentSteps([...accumSteps]);
            } else if (event.type === 'sources') {
              accumSources = event.data;
              setCurrentSources(accumSources);
            } else if (event.type === 'evidence') {
              accumEvidence = event.data;
              setCurrentEvidence(accumEvidence);
            } else if (event.type === 'report') {
              accumReport = event.data;
              setCurrentReport(accumReport);
            } else if (event.type === 'error') {
              console.error('SSE Error:', event.data);
            }
          } catch (err) {
            console.warn('Failed to parse SSE chunk:', err);
          }
        }
      }

      // Finalize session object
      const finalizedSession: ResearchSession = {
        ...newSession,
        steps: accumSteps,
        sources: accumSources,
        evidence: accumEvidence,
        report: accumReport,
      };

      updateSessionsStateAndStorage((prev) =>
        prev.map((s) => (s.id === sessionId ? finalizedSession : s))
      );
    } catch (error: any) {
      console.error('Error running research:', error);
      const errStep: AgentStep = {
        id: 'error',
        label: 'Research process failure',
        status: 'error',
        details: error?.message || 'Failed to complete research operation.',
        timestamp: new Date().toISOString(),
      };
      setCurrentSteps((prev) => updateOrAddStep(prev, errStep));
    } finally {
      setIsResearching(false);
    }
  };

  // Helper to update step list
  const updateOrAddStep = (steps: AgentStep[], newStep: AgentStep): AgentStep[] => {
    const idx = steps.findIndex((s) => s.id === newStep.id);
    if (idx >= 0) {
      const copy = [...steps];
      copy[idx] = { ...copy[idx], ...newStep };
      return copy;
    }
    return [...steps, newStep];
  };

  // Handler: Follow-up question submission
  const handleSendFollowUp = async (text: string) => {
    if (!activeSessionId) return;

    const sessionToUpdate = sessions.find((s) => s.id === activeSessionId);
    if (!sessionToUpdate) return;

    const userMsg: FollowUpMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    const updatedFollowUps = [...sessionToUpdate.followUps, userMsg];
    const sessionWithUserMsg = { ...sessionToUpdate, followUps: updatedFollowUps };
    updateSessionsStateAndStorage((prev) =>
      prev.map((s) => (s.id === activeSessionId ? sessionWithUserMsg : s))
    );

    setIsFollowUpLoading(true);

    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: sessionWithUserMsg,
          question: text,
          customApiKey: globalOptions.customApiKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: FollowUpMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: data.answer,
          timestamp: new Date().toISOString(),
          sourcesUsed: data.sourcesUsed,
          performedSearch: data.performedSearch,
        };

        let updatedSources = sessionToUpdate.sources;
        if (data.newSources && data.newSources.length > 0) {
          updatedSources = [...sessionToUpdate.sources, ...data.newSources];
        }

        const finalSession = {
          ...sessionWithUserMsg,
          sources: updatedSources,
          followUps: [...updatedFollowUps, assistantMsg],
        };

        updateSessionsStateAndStorage((prev) =>
          prev.map((s) => (s.id === activeSessionId ? finalSession : s))
        );
        if (data.newSources) {
          setCurrentSources(updatedSources);
        }
      }
    } catch (err) {
      console.error('Follow-up error:', err);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  // Delete session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateSessionsStateAndStorage((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  };

  // Determine current active display variables
  const displaySources = isResearching ? currentSources : activeSession?.sources || [];
  const displayEvidence = isResearching ? currentEvidence : activeSession?.evidence || [];
  const displayReport = isResearching ? currentReport : activeSession?.report || null;
  const displaySteps = isResearching ? currentSteps : activeSession?.steps || [];
  const displayFollowUps = activeSession?.followUps || [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans antialiased text-slate-900">
      {/* 1. Left Sidebar */}
      <SidebarLeft
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewResearch={() => {
          setActiveSessionId(null);
          setCurrentSteps([]);
          setCurrentSources([]);
          setCurrentEvidence([]);
          setCurrentReport(null);
        }}
        onSelectSession={(id) => setActiveSessionId(id)}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50 flex flex-col">
        {!activeSessionId && !isResearching ? (
          /* Landing Screen */
          <ResearchInput
            onStartResearch={handleStartResearch}
            isLoading={isResearching}
          />
        ) : (
          /* Active Research & Report View */
          <div className="max-w-4xl mx-auto w-full p-6 space-y-8 pb-16">
            <ReportViewer
              question={activeSession?.question || 'Research Inquiry'}
              report={displayReport}
              sources={displaySources}
              evidence={displayEvidence}
              onSelectSource={(s) => setSelectedSource(s)}
            />

            {/* Follow-up Chat section */}
            {displayReport && (
              <FollowUpChat
                messages={displayFollowUps}
                sources={displaySources}
                onSendFollowUp={handleSendFollowUp}
                isLoading={isFollowUpLoading}
                onSelectSource={(s) => setSelectedSource(s)}
              />
            )}
          </div>
        )}
      </main>

      {/* 3. Right Sidebar */}
      <SidebarRight
        steps={displaySteps}
        sources={displaySources}
        evidenceCount={displayEvidence.length}
        onSelectSource={(s) => setSelectedSource(s)}
      />

      {/* Source Detail Overlay Modal */}
      <SourceModal
        source={selectedSource}
        evidenceList={displayEvidence}
        onClose={() => setSelectedSource(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={globalOptions}
        onSaveOptions={(newOpts) => setGlobalOptions((prev) => ({ ...prev, ...newOpts }))}
      />
    </div>
  );
}

