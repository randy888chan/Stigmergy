const fs = require('fs-extra');
const path = require('path');
const DependencyResolver = require('../builder/dependency_resolver');

// Mock dependencies
jest.mock('fs-extra');

describe('Pheromind System Tests', () => {

    describe('Build Process', () => {
        const MOCK_CORE_DIR = '/mock/.stigmergy-core';
        let resolver;

        beforeEach(() => {
            resolver = new DependencyResolver('/mock');
            fs.__setMockFiles({
                [path.join(MOCK_CORE_DIR, 'agents/mary.md')]: 'Hello, my task is defined in `tasks/create-brief.md`.',
                [path.join(MOCK_CORE_DIR, 'tasks/create-brief.md')]: 'This is the briefing task.',
            });
        });

        test('DependencyResolver should find direct dependencies', async () => {
            const deps = await resolver.resolveAgentDependencies('mary');
            expect(deps.resources.length).toBe(1);
            expect(deps.resources.relativePath).toBe('tasks/create-brief.md');
            expect(deps.resources.content).toBe('This is the briefing task.');
        });
    });

    // A placeholder for the uninterruptible protocol test
    describe('Agent Protocol', () => {
        test.skip('Agent should treat mid-task chat as commentary', () => {
            // 1. Mock the state to show agent 'james' is on 'task-123'.
            // 2. Mock the llmAdapter.getCompletion function.
            // 3. Call the interactive server endpoint with a new prompt for 'james'.
            // 4. Assert that the prompt passed to getCompletion was prefixed with the "CONTEXT: ..." message.
            expect(true).toBe(true); // Placeholder
        });
    });
});
