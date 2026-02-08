import { z } from 'zod';

// Create skill (from GitHub URL)
export const CreateSkillSchema = z.object({
  githubUrl: z
    .string()
    .url('유효한 URL을 입력해주세요')
    .regex(
      /^https:\/\/github\.com\/[\w-]+\/[\w.-]+/,
      'GitHub URL 형식이 아닙니다 (예: https://github.com/owner/repo)'
    )
    .max(500, 'URL이 너무 깁니다'),
});

// Update skill
export const UpdateSkillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(10).max(5000).optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'semver 형식이 아닙니다').optional(),
  license: z.string().max(50).optional(),
  icon: z.string().max(10).optional(),
});

// Query params for skill list
export const SkillQuerySchema = z.object({
  q: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
  grade: z.enum(['S', 'A', 'B', 'C', 'D']).optional(),
  model: z.enum(['haiku', 'sonnet', 'opus']).optional(),
  author: z.string().optional(),
  sort: z.enum(['score', 'recent', 'popular']).default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSkillInput = z.infer<typeof CreateSkillSchema>;
export type UpdateSkillInput = z.infer<typeof UpdateSkillSchema>;
export type SkillQuery = z.infer<typeof SkillQuerySchema>;
