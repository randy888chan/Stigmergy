import { get_failure_patterns } from "../../tools/swarm_intelligence_tools.js";
import fs from "fs-extra";
import path from "path";

describe("Self-Improvement Loop Tools", () => {
  const memoryDir = path.resolve(process.cwd(), ".ai", "swarm_memory");
  const reportsPath = path.join(memoryDir, "failure_reports.jsonl");

  beforeAll(async () => {
    await fs.ensureDir(memoryDir);
    const report1 = JSON.stringify({ root_cause: "null-pointer", tags: ["database"] });
    const report2 = JSON.stringify({ root_cause: "api-timeout", tags: ["api"] });
    const report3 = JSON.stringify({ root_cause: "null-pointer", tags: ["database"] });
    await fs.writeFile(reportsPath, [report1, report2, report3].join("\n"));
  });

  afterAll(async () => {
    await fs.remove(reportsPath);
  });

  test("get_failure_patterns should analyze reports and find the most common pattern", async () => {
    const result = await get_failure_patterns();
    // Updated to match the actual implementation which returns an object
    expect(result.summary).toBe("Analyzed 3 failures (0 in last 7 days)");
    expect(result.top_patterns.tag).toBe("database (2 occurrences)");
  });
});