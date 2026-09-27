import { ResearchOptions, ResearchPlan } from '@/types/research';
import { callLLM, parseJSONFromText } from './llm';

export async function generateResearchPlan(
  question: string,
  options: ResearchOptions
): Promise<ResearchPlan> {
  const queryCount = options.depth === 'quick' ? 3 : options.depth === 'deep' ? 5 : 4;

  const systemPrompt = `You are an expert AI Research Planner.
Given a user's research request, break it down into a clear, strategic research plan.
You must output ONLY valid JSON matching this exact structure:
{
  "goals": [
    "Goal 1 description",
    "Goal 2 description",
    ...
  ],
  "subQuestions": [
    "Search query 1",
    "Search query 2",
    ...
  ],
  "searchStrategy": "High-level description of what evidence to prioritize."
}

Generate exactly ${queryCount} focused, specific search sub-questions. Each sub-question will be used directly as a web search query. Make them search-engine friendly, objective, and targeted.`;

  const userPrompt = `Research Request: "${question}"
Research Depth: ${options.depth}

Generate the strategic research plan and targeted search sub-questions in valid JSON.`;

  try {
    const rawResponse = await callLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      jsonMode: true,
      apiKey: options.customApiKey,
    });

    const parsed = parseJSONFromText<ResearchPlan>(rawResponse);
    if (parsed.goals && Array.isArray(parsed.subQuestions) && parsed.subQuestions.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Error parsing LLM research plan, using heuristic planner fallback:', err);
  }

  // Robust fallback plan if parsing fails
  return {
    goals: [
      `Analyze core concepts and primary applications regarding: ${question}`,
      'Retrieve empirical evidence, statistics, and domain benchmarks',
      'Identify key benefits, performance metrics, and operational advantages',
      'Examine risks, security/privacy concerns, and current limitations',
      'Synthesize findings across sources with citations'
    ],
    subQuestions: [
      `${question} main applications and benefits`,
      `${question} risks limitations and challenges`,
      `${question} empirical studies research benchmarks`,
      `${question} future outlook and comparative analysis`
    ].slice(0, queryCount),
    searchStrategy: 'Retrieve balanced evidence across peer-reviewed, industry, and authoritative web sources.'
  };
}
