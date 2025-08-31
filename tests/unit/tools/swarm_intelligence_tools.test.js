import fs from "fs/promises";
import { get_failure_patterns, getBestAgentForTask } from "../../../tools/swarm_intelligence_tools.js";

jest.mock("fs/promises");

describe("Swarm Intelligence Tools", () => {
  describe("get_failure_patterns", () => {
    beforeEach(() => {
      fs.readFile.mockClear();
    });

    test("should return the most common failure pattern", async () => {
      const data = [
        { tags: ["db", "query"] },
        { tags: ["api", "timeout"] },
        { tags: ["db", "connection"] },
        { tags: ["db", "query"] },
      ].map(JSON.stringify).join("\n");
      fs.readFile.mockResolvedValue(data);
      const result = await get_failure_patterns();
      expect(result).toBe("Analyzed 4 failures. Most common pattern (3 times) is tag: 'db'.");
    });

    test("should handle an empty file", async () => {
      fs.readFile.mockResolvedValue("");
      const result = await get_failure_patterns();
      expect(result).toBe("No failure reports logged yet.");
    });

    test("should handle failures with no tags", async () => {
        const data = [
            { error: "some error" },
            { error: "another error" },
          ].map(JSON.stringify).join("\n");
        fs.readFile.mockResolvedValue(data);
        const result = await get_failure_patterns();
        expect(result).toBe("Analyzed 2 failures, but no common tags.");
    });

    test("should handle the case where the file does not exist", async () => {
      fs.readFile.mockRejectedValue({ code: "ENOENT" });
      const result = await get_failure_patterns();
      expect(result).toBe("No failure reports logged yet.");
    });

    test("should handle errors during file reading", async () => {
        fs.readFile.mockRejectedValue(new Error("Read error"));
        const result = await get_failure_patterns();
        expect(result).toBe("Error analyzing patterns: Read error");
    });

    test("should handle invalid JSON in the file", async () => {
        fs.readFile.mockResolvedValue("invalid json\n" + JSON.stringify({tags: ["a"]}));
        const result = await get_failure_patterns();
        expect(result).toBe("Analyzed 1 failures. Most common pattern (1 times) is tag: 'a'.");
    });
  });

  describe("getBestAgentForTask", () => {
    test("should return the default recommendation", async () => {
      const result = await getBestAgentForTask({ task_type: "test-task" });
      expect(result).toBe("Default agent is recommended for 'test-task'.");
    });
  });
});
