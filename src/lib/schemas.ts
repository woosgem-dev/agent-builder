import { z } from 'zod';

/**
 * Zod schemas for runtime validation
 */

export const skillSearchParamsSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SkillSearchParams = z.infer<typeof skillSearchParamsSchema>;

export const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1),
    })
  ),
  context: z
    .object({
      agentName: z.string().optional(),
      agentDescription: z.string().optional(),
      selectedSkills: z.array(z.string()).optional(),
    })
    .optional(),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

export const agentFrontmatterSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Name must be lowercase with hyphens only'),
  description: z.string().min(1),
  model: z.enum(['sonnet', 'opus', 'haiku', 'inherit']).optional(),
  tools: z.array(z.string()).optional(),
  disallowedTools: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  maxTurns: z.number().int().positive().optional(),
  permissionMode: z.string().optional(),
  mcpServers: z
    .record(
      z.string(),
      z.object({
        command: z.string(),
        args: z.array(z.string()).optional(),
        env: z.record(z.string(), z.string()).optional(),
      })
    )
    .optional(),
});

export type AgentFrontmatterInput = z.infer<typeof agentFrontmatterSchema>;
