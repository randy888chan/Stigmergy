import { jest } from "@jest/globals";
import { vol } from "memfs";
import fs from "fs-extra";
import path from "path";

describe("System Issues Test", () => {
  // Use TEST_CORE_PATH instead of real core
  const coreDir = process.env.TEST_CORE_PATH || path.join(process.cwd(), ".stigmergy-core-test");
  const distDir = path.join(process.cwd(), "dist");

  beforeEach(async () => {
    // Only clean dist directory
    await fs.remove(distDir);
  });

  test("handles missing .stigmergy-core gracefully", async () => {
    // Mock fs.pathExists to simulate .stigmergy-core not existing
    const pathExistsSpy = jest.spyOn(fs, "pathExists").mockResolvedValue(false);

    const { default: build } = await import("../../cli/commands/build.js");

    // The build should not throw an error
    await expect(build()).resolves.toBe(true);

    // It should create a dist directory with a README but no agents.json
    expect(fs.existsSync(distDir)).toBe(true);
    expect(fs.existsSync(path.join(distDir, "README.md"))).toBe(true);
    expect(fs.existsSync(path.join(distDir, "agents.json"))).toBe(false);

    // Restore the original function
    pathExistsSpy.mockRestore();
  });

  test("successful build creates agents.json", async () => {
    // The global setup creates a valid .stigmergy-core, so we can just build.
    const { default: build } = await import("../../cli/commands/build.js");
    await build();
    expect(fs.existsSync(path.join(distDir, "agents.json"))).toBe(true);
    expect(fs.existsSync(path.join(distDir, "system_docs", "02_Agent_Manifest.md"))).toBe(true);
  });
});
