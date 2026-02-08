import { parse as parseYaml } from 'yaml';
import type { Frontmatter } from './calculator';

export interface ParseResult {
  success: boolean;
  frontmatter?: Frontmatter;
  error?: string;
  errorLine?: number;
}

/**
 * Parse frontmatter from markdown content
 */
export function parseFrontmatter(content: string): ParseResult {
  // Check for frontmatter delimiters
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      success: false,
      error: 'Frontmatter를 찾을 수 없습니다. ---로 시작하고 ---로 끝나는 YAML 블록이 필요합니다.',
    };
  }

  const yamlContent = match[1];

  try {
    const parsed = parseYaml(yamlContent, {
      // Security: limit depth and size
      maxAliasCount: 100,
    }) as Frontmatter;

    // Validate basic structure
    if (typeof parsed !== 'object' || parsed === null) {
      return {
        success: false,
        error: 'Frontmatter가 유효한 YAML 객체가 아닙니다.',
      };
    }

    return {
      success: true,
      frontmatter: parsed,
    };
  } catch (err) {
    const yamlError = err as { message?: string; linePos?: Array<{ line?: number }> };
    const line = yamlError.linePos?.[0]?.line;

    return {
      success: false,
      error: `YAML 파싱 오류: ${yamlError.message || '알 수 없는 오류'}`,
      errorLine: line,
    };
  }
}

/**
 * Fetch and parse frontmatter from GitHub raw URL
 */
export async function fetchAndParseFrontmatter(
  owner: string,
  repo: string,
  path: string,
  ref: string = 'main'
): Promise<ParseResult & { rawContent?: string }> {
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;

  try {
    const response = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'SkillHub/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: '파일을 찾을 수 없습니다. URL과 경로를 확인해주세요.',
        };
      }
      return {
        success: false,
        error: `GitHub에서 파일을 가져올 수 없습니다. (HTTP ${response.status})`,
      };
    }

    const content = await response.text();
    const parseResult = parseFrontmatter(content);

    return {
      ...parseResult,
      rawContent: content,
    };
  } catch (err) {
    return {
      success: false,
      error: `GitHub 연결 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * Parse GitHub URL into components
 */
export function parseGitHubUrl(url: string): {
  success: boolean;
  owner?: string;
  repo?: string;
  path?: string;
  ref?: string;
  error?: string;
} {
  // Pattern: https://github.com/owner/repo/blob/ref/path/to/file.md
  // or: https://github.com/owner/repo (assume default)
  const blobPattern = /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/blob\/([\w.-]+)\/(.+)$/;
  const repoPattern = /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/?$/;

  let match = url.match(blobPattern);
  if (match) {
    return {
      success: true,
      owner: match[1],
      repo: match[2],
      ref: match[3],
      path: match[4],
    };
  }

  match = url.match(repoPattern);
  if (match) {
    return {
      success: true,
      owner: match[1],
      repo: match[2],
      ref: 'main',
      path: 'SKILL.md', // Default skill file
    };
  }

  return {
    success: false,
    error: 'GitHub URL 형식을 인식할 수 없습니다.',
  };
}
