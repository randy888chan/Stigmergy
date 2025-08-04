import { EnhancedError, withRetry } from "../../utils/errorHandler.js";

describe("errorHandler", () => {
  describe("EnhancedError", () => {
    it("should create an error with custom properties", () => {
      const error = new EnhancedError("test message", "TestError", "run tests");
      expect(error.message).toBe("test message");
      expect(error.type).toBe("TestError");
      expect(error.remediation).toBe("run tests");
    });
  });

  describe("withRetry", () => {
    it("should retry a function that fails", async () => {
      const fn = jest.fn();
      fn.mockRejectedValueOnce(new Error("fail"));
      fn.mockRejectedValueOnce(new Error("fail"));
      fn.mockResolvedValueOnce("success");

      const retriedFn = withRetry(fn, 3, 10);
      await expect(retriedFn()).resolves.toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should throw an error after max retries", async () => {
      const fn = jest.fn();
      fn.mockRejectedValue(new Error("fail"));

      const retriedFn = withRetry(fn, 3, 10);
      await expect(retriedFn()).rejects.toThrow("fail");
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });
});
