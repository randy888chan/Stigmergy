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

// Import service to be tested. It's important to do this before the describe block
// so that the mock environment variables can be set if needed.
import codeIntelligenceService from "../../services/code_intelligence_service.js";

// Promisify exec for async/await usage, which is cleaner than callbacks.
const exec = promisify(execCallback);

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../");

describe("System Configuration Consistency", () => {
  const agentsDir = path.join(projectRoot, ".stigmergy-core", "agents");
  const manifestPath = path.join(
    projectRoot,
    ".stigmergy-core",
    "system_docs",
    "02_Agent_Manifest.md"
  );

  let agentFiles = [];
  let manifestAgentIds = [];

  beforeAll(async () => {
    // Find all agent definition files to be used in multiple tests.
    agentFiles = await glob(path.join(agentsDir, "*.{md,yml}"));
    console.log("Found agent files:", agentFiles);

    // Parse the Agent Manifest to get the list of declared agent IDs.
    try {
      const manifestContent = await fs.readFile(manifestPath, "utf8");
      // The manifest is also a markdown file with a YAML fence.
      const yamlMatch = manifestContent.match(/```yml\s*([\s\S]*?)\s*```/);
      if (yamlMatch && yamlMatch[1]) {
        const yamlContent = yamlMatch[1];
        const manifestData = yaml.load(yamlContent);
        manifestAgentIds = manifestData.agents ? manifestData.agents.map((a) => a.id) : [];
      }
      // No else, if it's not a fenced file, it's not a valid manifest for this project.
      console.log("Agent IDs from Manifest:", manifestAgentIds);
    } catch (err) {
      console.error("Error reading/parsing Manifest:", err);
      manifestAgentIds = []; // Ensure it's an empty array on error
    }
  });

  test("Agent definition files should have unique IDs and aliases", async () => {
    const ids = new Set();
    const aliases = new Set();
    const conflictingFiles = [];

    for (const file of agentFiles) {
      const content = await fs.readFile(file, "utf8");
      let yamlContent = null;

      // The agent files can be either pure YAML, or markdown with a YAML fence.
      // This logic handles both cases.
      const mdMatch = content.match(/```yml\s*([\s\S]*?)\s*```/);
      if (mdMatch && mdMatch[1]) {
        yamlContent = mdMatch[1];
      } else {
        // If no markdown fence is found, assume the whole file is YAML.
        // The js-yaml `load` function can handle files with or without `---` delimiters.
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

      // The agent files can be either pure YAML, or markdown with a YAML fence.
      // This logic handles both cases.
      const mdMatch = content.match(/```yml\s*([\s\S]*?)\s*```/);
      if (mdMatch && mdMatch[1]) {
        yamlContent = mdMatch[1];
      } else {
        // If no markdown fence is found, assume the whole file is YAML.
        // The js-yaml `load` function can handle files with or without `---` delimiters.
        yamlContent = content;
      }

      if (yamlContent) {
        try {
          const agentData = yaml.load(yamlContent);
          if (agentData && agentData.agent && agentData.agent.id) {
            agentIdsFromFiles.push(agentData.agent.id);
          }
        } catch (parseErr) {
          // We expect parsing to fail for some files, so we don't log it here as an error.
          // The build test will handle the failure.
        }
      }
    }

    // For clearer debugging
    console.log("Agent IDs successfully parsed from Files:", agentIdsFromFiles.sort());
    console.log("Agent IDs from Manifest:", manifestAgentIds.sort());

    // Stricter check: The list of IDs from successfully parsed files and the manifest should be identical.
    expect(agentIdsFromFiles.sort()).toEqual(manifestAgentIds.sort());
  });

  // Set dummy env vars for this specific test if .env isn't ready
  process.env.NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
  process.env.NEO4J_USER = process.env.NEO4J_USER || "neo4j";
  process.env.NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "password-to-force-failure";

  test("Code Intelligence Service should attempt Neo4j connection and report status", async () => {
    const connectionStatus = await codeIntelligenceService.testConnection();
    console.log("Neo4j Connection Test Result:", connectionStatus);

    // The service should return a status object.
    expect(typeof connectionStatus).toBe("object");
    expect(connectionStatus).toHaveProperty("success");

    // In this misconfigured test setup, we expect the connection to fail.
    expect(connectionStatus.success).toBe(false);
    expect(connectionStatus.error).toBeDefined();
  }, 10000);

  test("npm run build should process all agent files successfully", async () => {
    try {
      // Clean previous build artifacts
      await fs.remove(path.join(projectRoot, "dist"));

      const { stdout, stderr } = await exec("npm run build", { cwd: projectRoot, timeout: 30000 });
      console.log("Build stdout:", stdout);
      if (stderr) {
        // Fail the test if there are any warnings about skipping files.
        // This makes the test sensitive to silent failures.
        if (stderr.includes("Skipping file")) {
          throw new Error(`Build process produced warnings about skipping files:\n${stderr}`);
        }
        console.log("Build stderr (might contain warnings):", stderr);
      }

      // Verify the output
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
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "stigmergy-install-test-"));
    console.log("Testing configureIde in temp dir:", tempDir);

    try {
      const coreSourceDir = path.join(projectRoot, ".stigmergy-core");
      const roomodesPath = path.join(tempDir, ".roomodes");

      await configureIde(coreSourceDir, roomodesPath);

      const roomodesExists = await fs.pathExists(roomodesPath);
      expect(roomodesExists).toBe(true);

      if (roomodesExists) {
        const roomodesContent = await fs.readFile(roomodesPath, "utf8");
        const roomodesData = yaml.load(roomodesContent);
        const roomodesAgentIds = roomodesData.customModes
          .filter((mode) => mode.api && mode.api.static_payload && mode.api.static_payload.agentId)
          .map((mode) => mode.api.static_payload.agentId);

        const sourceAgentIds = [];
        for (const file of agentFiles) {
          const content = await fs.readFile(file, "utf8");
          const mdMatch = content.match(/```yml\s*([\s\S]*?)\s*```/);
          let yamlContent = mdMatch ? mdMatch[1] : content;
          try {
            const agentData = yaml.load(yamlContent);
            if (agentData && agentData.agent && agentData.agent.id) {
              sourceAgentIds.push(agentData.agent.id);
            }
          } catch (e) {
            // ignore
          }
        }

        expect(roomodesAgentIds.sort()).toEqual(sourceAgentIds.sort());
      }
    } finally {
      await fs.remove(tempDir);
      console.log("Cleaned up temp dir:", tempDir);
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
        // Using a custom message to provide more context in the test failure output
        throw new Error(`Failed to parse YAML in agent file: ${file}\n${e.message}`);
      }
    }
  });

  test("Every agent ID in agent-teams must correspond to an existing agent file", async () => {
    const teamsDir = path.join(projectRoot, ".stigmergy-core", "agent-teams");
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
        // Ignore parsing errors here, another test handles that
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
});
