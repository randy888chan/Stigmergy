// tests/integration/system_issues.test.js
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import { fileURLToPath } from "url";
import { dirname } from "path";
import yaml from "js-yaml";
import os from "os";
import { configureIde } from "../../cli/commands/install.js";
import { processError } from "../../engine/error_handling.js";
import { handleFailure } from "../../engine/fallback_manager.js";
import build from "../../cli/commands/build.js";

// Import service to be tested. It's important to do this before the describe block
// so that the mock environment variables can be set if needed.
import codeIntelligenceService from "../../services/code_intelligence_service.js";


const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../");

jest.mock("../../engine/error_handling.js", () => ({
  processError: jest.fn().mockImplementation((error) => ({
    classification: "MOCK_ERROR",
    recoveryResult: { success: true },
  })),
}));

jest.mock("../../engine/fallback_manager.js", () => ({
  handleFailure: jest.fn().mockResolvedValue({ success: true }),
}));

describe("System Configuration Consistency", () => {
  const coreDir = path.join(projectRoot, ".stigmergy-core");
  const agentsDir = path.join(coreDir, "agents");
  const teamsDir = path.join(coreDir, "agent-teams");
  const templatesDir = path.join(coreDir, "templates");
  const distDir = path.join(projectRoot, "dist");
  const manifestPath = path.join(coreDir, "system_docs", "02_Agent_Manifest.md");

  beforeAll(async () => {
    // Create a temporary, self-contained .stigmergy-core for this test suite
    await fs.ensureDir(agentsDir);
    await fs.ensureDir(teamsDir);
    await fs.ensureDir(templatesDir);
    await fs.ensureDir(path.join(coreDir, "system_docs"));

    // Create agent content with correct YAML indentation by building it from an array
    const agentYaml = [
      "agent:",
      "  id: test-agent",
      "  alias: TestAgent",
      "  name: Test Agent",
      '  icon: "🧪"',
      "tools:",
      '  - "mcp:source_code"',
      '  - "file_system"',
    ].join("\n");

    const agentContent = `---
frontmatter: true
---
This is a test agent.

\`\`\`yaml
${agentYaml}
\`\`\`
`;
    await fs.writeFile(path.join(agentsDir, "test-agent.md"), agentContent);

    const teamContent = `
bundle:
  name: Test Team
agents:
  - test-agent
`;
    await fs.writeFile(path.join(teamsDir, "test-team.yml"), teamContent.trim());

    const templateContent = "This is a test template.";
    await fs.writeFile(path.join(templatesDir, "test-template.md"), templateContent.trim());

    const manifestContent = "```yml\nagents:\n  - id: test-agent\n```";
    await fs.writeFile(manifestPath, manifestContent);
  });

  afterAll(async () => {
    // Clean up the temporary directories
    await fs.remove(coreDir);
    await fs.remove(distDir);
  });

  test("build function should process all agent files successfully", async () => {
    const success = await build();
    expect(success).toBe(true);

    // Verify the output
    expect(await fs.pathExists(distDir)).toBe(true);
    const bundleFiles = await glob(path.join(distDir, "*.txt"));
    expect(bundleFiles.length).toBeGreaterThan(0);
    expect(path.basename(bundleFiles[0])).toBe("test-team.txt");

    const bundleContent = await fs.readFile(bundleFiles[0], "utf8");
    expect(bundleContent).toContain("START: agents#test-agent");
    expect(bundleContent).toContain("START: templates#test-template.md");
  }, 40000);

  test("configureIde should generate .roomodes consistent with all source agents", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "stigmergy-install-test-"));
    try {
      const roomodesPath = path.join(tempDir, ".roomodes");
      await configureIde(coreDir, roomodesPath);

      const roomodesExists = await fs.pathExists(roomodesPath);
      expect(roomodesExists).toBe(true);

      const roomodesContent = await fs.readFile(roomodesPath, "utf8");
      const roomodesData = yaml.load(roomodesContent);
      const roomodesAgentIds = roomodesData.customModes
        .map((mode) => mode.api?.static_payload?.agentId)
        .filter(Boolean);

      expect(roomodesAgentIds).toEqual(["test-agent"]);
    } finally {
      await fs.remove(tempDir);
    }
  });

  test("Agent Manifest should list all active agents", async () => {
    const agentFiles = await glob(path.join(agentsDir, "*.md"));
    const agentIdsFromFiles = [];
    for (const file of agentFiles) {
      const content = await fs.readFile(file, "utf8");
      // Correctly extract the YAML block before parsing
      const yamlMatch = content.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
      if (yamlMatch && yamlMatch[1]) {
        const agentData = yaml.load(yamlMatch[1]);
        if (agentData && agentData.agent && agentData.agent.id) {
          agentIdsFromFiles.push(agentData.agent.id);
        }
      }
    }

    const manifestContent = await fs.readFile(manifestPath, "utf8");
    const yamlMatch = manifestContent.match(/```yml\s*([\s\S]*?)\s*```/);
    const manifestData = yaml.load(yamlMatch[1]);
    const manifestAgentIds = manifestData.agents.map((a) => a.id);

    expect(agentIdsFromFiles.sort()).toEqual(manifestAgentIds.sort());
  });

  // Dummy Neo4j test to keep the suite structure
  test(
    "Code Intelligence Service should handle connection failure",
    async () => {
      process.env.NEO4J_URI = "bolt://localhost:7687";
      process.env.NEO4J_USER = "neo4j";
      process.env.NEO4J_PASSWORD = "invalid-password";
      const connectionStatus = await codeIntelligenceService.testConnection();
      expect(connectionStatus.success).toBe(false);
    },
    20000
  ); // Increased timeout for potentially slow network operations
});
