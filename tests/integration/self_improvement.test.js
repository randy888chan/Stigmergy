import { get_failure_patterns } from '../../tools/swarm_intelligence_tools.js';
import { appendFile } from '../../tools/file_system.js';
import fs from 'fs-extra';
import path from 'path';

const FAILURE_REPORTS_PATH = path.join(process.cwd(), '.ai', 'swarm_memory', 'failure_reports.jsonl');

describe('Self-Improvement Data Pipeline', () => {

  beforeEach(async () => {
    // Ensure the directory exists and the file is clean before each test
    await fs.ensureDir(path.dirname(FAILURE_REPORTS_PATH));
    await fs.writeFile(FAILURE_REPORTS_PATH, '');
  });

  afterAll(async () => {
    // Clean up the file after all tests are done
    await fs.remove(FAILURE_REPORTS_PATH);
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
    // Use the actual appendFile tool to write to the file
    const content = [bugReport1, bugReport2, bugReport3].map(r => JSON.stringify(r)).join('\n') + '\n';
    await appendFile({ path: FAILURE_REPORTS_PATH, content });

    const analysisResult = await get_failure_patterns();

    // Assert
    expect(analysisResult).toContain("Analyzed 3 failures.");
    expect(analysisResult).toContain("The most common failure pattern (2 times) is related to the tag: 'api'. Recommendation: Investigate issues related to api.");
  });

  test('should handle an empty or non-existent log file gracefully', async () => {
    // Arrange: The file is already empty due to beforeEach

    // Act
    const analysisResult = await get_failure_patterns();

    // Assert
    expect(analysisResult).toBe("No valid failure reports found to analyze.");
  });
});
