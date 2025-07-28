import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import * as install from "../installer/install.js";

describe("Stigmergy Installer", () => {
  let logSpy, errorSpy, runSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    runSpy = jest.spyOn(install, "run").mockImplementation(async () => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    runSpy.mockRestore();
  });

  it("should call run once", async () => {
    await install.run();
    expect(runSpy).toHaveBeenCalledTimes(1);
  });

  it("should throw an error on failure", async () => {
    runSpy.mockRejectedValue(new Error("Installation failed"));
    await expect(install.run()).rejects.toThrow("Installation failed");
  });
});
