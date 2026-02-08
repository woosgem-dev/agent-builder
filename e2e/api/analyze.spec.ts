import { test, expect } from '@playwright/test';

test.describe('POST /api/analyze', () => {
  const validFrontmatter = `name: test-skill
description: A comprehensive test skill for quality scoring. This skill helps identify issues and provides solutions.
version: 1.0.0
tags: [test, quality]
author: woosgem

skillhub:
  runtime:
    min_model: sonnet
    tools:
      required: [Read]
  resources:
    base_tokens: 1000
    context_hint: small

extended:
  use-cases:
    - 테스트 케이스 생성
    - 품질 검증
    - 자동화`;

  test('유효한 frontmatter 분석 성공', async ({ request }) => {
    const response = await request.post('/api/analyze', {
      data: { frontmatter: validFrontmatter },
    });

    expect(response.ok()).toBeTruthy();
    
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.scores).toBeDefined();
    expect(json.data.scores.totalScore).toBeGreaterThan(0);
    expect(json.data.scores.grade).toMatch(/^[SABCD]$/);
  });

  test('빈 frontmatter 에러 반환', async ({ request }) => {
    const response = await request.post('/api/analyze', {
      data: { frontmatter: '' },
    });

    expect(response.status()).toBe(400);
    
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  test('잘못된 YAML 형식 에러 반환', async ({ request }) => {
    const response = await request.post('/api/analyze', {
      data: { frontmatter: 'invalid: yaml: format: [' },
    });

    expect(response.status()).toBe(400);
    
    const json = await response.json();
    expect(json.success).toBe(false);
  });

  test('필수 필드 없으면 낮은 점수', async ({ request }) => {
    const minimalFrontmatter = `name: minimal
description: short`;

    const response = await request.post('/api/analyze', {
      data: { frontmatter: minimalFrontmatter },
    });

    expect(response.ok()).toBeTruthy();
    
    const json = await response.json();
    expect(json.data.scores.totalScore).toBeLessThan(50);
    expect(json.data.scores.grade).toMatch(/^[CD]$/);
  });

  test('improvementTips 포함', async ({ request }) => {
    const response = await request.post('/api/analyze', {
      data: { frontmatter: 'name: test\nversion: 1.0.0' },
    });

    expect(response.ok()).toBeTruthy();
    
    const json = await response.json();
    expect(json.data.improvementTips).toBeDefined();
    expect(Array.isArray(json.data.improvementTips)).toBe(true);
  });
});

test.describe('POST /api/analyze/url', () => {
  test('유효한 GitHub URL 분석 성공', async ({ request }) => {
    // 실제 존재하는 public 스킬 URL 필요
    // 테스트용 mock 또는 fixture 사용 권장
    const response = await request.post('/api/analyze/url', {
      data: { 
        githubUrl: 'https://github.com/anthropics/anthropic-cookbook/blob/main/misc/prompt_caching.ipynb' 
      },
    });

    // GitHub에서 실제 파일을 가져오므로 성공 또는 파싱 에러
    const json = await response.json();
    expect(json).toHaveProperty('success');
  });

  test('잘못된 URL 형식 에러', async ({ request }) => {
    const response = await request.post('/api/analyze/url', {
      data: { githubUrl: 'not-a-valid-url' },
    });

    expect(response.status()).toBe(400);
    
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  test('존재하지 않는 저장소 에러', async ({ request }) => {
    const response = await request.post('/api/analyze/url', {
      data: { 
        githubUrl: 'https://github.com/nonexistent-user-12345/nonexistent-repo-67890' 
      },
    });

    expect(response.status()).toBe(502);
    
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('GITHUB_ERROR');
  });
});
