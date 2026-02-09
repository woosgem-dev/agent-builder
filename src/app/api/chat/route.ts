import { NextRequest, NextResponse } from 'next/server';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context?: {
    agentName?: string;
    agentDescription?: string;
    selectedSkills?: string[];
  };
}

export interface AgentFormUpdate {
  name?: string;
  description?: string;
  model?: string;
  tools?: string[];
  skills?: string[];
}

export interface ChatResponse {
  message: ChatMessage;
  formUpdate?: AgentFormUpdate;
  suggestedSkills?: string[];
}

/**
 * POST /api/chat
 * AI conversation for agent building
 * - Generates agent configuration from natural language
 * - Recommends relevant skills based on context
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as ChatRequest;

  // TODO: Implement Claude API integration
  // 1. Build system prompt with agent .md format + examples
  // 2. Include skill candidates from DB if recommending
  // 3. Parse response for form updates + conversation

  return NextResponse.json<ChatResponse>({
    message: {
      role: 'assistant',
      content: 'AI chat is not yet implemented. Please configure your ANTHROPIC_API_KEY.',
    },
  });
}
