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
            details: `Evaluating question intent, depth setting (${options.depth}), and target source limit (${options.maxSources}).`,
            timestamp: new Date().toISOString(),
          });
          await delay(200);

          sendEvent('step', {
            id: 'analyzing',
            label: 'Analyzing research question',
            status: 'completed',
            details: 'Query intent analyzed and research scope established.',
            timestamp: new Date().toISOString(),
          });

          // Step 2: Formulating Research Plan
          sendEvent('step', {
            id: 'planning',
            label: 'Formulating research plan',
            status: 'running',
            details: 'Generating strategic goals and structuring search methodology...',
            timestamp: new Date().toISOString(),
          });

          const plan = await generateResearchPlan(question, options);

          sendEvent('plan', plan);
          sendEvent('step', {
            id: 'planning',
            label: 'Formulating research plan',
            status: 'completed',
            details: `Formulated ${plan.goals.length} research goals and search strategy.`,
            timestamp: new Date().toISOString(),
          });

          // Step 3: Generating Search Sub-Questions
          sendEvent('step', {
            id: 'subqueries',
            label: 'Generating search sub-questions',
            status: 'running',
            details: `Generated ${plan.subQuestions.length} targeted search queries to drive evidence retrieval.`,
            subQuestions: plan.subQuestions,
            timestamp: new Date().toISOString(),
          });
          await delay(250);

          sendEvent('step', {
            id: 'subqueries',
            label: 'Generating search sub-questions',
            status: 'completed',
            details: `Generated ${plan.subQuestions.length} targeted research sub-questions: ${plan.subQuestions.map(q => `"${q}"`).join(', ')}.`,
            subQuestions: plan.subQuestions,
            timestamp: new Date().toISOString(),
          });

          // Step 4: Web Search per Sub-Question
          sendEvent('step', {
            id: 'searching',
            label: 'Searching multi-source web',
            status: 'running',
            details: `Executing search across ${plan.subQuestions.length} sub-questions...`,
            timestamp: new Date().toISOString(),
          });

          const sources = await executeWebSearch(plan.subQuestions, {
            tavilyApiKey: options.customSearchKey || process.env.TAVILY_API_KEY,
            totalMaxSources: options.maxSources || 8,
            onProgress: (subQ, count) => {
              sendEvent('step', {
                id: 'searching',
                label: 'Searching multi-source web',
                status: 'running',
                details: `Searching sub-question: "${subQ}" (${count} sources collected so far)`,
                currentQuery: subQ,
                timestamp: new Date().toISOString(),
              });
            },
          });

          sendEvent('sources', sources);
          sendEvent('step', {
            id: 'searching',
            label: 'Searching multi-source web',
            status: 'completed',
            details: `Retrieved and deduplicated ${sources.length} distinct web sources across generated sub-questions.`,
            timestamp: new Date().toISOString(),
          });

          // Step 5: Evidence Extraction
          sendEvent('step', {
            id: 'extracting',
            label: 'Extracting evidence & claims',
            status: 'running',
            details: `Parsing ${sources.length} web sources ${docs.length > 0 ? `and ${docs.length} uploaded docs ` : ''}for factual claims...`,
            timestamp: new Date().toISOString(),
          });

          const evidence = await extractEvidence(question, sources, docs, options);

          sendEvent('evidence', evidence);
          sendEvent('step', {
            id: 'extracting',
            label: 'Extracting evidence & claims',
            status: 'completed',
            details: `Extracted ${evidence.length} factual claims with source attribution.`,
            timestamp: new Date().toISOString(),
          });

          // Step 6: Data Visualization Analysis
          sendEvent('step', {
            id: 'visualizing',
            label: 'Generating data visualizations',
            status: 'running',
            details: 'Evaluating extracted evidence for structured numerical and quantitative data...',
            timestamp: new Date().toISOString(),
          });
          await delay(200);

          // Step 7: Synthesizing Cited Report
          sendEvent('step', {
            id: 'synthesizing',
            label: 'Synthesizing cited report',
            status: 'running',
            details: 'Structuring Executive Summary, Key Findings, Matrix Comparison, and Citations...',
            timestamp: new Date().toISOString(),
          });

          const report = await synthesizeResearchReport(question, plan, sources, evidence, options);

          if (report.chartData) {
            sendEvent('step', {
              id: 'visualizing',
              label: 'Generating data visualizations',
              status: 'completed',
              details: `Generated interactive ${report.chartData.chartType} chart: "${report.chartData.title}".`,
              timestamp: new Date().toISOString(),
            });
          } else {
            sendEvent('step', {
              id: 'visualizing',
              label: 'Generating data visualizations',
              status: 'completed',
              details: 'Visualizations unavailable — insufficient structured numerical evidence found.',
              timestamp: new Date().toISOString(),
            });
          }

          sendEvent('report', report);
          sendEvent('step', {
            id: 'synthesizing',
            label: 'Synthesizing cited report',
            status: 'completed',
            details: 'Cited research report generated successfully with domain citations.',
            timestamp: new Date().toISOString(),
          });

          // Complete
          sendEvent('step', {
            id: 'complete',
            label: 'Research workflow complete',
            status: 'completed',
            details: 'Ready for interactive inspection and follow-up Q&A.',
            timestamp: new Date().toISOString(),
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
            timestamp: new Date().toISOString(),
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

