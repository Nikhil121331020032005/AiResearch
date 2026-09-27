export type ResearchDepth = 'quick' | 'standard' | 'deep';

export interface ResearchOptions {
  depth: ResearchDepth;
  maxSources: number;
  customApiKey?: string;
  customSearchKey?: string;
}

export type StepStatus = 'pending' | 'running' | 'completed' | 'error';

export type AgentStepId = 
  | 'analyzing'
  | 'planning'
  | 'subqueries'
  | 'searching'
  | 'extracting'
  | 'synthesizing'
  | 'complete'
  | 'error';

export interface AgentStep {
  id: AgentStepId;
  label: string;
  status: StepStatus;
  details?: string;
  timestamp: string;
}

export interface WebSource {
  id: number;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  fullContent?: string;
  relevanceScore?: number;
  whyRelevant?: string;
}

export interface ExtractedEvidence {
  id: string;
  claim: string;
  evidence: string;
  sourceId: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ComparisonRow {
  aspect: string;
  optionA: string;
  optionB: string;
  analysis: string;
}

export interface ResearchReport {
  executiveSummary: string;
  keyFindings: {
    title: string;
    content: string;
  }[];
  evidence: ExtractedEvidence[];
  comparison?: ComparisonRow[] | null;
  limitations: string[];
  conclusion: string;
  rawMarkdown: string;
}

export interface FollowUpMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sourcesUsed?: number[];
  performedSearch?: boolean;
}

export interface UploadedDoc {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
}

export interface ResearchPlan {
  goals: string[];
  subQuestions: string[];
  searchStrategy: string;
}

export interface ResearchSession {
  id: string;
  createdAt: string;
  question: string;
  options: ResearchOptions;
  steps: AgentStep[];
  sources: WebSource[];
  evidence: ExtractedEvidence[];
  report: ResearchReport | null;
  followUps: FollowUpMessage[];
  docs?: UploadedDoc[];
  error?: string;
}

export interface SSEMessage {
  type: 'step' | 'plan' | 'sources' | 'evidence' | 'report' | 'complete' | 'error';
  data: any;
}
