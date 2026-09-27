import { NextRequest } from 'next/server';
import { ResearchOptions, UploadedDoc, WebSource } from '@/types/research';
import { generateResearchPlan } from '@/lib/agent/planner';
import { executeWebSearch } from '@/lib/agent/search';
import { extractEvidence } from '@/lib/agent/extractor';
import { synthesizeResearchReport } from '@/lib/agent/synthesizer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question: string = body.question;
    const options: ResearchOptions = body.options || { depth: 'standard', maxSources: 8 };
    const docs: UploadedDoc[] = body.docs || [];

    if (!question || typeof question !== 'string' || !question.trim()) {
      return new Response(JSON.stringify({ error: 'Research question is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
        };

        try {
          // Step 1: Analyzing Research Question
          sendEvent('step', {
            id: 'analyzing',
            label: 'Analyzing research question',
            status: 'running',
            details: `Evaluating intent, depth setting (${options.depth}), and max sources target (${options.maxSources}).`,
          });
          await delay(200);

          sendEvent('step', {
            id: 'analyzing',
            label: 'Analyzing research question',
            status: 'completed',
            details: 'Query intent and target scope established.',
          });

          // Step 2: Research Planning & Sub-question Generation
          sendEvent('step', {
            id: 'planning',
            label: 'Creating research plan & sub-questions',
            status: 'running',
            details: 'Formulating strategic objectives and targeted search queries.',
          });

          const plan = await generateResearchPlan(question, options);

          sendEvent('plan', plan);
          sendEvent('step', {
            id: 'planning',
            label: 'Creating research plan & sub-questions',
            status: 'completed',
            details: `Generated ${plan.subQuestions.length} targeted search queries and strategic goals.`,
          });

          // Step 3: Web Search Retrieval
          sendEvent('step', {
            id: 'searching',
            label: 'Searching web sources',
            status: 'running',
            details: `Querying search providers across ${plan.subQuestions.length} sub-questions...`,
          });

          const sources = await executeWebSearch(plan.subQuestions, {
            tavilyApiKey: options.customSearchKey || process.env.TAVILY_API_KEY,
            totalMaxSources: options.maxSources || 8,
          });

          sendEvent('sources', sources);
          sendEvent('step', {
            id: 'searching',
            label: 'Searching web sources',
            status: 'completed',
            details: `Retrieved ${sources.length} distinct web sources across target domains.`,
          });

          // Step 4: Evidence Extraction
          sendEvent('step', {
            id: 'extracting',
            label: 'Extracting factual evidence & claims',
            status: 'running',
            details: `Parsing ${sources.length} web sources ${docs.length > 0 ? `and ${docs.length} uploaded docs ` : ''}for factual evidence...`,
          });

          const evidence = await extractEvidence(question, sources, docs, options);

          sendEvent('evidence', evidence);
          sendEvent('step', {
            id: 'extracting',
            label: 'Extracting factual evidence & claims',
            status: 'completed',
            details: `Extracted ${evidence.length} factual claims with source attribution.`,
          });

          // Step 5: Synthesizing Findings & Generating Cited Report
          sendEvent('step', {
            id: 'synthesizing',
            label: 'Synthesizing findings & generating cited report',
            status: 'running',
            details: 'Structuring Executive Summary, Key Findings, Matrix Comparison, and Citations...',
          });

          const report = await synthesizeResearchReport(question, plan, sources, evidence, options);

          sendEvent('report', report);
          sendEvent('step', {
            id: 'synthesizing',
            label: 'Synthesizing findings & generating cited report',
            status: 'completed',
            details: 'Cited research report generated successfully.',
          });

          // Complete
          sendEvent('step', {
            id: 'complete',
            label: 'Research workflow complete',
            status: 'completed',
            details: `Ready for interactive inspection and follow-up Q&A.`,
          });

          sendEvent('complete', { success: true });
        } catch (err: any) {
          console.error('API research pipeline error:', err);
          sendEvent('error', { message: err?.message || 'Research pipeline failed.' });
          sendEvent('step', {
            id: 'error',
            label: 'Research process error',
            status: 'error',
            details: err?.message || 'An error occurred during research execution.',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
