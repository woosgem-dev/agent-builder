import { describe, it, expect } from 'vitest';
import { POST } from '../route';

describe('POST /api/chat', () => {
  it('returns stub response', async () => {
    const response = POST();
    const body = await response.json();

    expect(body.message.role).toBe('assistant');
    expect(body.message.content).toContain('not yet implemented');
  });
});
