const fs = require("fs-extra");
const path = require("path");
const { run, parseAgentYaml } = require("../installer/install");

// Mock the dependencies
jest.mock("fs-extra");
jest.mock("ora", () => () => ({
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  warn: jest.fn().mockReturnThis(),
  text: "",
}));

const CWD = process.cwd();

// --- START: REALISTIC MOCK DATA ---
const MOCK_ANALYST_FILE = `
\`\`\`yaml
agent:
  id: "analyst"
  alias: "mary"
  name: "Mary"
  icon: "📊"
persona:
  role: "Proactive Market Analyst & Strategic Research Partner"
  style: "Analytical, inquisitive, data-informed, and constraint-focused."
  identity: "I am a strategic analyst."
\`\`\`
`;

const MOCK_DISPATCHER_FILE = `
\`\`\`yaml
agent:
  id: "dispatcher"
  alias: "saul"
  name: "Saul"
  icon: "🧠"
persona:
  role: "AI System Orchestrator"
  identity: "I am Saul, the AI brain of the Stigmergy system."
\`\`\`
`;

const MOCK_NO_PERSONA_BLOCK = "```yaml\nagent:\n  id: qa\n  alias: quinn\n```";
const EXAMPLE_ENV_CONTENT = "LLM_API_KEY=example_key";
// --- END: REALISTIC MOCK DATA ---

describe("Stigmergy Installer", () => {
  describe("parseAgentYaml", () => {
    it("should correctly parse a valid agent file", () => {
      const parsed = parseAgentYaml(MOCK_ANALYST_FILE);
      expect(parsed).not.toBeNull();
      expect(parsed.config.agent.id).toBe("analyst");
      expect(parsed.roleDefinition).toContain("I am a strategic analyst.");
    });

    it("should return null if the persona block is missing from YAML", () => {
      const parsed = parseAgentYaml(MOCK_NO_PERSONA_BLOCK);
      expect(parsed).toBeNull();
    });
  });

  describe("run", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      fs.readFile.mockResolvedValue(EXAMPLE_ENV_CONTENT);
      fs.readdir.mockResolvedValue([]);
      fs.pathExists.mockResolvedValue(false);
    });

    it("should generate a .roomodes file that includes all valid agents and skips invalid ones", async () => {
      fs.readdir.mockResolvedValue(["analyst.md", "dispatcher.md", "no_persona_block.md"]);
      fs.readFile.mockImplementation((filePath) => {
        if (filePath.endsWith("analyst.md")) return Promise.resolve(MOCK_ANALYST_FILE);
        if (filePath.endsWith("dispatcher.md")) return Promise.resolve(MOCK_DISPATCHER_FILE);
        if (filePath.endsWith("no_persona_block.md")) return Promise.resolve(MOCK_NO_PERSONA_BLOCK);
        return Promise.resolve(EXAMPLE_ENV_CONTENT);
      });

      await run();

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(".roomodes"),
        expect.any(String),
        "utf8"
      );
      const writtenContent = fs.writeFile.mock.calls[0][1];

      expect(writtenContent).toMatch(/slug: mary/);
      expect(writtenContent).toMatch(/slug: saul/);
      expect(writtenContent).toMatch(/I am Saul, the AI brain/);
      expect(writtenContent).not.toMatch(/slug: quinn/);
    });
  });
});
