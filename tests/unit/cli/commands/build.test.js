jest.mock("fs-extra");
jest.mock("glob");
import fs from "fs-extra";
import { vol } from "memfs";
import { glob } from "glob";
import build from "../../../../cli/commands/build.js";
import path from "path";

describe("Build Command", () => {
  beforeEach(() => {
    vol.reset();
    jest.clearAllMocks();

    fs.readFile.mockImplementation(vol.promises.readFile);
    fs.writeFile.mockImplementation(vol.promises.writeFile);
    fs.readdir.mockImplementation(vol.promises.readdir);
    fs.existsSync.mockImplementation(vol.existsSync);
    fs.ensureDir = jest.fn((path) => vol.promises.mkdir(path, { recursive: true }));
  });

  it("should process both .yml and .yaml team files", async () => {
    const coreDir = path.join(process.cwd(), ".stigmergy-core");
    const distDir = path.join(process.cwd(), "dist");

    const files = {
      [path.join(coreDir, "agent-teams", "team-a.yml")]: "bundle:\n  agents:\n    - agent-1",
      [path.join(coreDir, "agent-teams", "team-b.yaml")]: "bundle:\n  agents:\n    - agent-2",
      [path.join(coreDir, "agents", "agent-1.md")]: "Agent 1 content",
      [path.join(coreDir, "agents", "agent-2.md")]: "Agent 2 content",
      [path.join(coreDir, "templates", "template.md")]: "Template content",
    };
    vol.fromJSON(files, process.cwd());

    // Mock glob to return both yml and yaml files, simulating the new pattern
    const teamsDir = path.join(coreDir, "agent-teams");
    glob.mockImplementation(async (pattern) => {
      if (pattern.includes("agent-teams")) {
        return [
          path.join(teamsDir, "team-a.yml"),
          path.join(teamsDir, "team-b.yaml"),
        ];
      }
      if (pattern.includes("templates")) {
        return [path.join(coreDir, "templates", "template.md")];
      }
      return [];
    });


    await build();

    const distFiles = await fs.readdir(distDir);
    expect(distFiles).toContain("team-a.txt");
    expect(distFiles).toContain("team-b.txt");
  });
});
