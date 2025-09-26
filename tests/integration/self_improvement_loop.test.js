import { get_failure_patterns } from "../../tools/swarm_intelligence_tools.js";
import path from "path";

let fs;

beforeAll(async () => {
  fs = (await import("fs-extra")).default;
});

describe("Self-Improvement Loop Tools", () => {
  const tempDir = path.resolve(process.cwd(), ".ai", "test_temp_memory_loop");
  let reportsPath;

  beforeAll(async () => {
    await fs.ensureDir(tempDir);
    reportsPath = path.join(tempDir, `reports-${Date.now()}.jsonl`);
    const report1 = JSON.stringify({ root_cause: "null-pointer", tags: ["database"] });
    const report2 = JSON.stringify({ root_cause: "api-timeout", tags: ["api"] });
    const report3 = JSON.stringify({ root_cause: "null-pointer", tags: ["database"] });
    await fs.writeFile(reportsPath, [report1, report2, report3].join("\n"));
  });

  afterAll(async () => {
    await fs.remove(tempDir);
  });

  test("get_failure_patterns should analyze reports and find the most common pattern", async () => {
    const result = await get_failure_patterns({ reportsPath });
    // This should now correctly analyze only the 3 reports created in beforeAll
    expect(result.summary).toBe("Analyzed 3 failures (0 in last 7 days)");
    expect(result.top_patterns.tag).toBe("database (2 occurrences)");
  });
});