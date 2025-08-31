import agentPerformance from '../../../engine/agent_performance.js';
import fs from 'fs-extra';
import path from 'path';

// Mock the fs-extra module
jest.mock('fs-extra');

describe('AgentPerformance', () => {
  const metricsPath = path.join(process.cwd(), '.ai', 'agent_metrics');
  const indexPath = path.join(metricsPath, 'index.json');

  const getMockIndex = () => ({
    version: '1.0',
    agents: {},
    taskTypes: {},
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Provide default mock implementations
    fs.ensureDir.mockResolvedValue();
    fs.pathExists.mockResolvedValue(true);
    fs.writeJson.mockResolvedValue();
    fs.readJson.mockResolvedValue(getMockIndex());
  });

  describe('initialize', () => {
    it('should create metrics directory and index if they do not exist', async () => {
      fs.pathExists.mockResolvedValue(false); // Mock that index.json does not exist

      await agentPerformance.initialize();

      expect(fs.ensureDir).toHaveBeenCalledWith(metricsPath);
      expect(fs.pathExists).toHaveBeenCalledWith(indexPath);
      expect(fs.writeJson).toHaveBeenCalledWith(indexPath, getMockIndex());
    });

    it('should not create index if it already exists', async () => {
      fs.pathExists.mockResolvedValue(true); // Mock that index.json exists

      await agentPerformance.initialize();

      expect(fs.writeJson).not.toHaveBeenCalled();
    });
  });

  describe('_calculateQualityScore', () => {
    it('should calculate score based on technical and business verification', () => {
      const task = {
        verification: {
          technical: { confidenceScore: 0.8 },
          business: { confidenceScore: 0.9 },
        },
      };
      const score = agentPerformance._calculateQualityScore(task);
      expect(score).toBeCloseTo(0.8 * 0.6 + 0.9 * 0.4); // 0.48 + 0.36 = 0.84
    });

    it('should adjust score based on protocol adherence', () => {
      const task = {
        protocolAdherence: 0.9,
      };
      const score = agentPerformance._calculateQualityScore(task);
       // Base score is 0.7
      expect(score).toBeCloseTo(0.7 * 0.7 + 0.9 * 0.3); // 0.49 + 0.27 = 0.76
    });

    it('should handle missing verification and adherence data', () => {
        const task = {};
        const score = agentPerformance._calculateQualityScore(task);
        expect(score).toBe(0.7); // Base score
      });
  });

  describe('recordTaskCompletion', () => {
    it('should record metrics and update the index correctly for a new agent', async () => {
      const task = {
        id: 'task-1',
        assignedTo: 'agent-1',
        type: 'coding',
        startedAt: 1000,
        completedAt: 2000,
        status: 'COMPLETED',
        projectSize: 'small',
        complexity: 'low',
      };

      const qualityScore = agentPerformance._calculateQualityScore(task);
      await agentPerformance.recordTaskCompletion(task);

      // Check that the task metric file was written
      expect(fs.writeJson).toHaveBeenCalledWith(
        path.join(metricsPath, 'task-1.json'),
        expect.any(Object)
      );

      // Check that the index was updated
      const finalIndex = fs.writeJson.mock.calls[1][1]; // Get the second call to writeJson
      expect(finalIndex.agents['agent-1']).toEqual({
        totalTasks: 1,
        successfulTasks: 1,
        averageDuration: 1000,
        averageQuality: qualityScore,
        successRate: 1,
        taskTypes: {
          coding: {
            count: 1,
            successCount: 1,
            averageDuration: 1000,
            averageQuality: qualityScore,
            successRate: 1,
          },
        },
      });
      expect(finalIndex.taskTypes['coding'].bestAgent).toBe('agent-1');
    });
  });

  describe('getAgentMetrics', () => {
    it('should return metrics for an existing agent', async () => {
      const mockIndex = getMockIndex();
      mockIndex.agents['agent-1'] = { totalTasks: 1 };
      fs.readJson.mockResolvedValue(mockIndex);

      const metrics = await agentPerformance.getAgentMetrics('agent-1');
      expect(metrics).toEqual({ totalTasks: 1 });
    });

    it('should return null for a non-existent agent', async () => {
      const metrics = await agentPerformance.getAgentMetrics('agent-nonexistent');
      expect(metrics).toBeNull();
    });
  });

  describe('getBestAgentForTask', () => {
    it('should return the best agent for a task type', async () => {
      const mockIndex = getMockIndex();
      mockIndex.taskTypes['coding'] = { bestAgent: 'agent-1' };
      fs.readJson.mockResolvedValue(mockIndex);

      const bestAgent = await agentPerformance.getBestAgentForTask('coding');
      expect(bestAgent).toBe('agent-1');
    });

    it('should return null if the task type is unknown', async () => {
        const bestAgent = await agentPerformance.getBestAgentForTask('unknown-type');
        expect(bestAgent).toBeNull();
    });
  });

  describe('getPerformanceInsights', () => {
    it('should generate insights for underperforming agents', async () => {
      const mockIndex = getMockIndex();
      mockIndex.agents['agent-1'] = { totalTasks: 10, successRate: 0.5 };
      fs.readJson.mockResolvedValue(mockIndex);

      const insights = await agentPerformance.getPerformanceInsights();
      expect(insights).toHaveLength(1);
      expect(insights[0].type).toBe('AGENT_PERFORMANCE');
      expect(insights[0].target).toBe('agent-1');
    });

    it('should generate insights for problematic task types', async () => {
        const mockIndex = getMockIndex();
        mockIndex.taskTypes['testing'] = { averageSuccessRate: 0.4 };
        fs.readJson.mockResolvedValue(mockIndex);
  
        const insights = await agentPerformance.getPerformanceInsights();
        expect(insights).toHaveLength(1);
        expect(insights[0].type).toBe('TASK_TYPE_ISSUE');
        expect(insights[0].target).toBe('testing');
      });

      it('should return an empty array when performance is good', async () => {
        const mockIndex = getMockIndex();
        mockIndex.agents['agent-1'] = { totalTasks: 10, successRate: 0.9 };
        mockIndex.taskTypes['coding'] = { averageSuccessRate: 0.9 };
        fs.readJson.mockResolvedValue(mockIndex);
  
        const insights = await agentPerformance.getPerformanceInsights();
        expect(insights).toHaveLength(0);
      });
  });
});
