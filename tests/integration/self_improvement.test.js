import { get_failure_patterns } from '../../tools/swarm_intelligence_tools.js';
import { appendFile } from '../../tools/file_system.js';
import fs from 'fs-extra';
import path from 'path';
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';

const TEMP_REPORTS_DIR = path.join(process.cwd(), '.ai', 'test_temp_memory');

describe('Self-Improvement Data Pipeline', () => {
  let tempReportsPath;

  beforeEach(async () => {
    // Create a unique temp file for each test
    tempReportsPath = path.join(TEMP_REPORTS_DIR, `failures-${Date.now()}.jsonl`);
    await fs.ensureDir(TEMP_REPORTS_DIR);
    await fs.writeFile(tempReportsPath, '');
  });

  afterEach(async () => {
    // Clean up the unique file after each test
    await fs.remove(tempReportsPath);
  });

  afterAll(async () => {
    // Clean up the temp directory
    await fs.remove(TEMP_REPORTS_DIR);
  });

  test('should correctly identify the most common failure pattern from the log file', async () => {
    // Arrange
    const bugReport1 = {
      bug_summary: "API call fails for users in EU region.",
      root_cause: "Missing geo-location headers in the request.",
      resolution: "Added necessary headers to the API client.",
      tags: ["api", "networking"]
    };
    const bugReport2 = {
      bug_summary: "Database query times out under heavy load.",
      root_cause: "Inefficient query without proper indexing.",
      resolution: "Added a new index to the 'users' table.",
      tags: ["database", "performance"]
    };
    const bugReport3 = {
      bug_summary: "Another API call issue.",
      root_cause: "Incorrect endpoint URL.",
      resolution: "Corrected the URL.",
      tags: ["api"]
    };

    // Act
    // Use the actual appendFile tool to write to the temp file
    const content = [bugReport1, bugReport2, bugReport3].map(r => JSON.stringify(r)).join('\n') + '\n';
    await appendFile({ path: tempReportsPath, content });

    const analysisResult = await get_failure_patterns({ reportsPath: tempReportsPath });

    // Assert
    expect(analysisResult.summary).toContain("Analyzed 3 failures");
    expect(analysisResult.top_patterns.tag).toContain("api (2 occurrences)");
  });

  test('should handle an empty or non-existent log file gracefully', async () => {
    // Arrange: The file is already empty due to beforeEach

    // Act
    const analysisResult = await get_failure_patterns({ reportsPath: tempReportsPath });

    // Assert
    expect(analysisResult).toBe("No failure reports logged yet.");
  });
});
