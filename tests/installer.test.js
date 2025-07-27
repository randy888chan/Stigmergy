const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const { run } = require("../installer/install");

// Mock dependencies
jest.mock("fs-extra");
jest.mock("ora", () => {
  const oraInstance = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    text: "",
  };
  return jest.fn(() => oraInstance);
});

// --- MOCK DATA ---
const MOCK_MANIFEST_CONTENT = `
schema_version: 5.2
agents:
  - id: dispatcher
    alias: saul
    name: "Saul (Dispatcher)"
    icon: "🧠"
  - id: pm
    alias: john
    name: "John (PM)"
    icon: "📋"
`;

const MOCK_PM_AGENT_CONTENT = `
\`\`\`yaml
agent:
  id: "pm"
  alias: "john"
  name: "John"
  icon: "📋"
persona:
  identity: "I translate the signed-off Project Brief into an actionable PRD."
  core_protocols:
    - "EVIDENCE_BASED_ARTIFACT_PROTOCOL: I must cite my sources."
\`\`\`
`;

describe("Stigmergy Installer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks
    fs.pathExists.mockResolvedValue(true);
    fs.copy.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    
    // Mock the file reads for manifest and agent definitions
    fs.readFile.mockImplementation((filePath) => {
      const fileName = path.basename(filePath);
      if (fileName === "02_Agent_Manifest.md") {
        return Promise.resolve(MOCK_MANIFEST_CONTENT);
      }
      if (fileName === "pm.md") {
        return Promise.resolve(MOCK_PM_AGENT_CONTENT);
      }
      // Default for other agents like dispatcher
      return Promise.resolve("`yaml\npersona:\n  identity: 'Default persona.'`");
    });
  });

  it("should generate a .roomodes file with system control modes", async () => {
    await run();
    
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(".roomodes"),
      expect.any(String),
      "utf8"
    );
    
    const writtenContent = fs.writeFile.mock.calls[0][1];
    const parsedModes = yaml.load(writtenContent);

    expect(parsedModes.customModes.some(m => m.slug === 'system-start')).toBe(true);
    expect(parsedModes.customModes.some(m => m.slug === 'system-pause')).toBe(true);
    expect(parsedModes.customModes.some(m => m.slug === 'system-resume')).toBe(true);
  });

  it("should generate rich agent personas from their definition files", async () => {
    await run();

    const writtenContent = fs.writeFile.mock.calls[0][1];
    const parsedModes = yaml.load(writtenContent);
    const pmAgentMode = parsedModes.customModes.find(m => m.slug === 'john');

    expect(pmAgentMode).toBeDefined();
    expect(pmAgentMode.roleDefinition).toContain("I translate the signed-off Project Brief");
    expect(pmAgentMode.roleDefinition).toContain("CORE PROTOCOLS");
    expect(pmAgentMode.roleDefinition).toContain("EVIDENCE_BASED_ARTIFACT_PROTOCOL");
  });
});
