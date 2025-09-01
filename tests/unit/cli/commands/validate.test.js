import fs from "fs-extra";
import { validateAgents } from "../../../../cli/commands/validate.js";
import path from "path";

// Mock fs-extra
jest.mock("fs-extra");

describe("Validation Command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      fs.readdir.mockResolvedValue(["test-agent.md"]);
      fs.readFile.mockResolvedValue(validAgentContent);
      fs.existsSync.mockReturnValue(true);

      const result = await validateAgents();
      expect(result.success).toBe(true);
    });

    test("should return failure for a file with no YAML block", async () => {
        fs.readdir.mockResolvedValue(["no-yaml.md"]);
        fs.readFile.mockResolvedValue("Just text");
        fs.existsSync.mockReturnValue(true);

        const result = await validateAgents();
        expect(result.success).toBe(false);
        expect(result.error).toContain("1 agent definition(s) failed validation");
      });

    test("should return failure for a file with invalid YAML", async () => {
      fs.readdir.mockResolvedValue(["invalid-yaml.md"]);
      fs.readFile.mockResolvedValue("```yaml\nkey: - value\n```");
      fs.existsSync.mockReturnValue(true);

      const result = await validateAgents();
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
        fs.readdir.mockResolvedValue(["invalid-schema.md"]);
        fs.readFile.mockResolvedValue(invalidSchemaContent);
        fs.existsSync.mockReturnValue(true);

        const result = await validateAgents();
        expect(result.success).toBe(false);
      });

      test("should return failure for duplicate aliases", async () => {
        const agent1 = "```yaml\nagent:\n  id: agent-1\n  name: Agent 1\n  alias: '@dup'\n  model_tier: b_tier\n  persona:\n    role: 'r'\n  core_protocols:\n    - 'test'\n```";
        const agent2 = "```yaml\nagent:\n  id: agent-2\n  name: Agent 2\n  alias: '@dup'\n  model_tier: b_tier\n  persona:\n    role: 'r'\n  core_protocols:\n    - 'test'\n```";
        fs.readdir.mockResolvedValue(["agent1.md", "agent2.md"]);
        fs.readFile.mockImplementation((filePath) => {
            if (filePath.includes("agent1.md")) return Promise.resolve(agent1);
            if (filePath.includes("agent2.md")) return Promise.resolve(agent2);
            return Promise.reject("File not found");
        });
        fs.existsSync.mockReturnValue(true);

        const result = await validateAgents();
        expect(result.success).toBe(false);
        expect(result.error).toContain("agent definition(s) failed validation");
    });

    test("should return failure if agents directory does not exist", async () => {
        fs.existsSync.mockReturnValue(false);
        const result = await validateAgents();
        expect(result.success).toBe(false);
        expect(result.error).toContain("Agents directory not found");
    });
  });
});
