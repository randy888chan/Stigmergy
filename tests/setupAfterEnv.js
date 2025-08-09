// Mock heavy dependencies globally
jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: () => Promise.resolve({ text: () => "MOCK_RESPONSE" }),
    }),
  })),
}));

import { vol } from "memfs";
import fs from "fs-extra";
import path from "path";

let originalCwd;

// Core preservation
beforeAll(() => {
  originalCwd = process.cwd();
  // Create safe test core
  vol.mkdirSync(path.join(originalCwd, "safe-core"), { recursive: true });
  fs.copySync(path.resolve(".stigmergy-core"), path.join(originalCwd, "safe-core"));
});

beforeEach(() => {
  // Start each test with fresh core
  const testProjectPath = path.join(originalCwd, "test-project");
  vol.mkdirSync(testProjectPath, { recursive: true });
  fs.copySync(path.join(originalCwd, "safe-core"), path.join(testProjectPath, ".stigmergy-core"));
  process.chdir(testProjectPath);
});

afterEach(() => {
  process.chdir(originalCwd);
  vol.reset();
});
