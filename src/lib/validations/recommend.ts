import { z } from 'zod';

export const RecommendSchema = z.object({
  query: z
    .string()
    .min(1, '검색어를 입력해주세요')
    .max(500, '검색어는 500자 이내로 입력해주세요'),
  filters: z
    .object({
      maxTokens: z.number().int().positive().max(100000).optional(),
      minGrade: z.enum(['S', 'A', 'B', 'C', 'D']).optional(),
      model: z.enum(['haiku', 'sonnet', 'opus']).optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
  limit: z.number().int().min(1).max(20).default(5),
});

export const AnalyzeUrlSchema = z.object({
  githubUrl: z
    .string()
    .url()
    .regex(/^https:\/\/github\.com\/[\w-]+\/[\w.-]+/, 'GitHub URL 형식이 아닙니다'),
});

export const AnalyzeFrontmatterSchema = z.object({
  frontmatter: z.string().min(1).max(50000),
});

export type RecommendInput = z.infer<typeof RecommendSchema>;
export type AnalyzeUrlInput = z.infer<typeof AnalyzeUrlSchema>;
export type AnalyzeFrontmatterInput = z.infer<typeof AnalyzeFrontmatterSchema>;
