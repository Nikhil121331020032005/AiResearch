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
    "Goal 2 description"
  ],
  "subQuestions": [
    "Search query 1",
    "Search query 2"
  ],
  "searchStrategy": "High-level description of what evidence to prioritize."
}

Generate exactly ${queryCount} focused, specific search sub-questions.
IMPORTANT RULES FOR SUB-QUESTIONS:
1. Each sub-question MUST directly address a specific aspect of "${question}".
2. Make them search-engine friendly, objective, factual, and targeted.
3. NEVER generate generic filler queries unrelated to the subject.`;

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

  // Dynamic fallback plan tailored specifically to the user's question
  const cleanQ = question.trim();
  const lowerQ = cleanQ.toLowerCase();

  let dynamicSubQuestions: string[] = [];
  let dynamicGoals: string[] = [];

  if (lowerQ.includes('stock') || lowerQ.includes('reliance') || lowerQ.includes('company') || lowerQ.includes('financial')) {
    dynamicGoals = [
      `Examine core business segments and operational overview of ${cleanQ}`,
      `Analyze recent financial performance, revenue, earnings, and market valuation`,
      `Evaluate strategic initiatives, recent developments, and competitive positioning`,
      `Identify primary growth drivers, stock valuation metrics, and key risk factors`
    ];
    dynamicSubQuestions = [
      `${cleanQ} company overview and major business segments`,
      `${cleanQ} recent financial results revenue earnings growth`,
      `${cleanQ} strategic developments investments and market news`,
      `${cleanQ} stock growth outlook valuation and key risks`
    ];
  } else if (lowerQ.includes('vs') || lowerQ.includes('compare') || lowerQ.includes('difference')) {
    dynamicGoals = [
      `Analyze core architecture and fundamental design differences for ${cleanQ}`,
      `Evaluate performance benchmarks, efficiency, and resource utilization`,
      `Compare developer experience, ecosystem support, and community adoption`,
      `Formulate decision framework and optimal use cases for each option`
    ];
    dynamicSubQuestions = [
      `${cleanQ} key differences architecture and design`,
      `${cleanQ} performance benchmarks and speed comparison`,
      `${cleanQ} developer experience ecosystem and community adoption`,
      `${cleanQ} use cases pros cons comparison`
    ];
  } else {
    dynamicGoals = [
      `Analyze foundational concepts, mechanisms, and background regarding: ${cleanQ}`,
      `Gather empirical data, authoritative statistics, and key benchmarks`,
      `Examine primary benefits, practical applications, and recent developments`,
      `Identify major limitations, risks, and strategic implications`
    ];
    dynamicSubQuestions = [
      `${cleanQ} overview main concepts and mechanisms`,
      `${cleanQ} empirical evidence statistics and recent data`,
      `${cleanQ} key developments benefits and practical applications`,
      `${cleanQ} major risks limitations and future outlook`
    ];
  }

  return {
    goals: dynamicGoals,
    subQuestions: dynamicSubQuestions.slice(0, queryCount),
    searchStrategy: `Retrieve targeted, empirical evidence specifically addressing "${cleanQ}".`
  };
}

