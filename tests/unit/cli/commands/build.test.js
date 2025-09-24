import { mock, describe, it, expect, beforeEach } from 'bun:test';

mock.module('fs-extra', () => ({
  readFile: mock(),
  writeFile: mock(),
  readdir: mock(),
  existsSync: mock(),
  ensureDir: mock(),
  default: {
    readFile: mock(),
    writeFile: mock(),
    readdir: mock(),
    existsSync: mock(),
    ensureDir: mock(),
  }
}));

mock.module('glob', () => ({
    glob: mock(),
}));

mock.module('../../../../cli/utils/output_formatter.js', () => ({
    OutputFormatter: {
        section: mock(),
        step: mock(),
        info: mock(),
        warning: mock(),
        success: mock(),
        summary: mock(),
        table: mock(),
        error: mock(),
    }
}));

describe("Build Command", () => {
    let fs;
    let glob;
    let build;

  beforeEach(async() => {
    mock.restore();
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
