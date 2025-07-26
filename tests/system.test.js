const fs = require("fs-extra");
const path = require("path");
const { run } = require("../installer/install");

// Mock dependencies
jest.mock("fs-extra");
jest.mock("ora", () => {
  const oraInstance = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    text: "",
  };
  return jest.fn(() => oraInstance);
});
jest.mock("chalk", () => ({
  yellow: (str) => str,
  bold: { green: (str) => str, red: (str) => str },
  cyan: (str) => str,
  red: (str) => str,
}));

// --- MOCK DATA ---
const MOCK_VALID_AGENT_CONTENT = `
\`\`\`yaml
agent:
  id: "analyst"
  alias: "mary"
  name: "Mary Analyst"
  icon: "📊"
persona:
  identity: "I am Mary."
\`\`\`
`;
const MOCK_INVALID_AGENT_CONTENT = `invalid content`;

describe("Stigmergy Installer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks
    fs.pathExists.mockResolvedValue(true);
    fs.copy.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    // **THE FIX**: Ensure readdir ALWAYS returns an array.
    fs.readFile.mockResolvedValue(""); // Default mock for readFile
  });

  it("should successfully run and generate a .roomodes file", async () => {
    // Mock the agent manifest file
    const MOCK_AGENT_MANIFEST_CONTENT = `
schema_version: 5.1

agents:
  - id: dispatcher
    alias: saul
    name: Dispatcher
    icon: "🚀"
  - id: analyst
    alias: mary
    name: Analyst
    icon: "📊"
  - id: pm
    alias: john
    name: Project Manager
    icon: "📝"
`;

    fs.readFile.mockImplementation((filePath) => {
      if (filePath.includes("02_Agent_Manifest.md")) {
        return Promise.resolve(MOCK_AGENT_MANIFEST_CONTENT);
      }
      return Promise.resolve("");
    });

    await run();

    // Verify it wrote the file
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(".roomodes"),
      expect.any(String),
      "utf8"
    );

    // Verify the content is correct
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toMatch(/slug: saul/);
    expect(writtenContent).toMatch(/slug: mary/);
    expect(writtenContent).toMatch(/slug: john/);
    expect(writtenContent).toMatch(/slug: system/);
  });

  it("should handle exceptions gracefully", async () => {
    // Force an error to occur
    fs.copy.mockRejectedValue(new Error("Permission denied"));

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await run();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error:"),
      "Permission denied"
    );

    consoleErrorSpy.mockRestore();
  });
});
