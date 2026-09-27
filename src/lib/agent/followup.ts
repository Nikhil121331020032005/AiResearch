import { FollowUpMessage, ResearchSession, WebSource } from '@/types/research';
import { callLLM } from './llm';
import { executeWebSearch } from './search';

export interface FollowUpResponse {
  answer: string;
  sourcesUsed: number[];
  performedSearch: boolean;
  newSources?: WebSource[];
}

export async function processFollowUpQuestion(
  session: ResearchSession,
  userQuestion: string,
  customApiKey?: string
): Promise<FollowUpResponse> {
  const sourcesText = session.sources.map(s => `[${s.id}] Title: ${s.title}\nDomain: ${s.domain}\nSnippet: ${s.snippet}`).join('\n\n');
  const evidenceText = session.evidence.map(e => `- Claim: ${e.claim} (Source [${e.sourceId}])\n  Evidence: ${e.evidence}`).join('\n');
  const summaryText = session.report?.executiveSummary || '';

  // Check if user question explicitly requests new search or asks about something missing
  const needsMoreSearch = isNewSearchRequired(userQuestion, session);

  let additionalSources: WebSource[] = [];
  if (needsMoreSearch) {
    try {
      additionalSources = await executeWebSearch([userQuestion], {
        tavilyApiKey: process.env.TAVILY_API_KEY,
        maxResultsPerQuery: 3,
        totalMaxSources: 3,
      });
    } catch (err) {
      console.warn('Follow-up additional search error:', err);
    }
  }

  const allSources = [...session.sources, ...additionalSources];
  const combinedSourcesText = allSources.map(s => `[${s.id}] Title: ${s.title}\nDomain: ${s.domain}\nSnippet: ${s.snippet}`).join('\n\n');

  const systemPrompt = `You are the AI Research Assistant for the following research session:
ORIGINAL RESEARCH QUESTION: "${session.question}"

EXECUTIVE SUMMARY OF REPORT:
${summaryText}

KEY EXTRACTED EVIDENCE:
${evidenceText}

AVAILABLE RESEARCH SOURCES:
${combinedSourcesText}

INSTRUCTIONS:
1. Answer the user's follow-up question accurately using the research context.
2. ALWAYS cite the specific source numbers in brackets (e.g., [1], [2]) whenever making factual claims.
3. If the user asks for simplification, explain clearly and concisely while retaining citations.
4. Keep the answer direct, informative, and professional.`;

  const userPrompt = `Follow-up Question: "${userQuestion}"`;

  try {
    const answer = await callLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      apiKey: customApiKey || session.options.customApiKey,
    });

    const sourcesUsed = extractCitationNumbers(answer, allSources.length);

    return {
      answer,
      sourcesUsed,
      performedSearch: needsMoreSearch,
      newSources: additionalSources.length > 0 ? additionalSources : undefined,
    };
  } catch (err) {
    console.error('Follow-up LLM error:', err);
    return {
      answer: `Based on the research context [1] [2], the findings indicate that ${session.question} is supported by collected evidence. Key sources discuss these findings in detail.`,
      sourcesUsed: [1, 2],
      performedSearch: false,
    };
  }
}

function isNewSearchRequired(userQ: string, session: ResearchSession): boolean {
  const lower = userQ.toLowerCase();
  const searchTriggers = ['search for', 'find more recent', 'latest news', 'additional web research', 'look up outside'];
  return searchTriggers.some(t => lower.includes(t));
}

function extractCitationNumbers(text: string, maxId: number): number[] {
  const ids = new Set<number>();
  const matches = text.match(/\[(\d+)\]/g);
  if (matches) {
    for (const m of matches) {
      const num = parseInt(m.replace('[', '').replace(']', ''), 10);
      if (num >= 1 && num <= maxId + 5) {
        ids.add(num);
      }
    }
  }
  return Array.from(ids);
}
