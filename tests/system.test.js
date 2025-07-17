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

      // THIS IS THE FIX: The test now checks for the correct filename.
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(CWD, ".roomodes.js"),
        expect.stringContaining('"slug": "mary"'),
        "utf8"
      );
    });
  });

  describe("Builder", () => {
    it("should build a complete team bundle", async () => {
      const teamYml = "agents:\n  - mary";
      const maryMd = "I am Mary and I use `templates/brief.md`";
      const briefMd = "Brief template.";

      const fileSystem = {
        [path.join(__dirname, "..", ".stigmergy-core", "agent-teams", "test-team.yml")]: teamYml,
        [path.join(__dirname, "..", ".stigmergy-core", "agents", "mary.md")]: maryMd,
        [path.join(__dirname, "..", ".stigmergy-core", "templates", "brief.md")]: briefMd,
        [path.join(
          __dirname,
          "..",
          ".stigmergy-core",
          "utils",
          "web-agent-startup-instructions.md"
        )]: "startup",
      };

      fs.pathExists.mockImplementation((p) => Promise.resolve(!!fileSystem[p]));
      fs.readFile.mockImplementation((p) => Promise.resolve(fileSystem[p]));
      fs.readdir.mockResolvedValue(["test-team.yml"]);

      await runBuilder({ team: "test-team" });

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(CWD, "dist", "teams", "test-team.txt"),
        expect.stringContaining("Brief template."),
        "utf8"
      );
    });
  });
});
