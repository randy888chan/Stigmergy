const fs = require("fs-extra");
const path = require("path");
const installer = require("../installer/install");

// Mock the dependencies
jest.mock("fs-extra");
jest.mock("ora", () => () => ({
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  warn: jest.fn().mockReturnThis(),
  text: "",
}));

const CWD = process.cwd();

describe("Stigmergy Installer", () => {
  beforeEach(() => {
    // CRITICAL FIX: Reset all mocks and provide default safe values before each test.
    // This prevents tests from interfering with each other.
    jest.clearAllMocks();
    fs.pathExists.mockResolvedValue(false);
    fs.copy.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);
    // Default to no agent files found to prevent "not iterable" error in tests
    // that don't care about agent parsing.
    fs.readdir.mockResolvedValue([]);
  });

  it("should copy core files and .env.example if .env does not exist", async () => {
    fs.pathExists.mockResolvedValue(false); // .env does NOT exist
    await installer.run();
    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining(".stigmergy-core"),
      path.join(CWD, ".stigmergy-core"),
      { overwrite: true }
    );
    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining(".env.example"),
      path.join(CWD, ".env.example"),
      { overwrite: false }
    );
  });

  it("should NOT copy .env.example if .env already exists", async () => {
    fs.pathExists.mockImplementation((p) => Promise.resolve(p === path.join(CWD, ".env")));
    await installer.run();
    expect(fs.copy).not.toHaveBeenCalledWith(
      expect.stringContaining(".env.example"),
      expect.any(String),
      expect.any(Object)
    );
  });

  it("should correctly generate a .roomodes file with valid agents", async () => {
    // Test-specific mocks
    fs.readdir.mockResolvedValue(["analyst.md", "dev.md"]);
    fs.readFile.mockImplementation((filePath) => {
      if (filePath.endsWith("analyst.md")) {
        return Promise.resolve(
          "```yaml\nagent:\n  id: analyst\n  alias: mary\n  name: Mary\n  icon: '📊'\n```\nPersona for Mary."
        );
      }
      if (filePath.endsWith("dev.md")) {
        return Promise.resolve(
          "```yml\nagent:\n  id: dev\n  alias: james\n  name: James\n  icon: '💻'\n```\nPersona for James."
        );
      }
      return Promise.reject("File not found");
    });

    await installer.run();

    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(CWD, ".roomodes"),
      expect.any(String),
      "utf8"
    );

    const writtenContent = fs.writeFile.mock.calls[0][1];
    // CRITICAL FIX: Check for the correct JSON string format.
    expect(writtenContent).toContain('"slug": "system"');
    expect(writtenContent).toContain('"slug": "saul"');
    expect(writtenContent).toContain('"slug": "mary"');
    expect(writtenContent).toContain('"slug": "james"');
    expect(writtenContent).toContain('"roleDefinition": "Persona for Mary."');
  });

  it("should handle and skip malformed agent files gracefully", async () => {
    // Test-specific mocks
    fs.readdir.mockResolvedValue(["malformed.md", "good-agent.md"]);
    fs.readFile.mockImplementation((filePath) => {
      if (filePath.endsWith("malformed.md")) {
        return Promise.resolve("This file has no yaml block.");
      }
      if (filePath.endsWith("good-agent.md")) {
        return Promise.resolve(
          "```yaml\nagent:\n  id: qa\n  alias: quinn\n  name: Quinn\n  icon: '🛡️'\n```\nPersona for Quinn."
        );
      }
      return Promise.reject("File not found");
    });

    await installer.run();

    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(CWD, ".roomodes"),
      expect.any(String),
      "utf8"
    );

    const writtenContent = fs.writeFile.mock.calls[0][1];
    // It should contain the default agents AND the one good agent.
    expect(writtenContent).toContain('"slug": "system"');
    expect(writtenContent).toContain('"slug": "quinn"');
    // It should NOT contain anything about a malformed agent.
    expect(writtenContent).not.toContain("malformed");
  });
});
