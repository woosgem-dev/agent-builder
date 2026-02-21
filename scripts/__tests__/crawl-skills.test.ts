import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('scripts/crawl-skills.ts', () => {
  const scriptContent = readFileSync(
    resolve(__dirname, '../crawl-skills.ts'),
    'utf-8',
  );

  it('does not call GitHub Search API inside the branch loop', () => {
    const lines = scriptContent.split('\n');

    // Find the fetchSkillMd function
    const fnStart = lines.findIndex((l) => l.includes('async function fetchSkillMd'));
    expect(fnStart).toBeGreaterThan(-1);

    const fnLines = lines.slice(fnStart);

    // Find the first "for (const branch" loop in this function
    const branchLoopIdx = fnLines.findIndex((l) => /for \(const branch of/.test(l));
    expect(branchLoopIdx).toBeGreaterThan(-1);

    // Walk forward to find the closing brace that ends the branch loop
    let braceDepth = 0;
    let closingIdx = -1;
    for (let i = branchLoopIdx; i < fnLines.length; i++) {
      for (const ch of fnLines[i]) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }
      if (braceDepth === 0 && i > branchLoopIdx) {
        closingIdx = i;
        break;
      }
    }
    expect(closingIdx).toBeGreaterThan(branchLoopIdx);

    // The GitHub API call should NOT be between branchLoopIdx and closingIdx
    const loopBody = fnLines.slice(branchLoopIdx, closingIdx + 1).join('\n');
    expect(loopBody).not.toContain('api.github.com/search');
  });
});
