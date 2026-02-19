import { NextResponse } from 'next/server';

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
 * AI conversation for agent building (stub)
 *
 * TODO: Implement Claude API integration
 */
export function POST(): Response {
  return NextResponse.json<ChatResponse>({
    message: {
      role: 'assistant',
      content: 'AI chat is not yet implemented. Please configure your ANTHROPIC_API_KEY.',
    },
  });
}
