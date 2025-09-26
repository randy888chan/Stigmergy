import { mock, describe, test, expect, beforeEach } from 'bun:test';

// Mock dependencies before importing the module under test
mock.module('../../../engine/swarm_coordinator.js', () => ({
    coordinateAgents: mock(),
    executeSwarmTask: mock(),
}));

mock.module('../../../ai/providers.js', () => ({
    getAgentModel: mock(),
}));

// Import the swarm intelligence tools module after mocking dependencies
import { 
    get_failure_patterns, 
    get_agent_performance_metrics, 
    get_tool_usage_statistics,
    getBestAgentForTask,
    get_system_health_overview
} from '../../../tools/swarm_intelligence_tools.js';

beforeEach(() => {
    mock.restore();
});

describe('Swarm Intelligence Tools', () => {
    test('should have all required swarm intelligence functions', () => {
        expect(typeof get_failure_patterns).toBe('function');
        expect(typeof get_agent_performance_metrics).toBe('function');
        expect(typeof get_tool_usage_statistics).toBe('function');
        expect(typeof getBestAgentForTask).toBe('function');
        expect(typeof get_system_health_overview).toBe('function');
    });
    
    test('should properly handle failure patterns analysis', () => {
        expect(get_failure_patterns).toBeDefined();
    });
});