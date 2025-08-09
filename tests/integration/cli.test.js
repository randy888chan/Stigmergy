import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { install } from "../../cli/commands/install.js";

const testCliCorePath = path.join(process.cwd(), ".test-cli-core");

beforeEach(async () => {
  // This test suite needs a completely isolated, clean core.
  await fs.emptyDir(testCliCorePath);
  const agentsDir = path.join(testCliCorePath, "agents");
  const systemDocsDir = path.join(testCliCorePath, "system_docs");
  await fs.ensureDir(agentsDir);
  await fs.ensureDir(systemDocsDir);

  // Create a valid dummy agent file
  const dummyAgentContent = `\`\`\`yaml
agent:
  id: "test-agent"
  name: "Test Agent"
  alias: "@test"
  persona:
    role: "A test agent"
  core_protocols:
    - "protocol1"
\`\`\`
`;
  await fs.writeFile(path.join(agentsDir, "test-agent.md"), dummyAgentContent);

  // Create a minimal manifest that ONLY includes the dummy agent
  const minimalManifest = {
    agents: [{ id: "test-agent" }],
  };
  const manifestPath = path.join(systemDocsDir, "02_Agent_Manifest.md");
  const yamlString = yaml.dump(minimalManifest);
  await fs.writeFile(manifestPath, "```yaml\n" + yamlString + "\n```");
});

afterAll(async () => {
  await fs.remove("./.roomodes");
  await fs.remove(testCliCorePath); // Clean up the isolated core
});

describe("install command", () => {
  beforeAll(() => {
    // Override global config to point to the isolated core for this test suite
    global.StigmergyConfig = { core_path: testCliCorePath };
  });

  it("should create .roomodes file", async () => {
    const result = await install();
    expect(result).toBe(true);
    const roomodesPath = path.join(process.cwd(), ".roomodes");
    expect(await fs.pathExists(roomodesPath)).toBe(true);
  });
});
