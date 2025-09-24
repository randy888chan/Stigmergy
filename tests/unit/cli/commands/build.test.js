import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('fs-extra', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  readdir: jest.fn(),
  existsSync: jest.fn(),
  ensureDir: jest.fn(),
  default: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    existsSync: jest.fn(),
    ensureDir: jest.fn(),
  }
}));

jest.unstable_mockModule('glob', () => ({
    glob: jest.fn(),
}));

jest.unstable_mockModule('../../../../cli/utils/output_formatter.js', () => ({
    OutputFormatter: {
        section: jest.fn(),
        step: jest.fn(),
        info: jest.fn(),
        warning: jest.fn(),
        success: jest.fn(),
        summary: jest.fn(),
        table: jest.fn(),
        error: jest.fn(),
    }
}));

describe("Build Command", () => {
    let fs;
    let glob;
    let build;

  beforeEach(async() => {
    jest.clearAllMocks();
    fs = (await import('fs-extra')).default;
    glob = (await import('glob')).glob;
    build = (await import('../../../../cli/commands/build.js')).default;
  });

  it("should process a valid team file and create a bundle", async () => {
    const teamFilePath = '/app/.stigmergy-core/agent-teams/team-alpha.yml';
    const agentFilePath = '/app/.stigmergy-core/agents/agent1.md';
    const teamFileContent = `
bundle:
  name: Alpha Bundle
  agents:
    - agent1
`;
    const agentFileContent = 'This is agent1 content.';

    // Mock glob to differentiate between team and template searches
    glob.mockImplementation(async (pattern) => {
        if (pattern.includes('agent-teams')) {
            return [teamFilePath];
        }
        if (pattern.includes('templates')) {
            return []; // No templates for this test
        }
        return [];
    });

    fs.readFile
        .mockResolvedValueOnce(teamFileContent) // For the team file
        .mockResolvedValueOnce(agentFileContent); // For the agent file
    fs.existsSync.mockReturnValue(true);
    fs.writeFile.mockResolvedValue();
    fs.ensureDir.mockResolvedValue();

    await build();

    expect(glob).toHaveBeenCalledWith(expect.stringContaining('agent-teams'));
    expect(glob).toHaveBeenCalledWith(expect.stringContaining('templates'));
    expect(fs.readFile).toHaveBeenCalledWith(teamFilePath, 'utf8');
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('dist/team-alpha.txt'),
        expect.stringContaining('This is agent1 content.'),
        'utf8'
    );
  });
});
