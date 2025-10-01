import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { CodeIntelligenceService } from '../../../services/code_intelligence_service.js';
import fs from 'fs-extra';
import path from 'path';

describe('CodeIntelligenceService', () => {
  const testDir = path.join(process.cwd(), 'temp-test-dir');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('_walkDirectory', () => {
    it('should not ignore directories with "node_modules" in their name', async () => {
      const service = new CodeIntelligenceService();

      const nestedDir = path.join(testDir, 'my_node_modules_project');
      await fs.ensureDir(nestedDir);

      const testFile = path.join(nestedDir, 'index.js');
      await fs.writeFile(testFile, 'console.log("hello");');

      const files = await service._walkDirectory(testDir);

      expect(files).toContain(testFile);
    });
  });
});