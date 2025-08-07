import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { configureIde } from "../../cli/commands/install.js";
import build from "../../cli/commands/build.js";

const CWD = process.cwd();
const TEST_DIR = path.join(CWD, "test-project-cli");

describe.skip("CLI Commands Direct Call", () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
    await fs.copy(path.resolve(CWD, ".stigmergy-core"), path.join(TEST_DIR, ".stigmergy-core"));
    process.chdir(TEST_DIR);
  });

  afterEach(async () => {
    process.chdir(CWD);
    await fs.remove(TEST_DIR);
  });

  it("configureIde should generate a correct .roomodes file", async () => {
    const roomodesPath = path.join(TEST_DIR, ".roomodes");
    const coreSourceDir = path.join(TEST_DIR, ".stigmergy-core");

    await configureIde(coreSourceDir, roomodesPath);

    expect(await fs.pathExists(roomodesPath)).toBe(true);

    const roomodesContent = await fs.readFile(roomodesPath, "utf8");
    const roomodesData = yaml.load(roomodesContent);

    expect(roomodesData.customModes).toBeDefined();
    const saul = roomodesData.customModes.find((m) => m.slug === "saul");
    expect(saul).toBeDefined();
    expect(saul.name).toBe("🧠 Saul");
    const roleDefContent = saul.roleDefinition;
    const yamlMatch = roleDefContent.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
    const agentData = yaml.load(yamlMatch[1]);
    expect(agentData.agent.id).toBe("dispatcher");
    expect(saul.groups).toEqual(["read", "edit", "command"]);
  });

  it("build command should generate a correct dist bundle", async () => {
    await build();

    const distPath = path.join(TEST_DIR, "dist");
    expect(await fs.pathExists(distPath)).toBe(true);

    const bundleFiles = await fs.readdir(distPath);
    expect(bundleFiles.length).toBeGreaterThan(0);
    expect(bundleFiles.some((f) => f.endsWith(".txt"))).toBe(true);
  });
});
