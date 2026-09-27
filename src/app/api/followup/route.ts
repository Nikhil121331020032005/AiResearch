import { NextRequest, NextResponse } from 'next/server';
import { ResearchSession } from '@/types/research';
import { processFollowUpQuestion } from '@/lib/agent/followup';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session: ResearchSession = body.session;
    const question: string = body.question;
    const customApiKey: string | undefined = body.customApiKey;

    if (!session || !question) {
      return NextResponse.json(
        { error: 'Session and question are required.' },
        { status: 400 }
      );
    }

    const response = await processFollowUpQuestion(session, question, customApiKey);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Follow-up route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process follow-up question.' },
      { status: 500 }
    );
  }
}
