import trajectoryRecorder from '../../../services/trajectory_recorder.js';
import * as fs from 'fs-extra';
import path from 'path';

describe.skip('Trajectory Recorder Integration', () => {
  let recordingId;
  const testTaskId = 'test_task_123';
  const testContext = { test: 'context' };

  beforeEach(() => {
    // Clear any existing recordings
    trajectoryRecorder.recordings.clear();
  });

  afterEach(() => {
    // Clean up any created files from both new and legacy directories
    const directoriesToClean = [
      path.join(process.cwd(), '.stigmergy', 'trajectories'),
      path.join(process.cwd(), '.stigmergy-core', 'trajectories')
    ];

    directoriesToClean.forEach(trajectoryDir => {
      if (fs.existsSync(trajectoryDir)) {
        const files = fs.readdirSync(trajectoryDir);
        files.forEach(file => {
          if (file.startsWith('trajectory_')) {
            fs.unlinkSync(path.join(trajectoryDir, file));
          }
        });
      }
    });
  });

  test('should start recording with correct initial structure', () => {
    recordingId = trajectoryRecorder.startRecording(testTaskId, testContext);
    
    expect(recordingId).toBeDefined();
    expect(typeof recordingId).toBe('string');
    
    const recording = trajectoryRecorder.getRecording(recordingId);
    expect(recording).toBeDefined();
    expect(recording.taskId).toBe(testTaskId);
    expect(recording.context).toEqual(testContext);
    expect(recording.events).toHaveLength(1);
    expect(recording.events[0].type).toBe('recording_started');
  });

  test('should log LLM interactions', () => {
    recordingId = trajectoryRecorder.startRecording(testTaskId, testContext);
    
    const llmCallData = {
      agentId: 'test_agent',
      model: 'gpt-4',
      prompt: 'Test prompt',
      response: 'Test response'
    };
    
    trajectoryRecorder.logLLMInteraction(recordingId, llmCallData);
    
    const recording = trajectoryRecorder.getRecording(recordingId);
    expect(recording.events).toHaveLength(2);
    expect(recording.events[1].type).toBe('llm_interaction');
    expect(recording.events[1].data).toEqual(llmCallData);
  });

  test('should log tool calls', () => {
    recordingId = trajectoryRecorder.startRecording(testTaskId, testContext);
    
    const toolCallData = {
      toolName: 'file_system.read',
      args: { path: 'test.txt' },
      result: 'File content'
    };
    
    trajectoryRecorder.logToolCall(recordingId, toolCallData);
    
    const recording = trajectoryRecorder.getRecording(recordingId);
    expect(recording.events).toHaveLength(2);
    expect(recording.events[1].type).toBe('tool_call');
    expect(recording.events[1].data).toEqual(toolCallData);
  });

  test('should log state changes', () => {
    recordingId = trajectoryRecorder.startRecording(testTaskId, testContext);
    
    const stateChangeData = {
      from: 'PLANNING',
      to: 'EXECUTION',
      reason: 'Plan completed'
    };
    
    trajectoryRecorder.logStateChange(recordingId, stateChangeData);
    
    const recording = trajectoryRecorder.getRecording(recordingId);
    expect(recording.events).toHaveLength(2);
    expect(recording.events[1].type).toBe('state_change');
    expect(recording.events[1].data).toEqual(stateChangeData);
  });

  test('should log errors', () => {
    recordingId = trajectoryRecorder.startRecording(testTaskId, testContext);
    
    const errorData = {
      message: 'Test error',
      stack: 'Error stack trace',
      code: 'TEST_ERROR'
    };
    
    trajectoryRecorder.logError(recordingId, errorData);
    
    const recording = trajectoryRecorder.getRecording(recordingId);
    expect(recording.events).toHaveLength(2);
    expect(recording.events[1].type).toBe('error');
    expect(recording.events[1].data).toEqual(errorData);
  });

  test('should log decisions', () => {
    recordingId = trajectoryRecorder.startRecording(testTaskId, testContext);
    
    const decisionData = {
      type: 'solution_selection',
      selected: 1,
      alternatives: 3,
      criteria: ['efficiency', 'readability']
    };
    
    trajectoryRecorder.logDecision(recordingId, decisionData);
    
    const recording = trajectoryRecorder.getRecording(recordingId);
    expect(recording.events).toHaveLength(2);
    expect(recording.events[1].type).toBe('decision');
    expect(recording.events[1].data).toEqual(decisionData);
  });

  test('should finalize recording and save to disk', async () => {
    recordingId = trajectoryRecorder.startRecording(testTaskId, testContext);
    
    const finalState = {
      status: 'completed',
      result: 'success'
    };
    
    await trajectoryRecorder.finalizeRecording(recordingId, finalState);
    
    // Check that recording was removed from memory
    const recording = trajectoryRecorder.getRecording(recordingId);
    expect(recording).toBeNull();
    
    // Check that file was saved in either the new or legacy directory
    const newTrajectoryDir = path.join(process.cwd(), '.stigmergy', 'trajectories');
    const legacyTrajectoryDir = path.join(process.cwd(), '.stigmergy-core', 'trajectories');
    const filename = `trajectory_${recordingId}.json`;
    
    const newFilepath = path.join(newTrajectoryDir, filename);
    const legacyFilepath = path.join(legacyTrajectoryDir, filename);

    const fileExists = fs.existsSync(newFilepath) || fs.existsSync(legacyFilepath);
    expect(fileExists).toBe(true);
    
    // Check file content
    const filepath = fs.existsSync(newFilepath) ? newFilepath : legacyFilepath;
    const savedRecording = fs.readJsonSync(filepath);
    expect(savedRecording.id).toBe(recordingId);
    expect(savedRecording.taskId).toBe(testTaskId);
    expect(savedRecording.finalState).toEqual(finalState);
    expect(savedRecording.events).toHaveLength(2);
    expect(savedRecording.events[1].type).toBe('recording_finalized');
  });
});