const fs = require("fs-extra");
const path = require("path");
const installer = require("../installer/install");
const { runBuilder } = require("../builder/prompt_builder");

// Mock dependencies to avoid actual file system operations
jest.mock("fs-extra");
jest.mock("ora", () => {
  const ora = jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    text: "",
  }));
  return ora;
});

const CWD = process.cwd();

describe("System Build and Install Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Installer", () => {
    it("should create a new .roomodes file if one does not exist", async () => {
      // Setup: No .roomodes file exists
      fs.pathExists.mockResolvedValue(false);
      fs.readdir.mockResolvedValue(["analyst.md"]);
      fs.readFile.mockResolvedValue(`
        \`\`\`yaml
        agent:
          id: "analyst"
          alias: "mary"
          name: "Mary"
          icon: "📊"
        \`\`\`
      `);

      await installer.run();

      // Assert: writeFile was called to create a new .roomodes file
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(CWD, ".roomodes"),
        expect.stringContaining("module.exports"),
        "utf8"
      );
      // Assert: The created file contains the Pheromind markers and config
      const writtenContent = fs.writeFile.mock.calls[0][1];
      expect(writtenContent).toContain("// --- PHEROMIND MODES START ---");
      expect(writtenContent).toContain('"slug": "mary"');
      expect(writtenContent).toContain("// --- PHEROMIND MODES END ---");
    });

    it("should safely update an existing .roomodes file", async () => {
      const existingContent = `module.exports = { customModes: [{ slug: 'existing' }] };`;
      // Setup: .roomodes exists
      fs.pathExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValueOnce(existingContent); // For reading existing
      fs.readdir.mockResolvedValue(["analyst.md"]);
      fs.readFile.mockResolvedValueOnce(`
        \`\`\`yaml
        agent:
          id: "analyst"
          alias: "mary"
          name: "Mary"
          icon: "📊"
        \`\`\`
      `);

      await installer.run();

      // Assert: writeFile was called to update the file
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(CWD, ".roomodes"),
        expect.any(String),
        "utf8"
      );
      // Assert: The new content contains both the old and new modes
      const writtenContent = fs.writeFile.mock.calls[0][1];
      expect(writtenContent).toContain(`slug: 'existing'`); // Preserved
      expect(writtenContent).toContain('"slug": "mary"'); // Added
    });
  });

  describe("Builder", () => {
    it("should build a complete team bundle with unique dependencies", async () => {
      // Setup: Mock team, agents, and dependencies
      const mockTeamYml = `
        bundle:
          name: "Mock Team"
        agents:
          - mary
          - winston
      `;
      const maryAgentMd = "I am Mary. I use `templates/project-brief-tmpl.md`.";
      const winstonAgentMd = "I am Winston. I use `templates/project-brief-tmpl.md` and `checklists/architect-checklist.md`.";
      const briefTmplMd = "This is the project brief template.";
      const architectChecklistMd = "This is the architect checklist.";

      // Mock file system reads
      fs.pathExists.mockResolvedValue(true);
      const readMocks = {
        [path.resolve(CWD, "dist")]: true,
        [path.join(CWD, ".stigmergy-core", "agent-teams", "mock-team.yml")]: mockTeamYml,
        [path.join(CWD, ".stigmergy-core", "agents", "mary.md")]: maryAgentMd,
        [path.join(CWD, ".stigmergy-core", "agents", "winston.md")]: winstonAgentMd,
        [path.join(CWD, ".stigmergy-core", "templates", "project-brief-tmpl.md")]: briefTmplMd,
        [path.join(CWD, ".stigmergy-core", "checklists", "architect-checklist.md")]: architectChecklistMd,
      };
      fs.readFile.mockImplementation((filePath) => Promise.resolve(readMocks[filePath]));
      fs.readdir.mockResolvedValue(["mock-team.yml"]); // For listTeams

      // Run the builder for the mock team
      await runBuilder({ team: "mock-team" });

      // Assert: A single bundle file was written
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(CWD, "dist", "teams", "mock-team.txt"),
        expect.any(String),
        "utf8"
      );

      // Assert: The bundle contains content from all unique files
      const bundleContent = fs.writeFile.mock.calls[0][1];
      expect(bundleContent).toContain("I am Mary.");
      expect(bundleContent).toContain("I am Winston.");
      expect(bundleContent).toContain("This is the project brief template.");
      expect(bundleContent).toContain("This is the architect checklist.");

      // Assert: The shared dependency (brief template) only appears once
      const briefOccurrences = (bundleContent.match(/This is the project brief template./g) || []).length;
      expect(briefOccurrences).toBe(1);
    });
  });
});
