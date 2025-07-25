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
    fs.readdir.mockResolvedValue([]);
  });

  it("should successfully run and generate a .roomodes file", async () => {
    // **THE FIX**: Setup the mocks correctly for a successful run.
    fs.readdir.mockResolvedValue(["analyst.md", "invalid.md"]);
    fs.readFile.mockImplementation((filePath) => {
      if (filePath.endsWith("analyst.md")) return Promise.resolve(MOCK_VALID_AGENT_CONTENT);
      if (filePath.endsWith("invalid.md")) return Promise.resolve(MOCK_INVALID_AGENT_CONTENT);
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
    expect(writtenContent).toMatch(/slug: mary/);
    expect(writtenContent).toMatch(/slug: system/);
    expect(writtenContent).not.toMatch(/invalid/); // Ensure the invalid file was skipped
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
