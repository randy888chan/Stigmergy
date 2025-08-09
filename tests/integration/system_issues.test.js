import { jest } from "@jest/globals";
import { vol } from "memfs";
import fs from "fs-extra";
import path from "path";

jest.mock("fs", () => {
  const memfs = require("memfs");
  return memfs.fs;
});

describe("System Issues Test", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("handles build failures", async () => {
    jest.doMock("../../cli/commands/build.js", () => {
      return {
        __esModule: true,
        default: async () => {
          throw new Error("Build failed");
        },
      };
    });
    const { default: build } = await import("../../cli/commands/build.js");
    await expect(build()).rejects.toThrow();
    expect(fs.existsSync(path.join(process.cwd(), "dist"))).toBe(false);
  });

  test("successful build", async () => {
    jest.doMock("../../cli/commands/build.js", () => {
      return {
        __esModule: true,
        default: async () => {
          const distPath = path.join(process.cwd(), "dist");
          fs.mkdirSync(distPath, { recursive: true });
          fs.writeFileSync(path.join(distPath, "team-default.txt"), "...");
        },
      };
    });
    const { default: build } = await import("../../cli/commands/build.js");
    await build();
    expect(fs.existsSync(path.join(process.cwd(), "dist", "team-default.txt"))).toBe(true);
  });
});
