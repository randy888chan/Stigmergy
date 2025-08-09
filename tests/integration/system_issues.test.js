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

  test("handles build failures and cleans up dist", async () => {
    // Intentionally remove .stigmergy-core to cause a build failure
    await fs.remove(coreDir);

    // Verify the directory is gone before proceeding
    const exists = await fs.pathExists(coreDir);
    expect(exists).toBe(false);

    const { default: build } = await import("../../cli/commands/build.js");

    // Create the dist dir to simulate a partial build
    await fs.ensureDir(distDir);

    await expect(build()).rejects.toThrow("CRITICAL: .stigmergy-core missing - aborting build");
    expect(fs.existsSync(distDir)).toBe(false);
  });

  test("successful build creates dist folder", async () => {
    // The global setup creates a valid .stigmergy-core, so we can just build.
    const { default: build } = await import("../../cli/commands/build.js");
    await build();
    expect(fs.existsSync(path.join(distDir, "team-all.txt"))).toBe(true);
  });
});
