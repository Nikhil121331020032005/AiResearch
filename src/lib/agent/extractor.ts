import { ExtractedEvidence, WebSource, UploadedDoc, ResearchOptions } from '@/types/research';
import { callLLM, parseJSONFromText } from './llm';

export async function extractEvidence(
  question: string,
  sources: WebSource[],
  docs: UploadedDoc[] = [],
  options: ResearchOptions
): Promise<ExtractedEvidence[]> {
  if (sources.length === 0 && docs.length === 0) {
    return [];
  }

  // Format sources for prompt
  const sourcePayload = sources.map(s => `[Source ${s.id}] Title: ${s.title} (${s.domain})
URL: ${s.url}
Snippet: ${s.snippet}
Full Text / Excerpt: ${s.fullContent || s.snippet}
---`).join('\n\n');

  const docPayload = docs.map((d, i) => `[Document ${i + 1}] File: ${d.name}
Excerpt: ${d.content.slice(0, 1500)}
---`).join('\n\n');

  const systemPrompt = `You are an AI Evidence Extractor for an advanced research assistant.
Your task is to analyze retrieved web sources and uploaded documents to extract precise factual claims and supporting evidence relevant to the research request.

You MUST return ONLY a JSON object with an "evidence" array containing objects of this exact shape:
{
  "evidence": [
    {
      "claim": "Specific concise statement of fact or finding",
      "evidence": "Quoted or closely paraphrased supporting data/context from the source",
      "sourceId": 1, // Must match the exact numerical Source ID provided (e.g. 1, 2, 3...)
      "confidence": "high" // Must be "high", "medium", or "low"
    }
  ]
}

Rules:
1. ONLY extract claims actually supported by the provided sources.
2. Ensure sourceId strictly matches the number in [Source X].
3. Extract 4 to 10 distinct, non-redundant key findings.`;

  const userPrompt = `Research Question: "${question}"

RETRIEVED SOURCES:
${sourcePayload}

${docs.length > 0 ? `UPLOADED DOCUMENTS:\n${docPayload}` : ''}

Extract key factual claims and supporting evidence in the specified JSON format.`;

  try {
    const rawResponse = await callLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.1,
      jsonMode: true,
      apiKey: options.customApiKey,
    });

    const parsed = parseJSONFromText<{ evidence: any[] }>(rawResponse);
    if (parsed && Array.isArray(parsed.evidence)) {
      return parsed.evidence.map((item, index) => ({
        id: `ev-${index + 1}`,
        claim: item.claim || 'Factual Finding',
        evidence: item.evidence || item.claim || '',
        sourceId: typeof item.sourceId === 'number' ? item.sourceId : 1,
        confidence: ['high', 'medium', 'low'].includes(item.confidence) ? item.confidence : 'high',
      }));
    }
  } catch (err) {
    console.warn('Evidence extraction parsing error, using heuristic extraction fallback:', err);
  }

  // Fallback evidence extraction if LLM call or JSON parsing had an issue
  return sources.map((s, idx) => ({
    id: `ev-${idx + 1}`,
    claim: `Key finding from ${s.domain}: ${s.title.replace(/ - .*$/, '')}`,
    evidence: s.snippet,
    sourceId: s.id,
    confidence: 'high' as const,
  }));
}
