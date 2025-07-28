import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import * as fs from "fs-extra";
import path from "path";
import { run } from "../installer/install.js";
import ora from "ora";
import chalk from "chalk";

// Correctly mock fs-extra using a factory. This is the standard pattern.
jest.mock("fs-extra", () => ({
  __esModule: true, // Important for ES modules
  pathExists: jest.fn(),
  copy: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
}));

const MOCK_MANIFEST = `agents:\n  - { id: pm, alias: john }`;
const MOCK_PM_AGENT = '```yaml\nagent:\n  id: "pm"\npersona:\n  identity: "I am a PM."\n```';

describe("Stigmergy Installer", () => {
  let logSpy, errorSpy;
  let oraStartSpy, oraSucceedSpy, oraFailSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Mock ora methods directly
    oraStartSpy = jest.spyOn(ora().start(), "start").mockReturnThis();
    oraSucceedSpy = jest.spyOn(ora().succeed(), "succeed").mockReturnThis();
    oraFailSpy = jest.spyOn(ora().fail(), "fail").mockReturnThis();

    // Mock chalk methods directly
    jest.spyOn(chalk.bold, "green").mockImplementation((s) => s);
    jest.spyOn(chalk.bold, "red").mockImplementation((s) => s);
    jest.spyOn(chalk, "cyan").mockImplementation((s) => s);
    jest.spyOn(chalk, "red").mockImplementation((s) => s);
    jest.spyOn(chalk, "yellow").mockImplementation((s) => s);

    // Configure the mocked functions for fs-extra
    fs.pathExists.mockResolvedValue(true);
    fs.copy.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);
    fs.readFile.mockImplementation((fp) => {
      const fileName = path.basename(fp);
      if (fileName === "02_Agent_Manifest.md") return Promise.resolve(MOCK_MANIFEST);
      if (fileName === "pm.md") return Promise.resolve(MOCK_PM_AGENT);
      return Promise.resolve("`yaml\npersona:\n  identity: 'Default'`");
    });
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    oraStartSpy.mockRestore();
    oraSucceedSpy.mockRestore();
    oraFailSpy.mockRestore();
  });

  it("should generate a .roomodes file", async () => {
    await run();
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(".roomodes"),
      expect.any(String),
      "utf8"
    );
  });

  it("should throw an error on failure", async () => {
    fs.copy.mockRejectedValue(new Error("Permission denied"));
    await expect(run()).rejects.toThrow("Permission denied");
  });
});
