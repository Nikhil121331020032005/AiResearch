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
  | 'visualizing'
  | 'synthesizing'
  | 'complete'
  | 'error';

export interface AgentStep {
  id: AgentStepId;
  label: string;
  status: StepStatus;
  details?: string;
  subQuestions?: string[];
  currentQuery?: string;
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
  subQuestion?: string;
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

export interface ChartSeries {
  dataKey: string;
  name: string;
  color?: string;
}

export interface ChartData {
  chartType: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  description?: string;
  xAxisKey?: string;
  yAxisLabel?: string;
  data: Record<string, any>[];
  series: ChartSeries[];
}

export interface ResearchReport {
  executiveSummary: string;
  keyFindings: {
    title: string;
    content: string;
  }[];
  evidence: ExtractedEvidence[];
  comparison?: ComparisonRow[] | null;
  chartData?: ChartData | null;
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
  type: 'step' | 'plan' | 'subquestions' | 'sources' | 'evidence' | 'report' | 'complete' | 'error';
  data: any;
}

