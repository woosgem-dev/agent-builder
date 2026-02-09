/**
 * Simple test for the YAML frontmatter parser logic.
 * Run with: npx tsx test-parser.ts
 */

import { parse as parseYaml } from "yaml";

// ---------------------------------------------------------------------------
// Frontmatter parser (extracted from crawl-skills.ts)
// ---------------------------------------------------------------------------

interface SkillFrontmatter {
  name?: string;
  description?: string;
  tags?: string[];
  "allowed-tools"?: string[];
  [key: string]: unknown;
}

function parseFrontmatter(content: string): SkillFrontmatter | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;

  try {
    const parsed = parseYaml(match[1]);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as SkillFrontmatter;
    }
    return null;
  } catch (error) {
    console.error(
      `Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

console.log("Testing frontmatter parser...\n");

// Test 1: Basic frontmatter
console.log("Test 1: Basic frontmatter with name and description");
{
  const content = `---
name: git-commit
description: "Git commit message skill"
---

# Git Commit

Some body text here.
`;
  const result = parseFrontmatter(content);
  assert(result !== null, "Result should not be null");
  assert(result?.name === "git-commit", `Name should be "git-commit", got "${result?.name}"`);
  assert(
    result?.description === "Git commit message skill",
    `Description should match, got "${result?.description}"`
  );
}

// Test 2: Frontmatter with allowed-tools
console.log("\nTest 2: Frontmatter with allowed-tools array");
{
  const content = `---
name: test-skill
description: "A test skill"
allowed-tools:
  - Bash(git status)
  - Bash(git diff*)
---

# Body
`;
  const result = parseFrontmatter(content);
  assert(result !== null, "Result should not be null");
  assert(
    Array.isArray(result?.["allowed-tools"]),
    "allowed-tools should be an array"
  );
  assert(
    result?.["allowed-tools"]?.length === 2,
    `allowed-tools should have 2 items, got ${result?.["allowed-tools"]?.length}`
  );
}

// Test 3: No frontmatter
console.log("\nTest 3: Content without frontmatter");
{
  const content = `# Just a regular markdown file

No frontmatter here.
`;
  const result = parseFrontmatter(content);
  assert(result === null, "Result should be null for missing frontmatter");
}

// Test 4: Empty frontmatter
console.log("\nTest 4: Empty frontmatter");
{
  const content = `---
---

# Empty
`;
  const result = parseFrontmatter(content);
  // Empty YAML parses to null
  assert(result === null, "Empty frontmatter should return null");
}

// Test 5: Complex frontmatter (like brainstorming skill)
console.log("\nTest 5: Complex frontmatter with multiline description");
{
  const content = `---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior."
---

# Brainstorming
`;
  const result = parseFrontmatter(content);
  assert(result !== null, "Result should not be null");
  assert(result?.name === "brainstorming", `Name should be "brainstorming"`);
  assert(
    typeof result?.description === "string" && result.description.length > 20,
    "Description should be a long string"
  );
}

// Test 6: Frontmatter with tags
console.log("\nTest 6: Frontmatter with tags");
{
  const content = `---
name: tagged-skill
description: "A skill with tags"
tags:
  - git
  - productivity
  - automation
---

# Tagged Skill
`;
  const result = parseFrontmatter(content);
  assert(result !== null, "Result should not be null");
  assert(Array.isArray(result?.tags), "tags should be an array");
  assert(result?.tags?.length === 3, `tags should have 3 items, got ${result?.tags?.length}`);
  assert(result?.tags?.[0] === "git", `First tag should be "git"`);
}

// Test 7: Invalid YAML
console.log("\nTest 7: Invalid YAML in frontmatter");
{
  const content = `---
name: [invalid yaml
  this is: broken
---

# Broken
`;
  const result = parseFrontmatter(content);
  // This might parse or fail depending on YAML strictness
  console.log(`  (Invalid YAML result: ${result === null ? "null" : JSON.stringify(result)})`);
  // We just verify it doesn't throw
  assert(true, "Should not throw on invalid YAML");
}

// Summary
console.log("\n" + "=".repeat(40));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("=".repeat(40));

process.exit(failed > 0 ? 1 : 0);
