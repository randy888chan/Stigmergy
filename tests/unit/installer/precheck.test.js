import { checkWindowsPermissions } from "../../../installer/precheck.js";
import fs from "fs";
import { jest } from "@jest/globals";

describe("Windows Permission Checks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(fs, "accessSync").mockImplementation(() => {});
  });

  it("should skip check on non-Windows platforms", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    const result = checkWindowsPermissions();
    expect(result.valid).toBe(true);
    expect(result.skip).toBe(true);
  });

  it("should pass with write permissions", () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    const result = checkWindowsPermissions();
    expect(result.valid).toBe(true);
    expect(fs.accessSync).toHaveBeenCalledWith(process.cwd(), fs.constants.W_OK);
  });

  it("should fail without write permissions", () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    fs.accessSync.mockImplementation(() => {
      throw new Error("Permission denied");
    });

    const result = checkWindowsPermissions();
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Administrator");
    expect(result.fix).toContain("Right-click");
  });
});
