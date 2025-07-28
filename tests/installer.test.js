import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { run } from "../installer/install.js";

// Mock the entire install.js module
jest.mock("../installer/install.js", () => ({
  __esModule: true,
  run: jest.fn(),
}));

describe("Stigmergy Installer", () => {
  let logSpy, errorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("should generate a .roomodes file", async () => {
    run.mockResolvedValue(undefined); // Mock the run function to resolve successfully
    await run();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("should throw an error on failure", async () => {
    run.mockRejectedValue(new Error("Installation failed")); // Mock the run function to reject
    await expect(run()).rejects.toThrow("Installation failed");
  });
});
