const fs = require("fs-extra");
const path = require("path");
const installer = require("../installer/install");

// Mock the dependencies
jest.mock("fs-extra");
jest.mock("ora", () => () => ({
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  text: "",
}));

const CWD = process.cwd();

describe("Stigmergy Installer", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Default mock implementations
    fs.pathExists.mockResolvedValue(false);
    fs.copy.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);
  });

  it("should copy core files and .env.example if .env does not exist", async () => {
    fs.pathExists.mockResolvedValue(false); // Mocks that .env does NOT exist
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
    fs.pathExists.mockImplementation((p) => {
        // Return true only for the .env check
        return Promise.resolve(p === path.join(CWD, ".env"));
    });
    await installer.run();
    // Verify that the .env.example copy call was NOT made
    expect(fs.copy).not.toHaveBeenCalledWith(
      expect.stringContaining(".env.example"),
      expect.any(String),
      expect.any(Object)
    );
  });

  it("should correctly generate a .roomodes file with valid agents", async () => {
    // Mock the agent files that will be read
    fs.readdir.mockResolvedValue(["analyst.md", "dev.md", "invalid.txt"]);
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

    // Check that writeFile was called for .roomodes
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(CWD, ".roomodes"),
      expect.any(String),
      "utf8"
    );

    // Check the content of the written file
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('slug: "system"');
    expect(writtenContent).toContain('slug: "saul"');
    expect(writtenContent).toContain('slug: "mary"');
    expect(writtenContent).toContain('slug: "james"');
    expect(writtenContent).toContain('roleDefinition: "Persona for Mary."');
  });

  it("should handle and skip malformed agent files gracefully", async () => {
    fs.readdir.mockResolvedValue(["malformed.md"]);
    fs.readFile.mockResolvedValue("This file has no yaml block.");

    // We expect the installer to run without throwing a fatal error
    await expect(installer.run()).resolves.not.toThrow();
    
    // It should still write a .roomodes file with the default system agents
     expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(CWD, ".roomodes"),
      expect.stringContaining('slug: "system"'),
      "utf8"
    );
  });
});
