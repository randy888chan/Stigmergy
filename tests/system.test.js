const fs = require("fs-extra");
const path = require("path");
const installer = require("../installer/install");
const { runBuilder } = require("../builder/prompt_builder");

// Provide a complete mock for fs-extra
jest.mock("fs-extra", () => ({
  pathExists: jest.fn(),
  readFile: jest.fn(),
  readdir: jest.fn(),
  writeFile: jest.fn(),
  copy: jest.fn(),
  ensureDir: jest.fn(),
  rm: jest.fn(() => Promise.resolve()),
}));

jest.mock("ora", () => () => ({
  start: () => ({ succeed: jest.fn(), fail: jest.fn(), warn: jest.fn(), text: "" }),
}));

const CWD = process.cwd();

describe("System Install and Build Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.pathExists.mockResolvedValue(false);
  });

  describe("Installer", () => {
    it("should correctly create a new .roomodes file", async () => {
      fs.readdir.mockResolvedValue(["analyst.md"]);
      fs.readFile.mockResolvedValue(
        '```yaml\nagent:\n  id: "analyst"\n  alias: "mary"\n  name: "Mary"\n  icon: "📊"\n```'
      );

      await installer.run();

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(CWD, ".roomodes"),
        expect.stringContaining('"slug": "mary"'),
        "utf8"
      );
    });
  });

  describe("Builder", () => {
    it("should build a complete team bundle", async () => {
      // THIS IS THE FIX: The mock data now uses the correct, unambiguous path convention.
      const teamYml = "agents:\n  - mary";
      const maryMd = "I am Mary and I use `templates/brief.md`"; // No './'
      const briefMd = "Brief template.";

      const fileSystem = {
        // Use path.join to create OS-agnostic paths for the mock
        [path.join(process.cwd(), ".stigmergy-core", "agent-teams", "test-team.yml")]: teamYml,
        [path.join(process.cwd(), ".stigmergy-core", "agents", "mary.md")]: maryMd,
        [path.join(process.cwd(), ".stigmergy-core", "templates", "brief.md")]: briefMd,
        [path.join(process.cwd(), ".stigmergy-core", "utils", "web-agent-startup-instructions.md")]:
          "startup",
      };

      // Mock fs-extra functions to use our virtual file system
      fs.pathExists.mockImplementation((p) => Promise.resolve(!!fileSystem[p]));
      fs.readFile.mockImplementation((p) => Promise.resolve(fileSystem[p]));
      fs.readdir.mockResolvedValue(["test-team.yml"]);

      await runBuilder({ team: "test-team" });

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(CWD, "dist", "teams", "test-team.txt"),
        expect.stringContaining("Brief template."), // This will now pass
        "utf8"
      );
    });
  });
});
