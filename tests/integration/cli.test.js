import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const CWD = process.cwd();
const TEST_DIR = path.join(CWD, "test-project");
const CLI_PATH = path.resolve(CWD, "cli/index.js");

describe("CLI Commands", () => {
  beforeAll(async () => {
    // The .stigmergy-core directory needs to be in the root for the tests to run
    const sourceStigmergyDir = path.resolve(CWD, ".stigmergy-core");
    if (!(await fs.pathExists(sourceStigmergyDir))) {
      console.error("This test requires the .stigmergy-core directory to be in the project root.");
      process.exit(1);
    }
  });

  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
    // Copy the .stigmergy-core to the test directory to simulate a real project
    await fs.copy(path.resolve(CWD, ".stigmergy-core"), path.join(TEST_DIR, ".stigmergy-core"));
    process.chdir(TEST_DIR);
  });

  afterEach(async () => {
    process.chdir(CWD);
    await fs.remove(TEST_DIR);
  });

  it("should generate a correct .roomodes file", async () => {
    const { stdout, stderr } = await execAsync(`node ${CLI_PATH} install`);
    console.log(stdout);
    console.error(stderr);

    const roomodesPath = path.join(TEST_DIR, ".roomodes");
    expect(await fs.pathExists(roomodesPath)).toBe(true);

    const roomodesContent = await fs.readFile(roomodesPath, "utf8");
    const roomodesData = yaml.load(roomodesContent);

    expect(roomodesData.customModes).toBeDefined();
    expect(roomodesData.customModes.length).toBeGreaterThan(0);

    const saul = roomodesData.customModes.find((m) => m.slug === "saul");
    expect(saul).toBeDefined();
    expect(saul.name).toBe("🧠 Saul");
    expect(saul.roleDefinition).toBe("AI System Orchestrator");
    expect(saul.groups).toEqual(["read", "edit", "mcpsource: project"]);
  }, 20000); // Increase timeout for exec

  it("should generate a correct dist bundle", async () => {
    const { stdout, stderr } = await execAsync(`node ${CLI_PATH} build`);
    console.log(stdout);
    console.error(stderr);

    const distPath = path.join(TEST_DIR, "dist");
    expect(await fs.pathExists(distPath)).toBe(true);

    const bundlePath = path.join(distPath, "team-business-crew.txt");
    expect(await fs.pathExists(bundlePath)).toBe(true);

    const bundleContent = await fs.readFile(bundlePath, "utf8");
    expect(bundleContent).toContain("# Web Agent Bundle: Team Business Crew (Web-Safe)");
    expect(bundleContent).toContain(
      "==================== START: agents#business_planner ===================="
    );
    expect(bundleContent).toContain("**Role**: Strategic Business Planner & Financial Modeler");
    expect(bundleContent).toContain(
      "==================== START: templates#business-workflow.md ===================="
    );
  }, 20000); // Increase timeout for exec
});
