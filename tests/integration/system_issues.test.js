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
      const outputPath = path.join(projectRoot, "dist", "agents.json");
      const builtAgents = await fs.readJson(outputPath);
      const agentFileCount = agentFiles.length;

      console.log(`Found ${agentFileCount} agent files. Built ${builtAgents.length} agents.`);
      expect(builtAgents.length).toBe(agentFileCount);
    } catch (error) {
      console.error("Build process failed:", error);
      // Fail the test explicitly if the build command throws an error.
      throw error;
    }
  }, 40000);

  test("npx stigmergy install should generate .roomodes consistent with all source agents", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "stigmergy-install-test-"));
    console.log("Testing install in temp dir:", tempDir);

    try {
      const installCommand = `node ${path.join(projectRoot, "cli/index.js")} install`;
      const { stdout, stderr } = await exec(installCommand, { cwd: tempDir, timeout: 30000 });
      console.log("Install stdout:", stdout);
      if (stderr && stderr.includes("Skipping file")) {
        throw new Error(`Install process produced warnings about skipping files:\n${stderr}`);
      }
      if (stderr) console.log("Install stderr:", stderr);

      const roomodesPath = path.join(tempDir, ".roomodes");
      const roomodesExists = await fs.pathExists(roomodesPath);
      expect(roomodesExists).toBe(true);

      if (roomodesExists) {
        const roomodesContent = await fs.readFile(roomodesPath, "utf8");
        const roomodesData = JSON.parse(roomodesContent);
        const roomodesAgentIds = roomodesData.map((item) => item.id);

        // Get the canonical list of agent IDs from the source directory, not the temp one.
        // This ensures the install script isn't just consistent with its own flawed copy.
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
            // If source files have errors, this test might reflect that.
            // The primary test for this is the build test, but this is a good secondary check.
          }
        }

        console.log("Agent IDs from Source Files:", sourceAgentIds.sort());
        console.log("Agent IDs from .roomodes:", roomodesAgentIds.sort());

        // The generated .roomodes file should contain all agents that can be successfully parsed.
        // We compare against the successfully parsed sourceAgentIds.
        expect(roomodesAgentIds.sort()).toEqual(sourceAgentIds.sort());
      }
    } finally {
      await fs.remove(tempDir);
      console.log("Cleaned up temp dir:", tempDir);
    }
  }, 60000);
});
