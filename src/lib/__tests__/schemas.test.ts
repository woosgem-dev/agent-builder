import { describe, it, expect } from 'vitest';
import {
  skillSearchParamsSchema,
  chatRequestSchema,
  agentFrontmatterSchema,
} from '../schemas';

describe('skillSearchParamsSchema', () => {
  it('parses valid input', () => {
    const result = skillSearchParamsSchema.safeParse({
      q: 'react',
      page: '2',
      limit: '10',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ q: 'react', page: 2, limit: 10 });
    }
  });

  it('applies default page and limit', () => {
    const result = skillSearchParamsSchema.safeParse({ q: 'test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('rejects missing q', () => {
    const result = skillSearchParamsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects limit > 100', () => {
    const result = skillSearchParamsSchema.safeParse({ q: 'test', limit: '101' });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive page', () => {
    const result = skillSearchParamsSchema.safeParse({ q: 'test', page: '0' });
    expect(result.success).toBe(false);
  });
});

describe('chatRequestSchema', () => {
  it('parses valid messages', () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: 'user', content: 'hello' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: 'user', content: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: 'system', content: 'hello' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional context', () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: 'user', content: 'hello' }],
      context: { agentName: 'test-agent', selectedSkills: ['skill-1'] },
    });
    expect(result.success).toBe(true);
  });
});

describe('agentFrontmatterSchema', () => {
  it('parses valid input', () => {
    const result = agentFrontmatterSchema.safeParse({
      name: 'my-agent',
      description: 'A test agent',
    });
    expect(result.success).toBe(true);
  });

  it('rejects uppercase in name', () => {
    const result = agentFrontmatterSchema.safeParse({
      name: 'My-Agent',
      description: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects spaces in name', () => {
    const result = agentFrontmatterSchema.safeParse({
      name: 'my agent',
      description: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = agentFrontmatterSchema.safeParse({
      name: 'my-agent',
      description: 'test',
      model: 'opus',
      tools: ['Read', 'Write'],
      maxTurns: 10,
    });
    expect(result.success).toBe(true);
  });
});
