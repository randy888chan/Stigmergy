import { mock, describe, test, expect, beforeEach } from 'bun:test';

mock.module('fs-extra', () => {
  const memfs = require('memfs'); // Use require here for the in-memory file system
  return {
    ...memfs.fs, // Spread the entire in-memory fs library
    __esModule: true, // Mark as an ES Module
    // Explicitly add any functions that might be missing from memfs but are in fs-extra
    ensureDir: memfs.fs.mkdir.bind(null, { recursive: true }),
    pathExists: memfs.fs.exists.bind(null),
    // Add default export for compatibility
    default: {
        ...memfs.fs,
        readdir: mock(),
        readFile: mock(),
        existsSync: mock(),
        ensureDir: memfs.fs.mkdir.bind(null, { recursive: true }),
        pathExists: memfs.fs.exists.bind(null),
    }
  };
});

describe("Validation Command", () => {
    let fs;
    let validateAgents;

  beforeEach(async () => {
    mock.restore();
    fs = (await import("fs-extra")).default;
    validateAgents = (await import("../../../../cli/commands/validate.js")).validateAgents;
    // Reset any global config that might interfere
    delete global.StigmergyConfig;
  });

  describe("validateAgents", () => {
    test("should return success for a set of valid agent files", async () => {
      const validAgentContent = `
\`\`\`yaml
agent:
  id: test-agent
  name: Test Agent
  alias: "@test"
  model_tier: b_tier
  persona:
    role: "A test agent"
  core_protocols:
    - "Test protocol"
\`\`\`
`;
      const MOCK_DIR = '/fake/path';
      const MOCK_FILE_PATH = `${MOCK_DIR}/test-agent.md`;
      fs.vol.fromJSON({ [MOCK_FILE_PATH]: validAgentContent });

      const result = await validateAgents(MOCK_DIR);
      expect(result.success).toBe(true);
    });

    test("should return failure for a file with no YAML block", async () => {
        const MOCK_DIR = '/fake/path';
        const MOCK_FILE_PATH = `${MOCK_DIR}/no-yaml.md`;
        fs.vol.fromJSON({ [MOCK_FILE_PATH]: "Just text" });

        const result = await validateAgents(MOCK_DIR);
        expect(result.success).toBe(false);
        expect(result.error).toContain("1 agent definition(s) failed validation");
      });

    test("should return failure for a file with invalid YAML", async () => {
        const MOCK_DIR = '/fake/path';
        const MOCK_FILE_PATH = `${MOCK_DIR}/invalid-yaml.md`;
        fs.vol.fromJSON({ [MOCK_FILE_PATH]: "```yaml\nkey: - value\n```" });

      const result = await validateAgents(MOCK_DIR);
      expect(result.success).toBe(false);
      expect(result.error).toContain("1 agent definition(s) failed validation");
    });

    test("should return failure for a file that fails Zod schema validation", async () => {
        const invalidSchemaContent = `
  \`\`\`yaml
  agent:
    id: "INVALID ID" # Contains space
    name: Test Agent
    persona:
        role: "A test agent"
  \`\`\`
  `;
        const MOCK_DIR = '/fake/path';
        const MOCK_FILE_PATH = `${MOCK_DIR}/invalid-schema.md`;
        fs.vol.fromJSON({ [MOCK_FILE_PATH]: invalidSchemaContent });

        const result = await validateAgents(MOCK_DIR);
        expect(result.success).toBe(false);
      });

      test("should return failure for duplicate aliases", async () => {
        const agent1 = "```yaml\nagent:\n  id: agent-1\n  name: Agent 1\n  alias: '@dup'\n  model_tier: b_tier\n  persona:\n    role: 'r'\n  core_protocols:\n    - 'test'\n```";
        const agent2 = "```yaml\nagent:\n  id: agent-2\n  name: Agent 2\n  alias: '@dup'\n  model_tier: b_tier\n  persona:\n    role: 'r'\n  core_protocols:\n    - 'test'\n```";
        const MOCK_DIR = '/fake/path';
        fs.vol.fromJSON({
            [`${MOCK_DIR}/agent1.md`]: agent1,
            [`${MOCK_DIR}/agent2.md`]: agent2,
        });

        const result = await validateAgents(MOCK_DIR);
        expect(result.success).toBe(false);
        expect(result.error).toContain("agent definition(s) failed validation");
    });

    test("should return failure if agents directory does not exist", async () => {
        // No files created, so the directory doesn't exist in memfs
        const result = await validateAgents("/non-existent-path");
        expect(result.success).toBe(false);
        expect(result.error).toContain("No agent definitions found");
    });
  });
});
