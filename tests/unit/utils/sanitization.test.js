import { sanitizeToolCall } from "../../../utils/sanitization.js";
import { OperationalError } from "../../../utils/errorHandler.js";

describe("Input Sanitization", () => {
  it("should allow safe tool calls", () => {
    const safeArgs = sanitizeToolCall("file_system.readFile", {
      path: "src/index.js",
    });
    expect(safeArgs.path).toBe("src/index.js");
  });

  it("should sanitize string arguments", () => {
    const safeArgs = sanitizeToolCall("research.deep_dive", {
      query: "test; rm -rf / | dangerous",
    });
    expect(safeArgs.query).toBe("test rm -rf /  dangerous");
  });

  it("should block restricted tools", () => {
    expect(() => {
      sanitizeToolCall("shell.execute", {
        command: "ls",
      });
    }).toThrow("Restricted tool access");
  });

  it("should preserve non-string arguments", () => {
    const safeArgs = sanitizeToolCall("gemini.execute", {
      prompt: "safe",
      options: { temperature: 0.7 },
    });
    expect(safeArgs.options.temperature).toBe(0.7);
  });
});
