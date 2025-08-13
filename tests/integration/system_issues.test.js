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

  test("successful build creates agent team bundles", async () => {
    // The global setup creates a valid .stigmergy-core, so we can just build.
    const { default: build } = await import("../../cli/commands/build.js");
    await build();
    // Check for one of the expected output files
    expect(fs.existsSync(path.join(distDir, "team-all.txt"))).toBe(true);
  });
});
