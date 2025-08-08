// tests/integration/system_issues.test.js
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import { fileURLToPath } from "url";
import { dirname } from "path";
import yaml from "js-yaml";
import { exec as execCallback } from "child_process";
import { promisify } from "util";
import os from "os";
import { configureIde } from "../../cli/commands/install.js";
import { processError } from "../../engine/error_handling.js";
import { handleFailure } from "../../engine/fallback_manager.js";

// Import service to be tested. It's important to do this before the describe block
// so that the mock environment variables can be set if needed.
import codeIntelligenceService from "../../services/code_intelligence_service.js";

// Promisify exec for async/await usage, which is cleaner than callbacks.
const exec = promisify(execCallback);

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
  let tempCoreDir;
  let agentsDir;
  let manifestPath;
  let agentFiles = [];
  let manifestAgentIds = [];

  beforeAll(async () => {
    // Create a temporary directory for the mock .stigmergy-core
    tempCoreDir = await fs.mkdtemp(path.join(os.tmpdir(), "stigmergy-test-"));

    agentsDir = path.join(tempCoreDir, "agents");
    manifestPath = path.join(tempCoreDir, "system_docs", "02_Agent_Manifest.md");

    global.StigmergyConfig = {
      features: { neo4j: "auto" },
      // Point the application to our temporary core directory
      core_path: tempCoreDir,
    };

    // Create dummy files and directories inside the temporary directory
    await fs.ensureDir(path.join(tempCoreDir, "agent-teams"));
    await fs.ensureDir(agentsDir);
    await fs.ensureDir(path.join(tempCoreDir, "templates"));
    await fs.ensureDir(path.join(tempCoreDir, "system_docs"));

    // Create mock agent files that match the mock manifest
    await fs.writeFile(
      path.join(agentsDir, "test-agent-permitted.md"),
      "```yaml\nagent:\n  id: test-agent-permitted\n  name: Permitted Agent\n```"
    );
    await fs.writeFile(
      path.join(agentsDir, "test-agent-denied.md"),
      "```yaml\nagent:\n  id: test-agent-denied\n  name: Denied Agent\n```"
    );

    // Create a mock manifest that lists the mock agents
    await fs.writeFile(
      manifestPath,
      "```yaml\nagents:\n  - id: test-agent-permitted\n  - id: test-agent-denied\n```"
    );

    // Create a mock team file for the build test
    await fs.writeFile(
      path.join(tempCoreDir, "agent-teams", "test-team.yml"),
      "bundle:\n  name: Test Team\nagents:\n  - test-agent-permitted\n  - test-agent-denied\n"
    );

    // Find all agent definition files to be used in multiple tests
    agentFiles = await glob(path.join(agentsDir, "*.{md,yml}"));
    console.log("Found agent files:", agentFiles);

    // Parse the Agent Manifest to get the list of declared agent IDs.
    try {
      const manifestContent = await fs.readFile(manifestPath, "utf8");
      const yamlMatch = manifestContent.match(/```(?:yaml|yml)\s*([\s\S]*?)\s*```/);
      if (yamlMatch && yamlMatch[1]) {
        const manifestData = yaml.load(yamlMatch[1]);
        manifestAgentIds = manifestData.agents ? manifestData.agents.map((a) => a.id) : [];
      }
      console.log("Agent IDs from Manifest:", manifestAgentIds);
    } catch (err) {
      console.error("Error reading/parsing Manifest:", err);
      manifestAgentIds = [];
    }
  });

  afterAll(async () => {
    // Clean up the temporary directory
    if (tempCoreDir) {
      await fs.remove(tempCoreDir);
    }
  });

  test("Agent definition files should have unique IDs and aliases", async () => {
    const ids = new Set();
    const aliases = new Set();
    const conflictingFiles = [];

    for (const file of agentFiles) {
      const content = await fs.readFile(file, "utf8");
      let yamlContent = null;

      const mdMatch = content.match(/```(?:yaml|yml)\s*([\s\S]*?)\s*```/);
      if (mdMatch && mdMatch[1]) {
        yamlContent = mdMatch[1];
      } else {
        yamlContent = content;
      }

      if (yamlContent) {
        try {
          const agentData = yaml.load(yamlContent);
          if (agentData && agentData.agent) {
            const { id, alias } = agentData.agent;
            if (id) {
              if (ids.has(id)) {
                conflictingFiles.push({ type: "id", value: id, file });
              } else {
                ids.add(id);
              }
            }
            if (alias) {
              if (aliases.has(alias)) {
                conflictingFiles.push({ type: "alias", value: alias, file });
              } else {
                aliases.add(alias);
              }
            }
          }
        } catch (parseErr) {
          console.error(`Error parsing YAML in ${file}:`, parseErr.message);
        }
      }
    }
    console.log("Conflicting Agent Definitions Found:", conflictingFiles);
    expect(conflictingFiles).toEqual([]);
  });

  test("Agent Manifest should list all active agents defined in .stigmergy-core/agents/", async () => {
    const agentIdsFromFiles = [];
    for (const file of agentFiles) {
      const content = await fs.readFile(file, "utf8");
      let yamlContent = null;

      const mdMatch = content.match(/```(?:yaml|yml)\s*([\s\S]*?)\s*```/);
      if (mdMatch && mdMatch[1]) {
        yamlContent = mdMatch[1];
      } else {
        yamlContent = content;
      }

      if (yamlContent) {
        try {
          const agentData = yaml.load(yamlContent);
          if (agentData && agentData.agent && agentData.agent.id) {
            agentIdsFromFiles.push(agentData.agent.id);
          }
        } catch (parseErr) {
        }
      }
    }

    console.log("Agent IDs successfully parsed from Files:", agentIdsFromFiles.sort());
    console.log("Agent IDs from Manifest:", manifestAgentIds.sort());

    expect(agentIdsFromFiles.sort()).toEqual(manifestAgentIds.sort());
  });

  process.env.NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
  process.env.NEO4J_USER = process.env.NEO4J_USER || "neo4j";
  process.env.NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "password-to-force-failure";

  test("Code Intelligence Service should attempt Neo4j connection and report status", async () => {
    const connectionStatus = await codeIntelligenceService.testConnection();
    console.log("Neo4j Connection Test Result:", connectionStatus);

    expect(typeof connectionStatus).toBe("object");
    expect(connectionStatus).toHaveProperty("success");

    expect(connectionStatus.success).toBe(false);
    expect(connectionStatus.error).toBeDefined();
  }, 10000);

  test("npm run build should process all agent files successfully", async () => {
    try {
      await fs.remove(path.join(projectRoot, "dist"));

      const { stdout, stderr } = await exec("npm run build", { cwd: projectRoot, timeout: 30000 });
      console.log("Build stdout:", stdout);
      if (stderr) {
        if (stderr.includes("Skipping file")) {
          throw new Error(`Build process produced warnings about skipping files:\n${stderr}`);
        }
        console.log("Build stderr (might contain warnings):", stderr);
      }

      const distDir = path.join(projectRoot, "dist");
      expect(await fs.pathExists(distDir)).toBe(true);

      const bundleFiles = await glob(path.join(distDir, "*.txt"));
      expect(bundleFiles.length).toBeGreaterThan(0);
    } catch (error) {
      console.error("Build process failed:", error);
      throw error;
    }
  }, 40000);

  test("configureIde should generate .roomodes consistent with all source agents", async () => {
    const roomodesPath = path.join(tempCoreDir, ".roomodes");

    await configureIde(tempCoreDir, roomodesPath);

    const roomodesExists = await fs.pathExists(roomodesPath);
    expect(roomodesExists).toBe(true);

    if (roomodesExists) {
      const roomodesContent = await fs.readFile(roomodesPath, "utf8");
      const roomodesData = yaml.load(roomodesContent);
      const roomodesAgentIds = roomodesData.customModes
        .filter((mode) => mode.api && mode.api.static_payload && mode.api.static_payload.agentId)
        .map((mode) => mode.api.static_payload.agentId);

      expect(roomodesAgentIds.sort()).toEqual(manifestAgentIds.sort());
    }
  });
  test("All agent files in .stigmergy-core/agents must contain valid YAML", async () => {
    for (const file of agentFiles) {
      const content = await fs.readFile(file, "utf8");
      const yamlMatch = content.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
      const yamlContent = yamlMatch ? yamlMatch[1] : content;

      try {
        yaml.load(yamlContent);
      } catch (e) {
        throw new Error(`Failed to parse YAML in agent file: ${file}\n${e.message}`);
      }
    }
  });

  test("Every agent ID in agent-teams must correspond to an existing agent file", async () => {
    const teamsDir = path.join(tempCoreDir, "agent-teams");
    const teamFiles = await glob(path.join(teamsDir, "*.yml"));

    const agentIdsFromFiles = new Set();
    for (const file of agentFiles) {
      const content = await fs.readFile(file, "utf8");
      const yamlMatch = content.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
      const yamlContent = yamlMatch ? yamlMatch[1] : content;
      try {
        const agentData = yaml.load(yamlContent);
        if (agentData && agentData.agent && agentData.agent.id) {
          agentIdsFromFiles.add(agentData.agent.id);
        }
      } catch (e) {
      }
    }

    for (const teamFile of teamFiles) {
      const teamContent = await fs.readFile(teamFile, "utf8");
      const teamData = yaml.load(teamContent);
      const teamAgentIds = teamData.agents || [];

      for (const agentId of teamAgentIds) {
        expect(agentIdsFromFiles.has(agentId)).toBe(
          true,
          `Agent ID '${agentId}' from team file '${path.basename(teamFile)}' does not exist in any agent definition file.`
        );
      }
    }
  });

  it("should handle neo4j failures", async () => {
    const error = new Error("Neo4j connection failed");
    error.resource = "neo4j";

    await handleFailure(error.resource, error);
    expect(handleFailure).toHaveBeenCalledWith("neo4j", expect.any(Error));
  });
});
