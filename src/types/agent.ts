/**
 * Agent frontmatter fields for .md file generation
 */
export interface AgentFrontmatter {
  name: string;
  description: string;
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
  tools?: string[];
  disallowedTools?: string[];
  skills?: string[];
  maxTurns?: number;
  permissionMode?: string;
  mcpServers?: Record<string, McpServerConfig>;
}

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * Full agent definition (frontmatter + body)
 */
export interface AgentDefinition {
  frontmatter: AgentFrontmatter;
  body: string;
}
