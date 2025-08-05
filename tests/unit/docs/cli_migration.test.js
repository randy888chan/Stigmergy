import fs from "fs";
import path from "path";

describe("CLI Migration Documentation", () => {
  const filePath = path.join(process.cwd(), "docs", "CLI_MIGRATION.md");

  it("should exist in docs directory", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("should contain migration table", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("| Legacy Command");
    expect(content).toContain("@system setup project");
    expect(content).toContain("Deprecation Timeline");
  });

  it("should cover all legacy commands", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    const commands = [
      "npx stigmergy install",
      "npm run stigmergy:start",
      "npx stigmergy build",
      "npm run test:neo4j",
      "npx stigmergy dashboard",
    ];

    commands.forEach((cmd) => {
      expect(content).toContain(cmd);
    });
  });
});
