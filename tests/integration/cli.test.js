import fs from "fs-extra";
import path from "path";
import { install } from "../../cli/commands/install.js";

beforeEach(async () => {
  // Create clean test environment
  const coreDir = "./.stigmergy-core";
  await fs.emptyDir(coreDir);
  const agentsDir = path.join(coreDir, "agents");
  await fs.ensureDir(agentsDir);
  await fs.ensureDir(path.join(coreDir, "system_docs"));

  // Create a dummy agent file
  const dummyAgentContent = `
\`\`\`yaml
agent:
  id: "test-agent"
  name: "Test Agent"
  alias: "@test"
  persona:
    role: "A test agent"
\`\`\`
`;
  await fs.writeFile(path.join(agentsDir, "test-agent.md"), dummyAgentContent);

  await fs.copy(
    path.resolve(__dirname, "./fixtures/valid-manifest.md"),
    path.join(coreDir, "system_docs/02_Agent_Manifest.md")
  );
});

afterAll(async () => {
  await fs.remove("./.roomodes");
});

describe("install command", () => {
  it("should create .roomodes file", async () => {
    await install();
    const roomodesPath = path.join(process.cwd(), ".roomodes");
    expect(await fs.pathExists(roomodesPath)).toBe(true);
  });
});
