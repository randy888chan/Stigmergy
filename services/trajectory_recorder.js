import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// List of background agents whose routine executions should not be recorded
const IGNORED_AGENTS = new Set(['health_monitor']);

class TrajectoryRecorder {
  constructor() {
    this.recordings = new Map();
  }

  startRecording(taskId, initialContext = {}) {
    const agentId = initialContext?.agentId;

    // Do not start recording for ignored background agents
    if (agentId && IGNORED_AGENTS.has(agentId)) {
      return null; // Return null to indicate no recording was started
    }

    const recordingId = uuidv4();
    const recording = {
      id: recordingId,
      taskId,
      startTime: new Date().toISOString(),
      events: [],
      context: initialContext
    };
    
    this.recordings.set(recordingId, recording);
    this.logEvent(recordingId, 'recording_started', { taskId, initialContext });
    return recordingId;
  }

  logEvent(recordingId, eventType, eventData = {}) {
    // If recordingId is null, do nothing
    if (!recordingId) return;

    const recording = this.recordings.get(recordingId);
    if (!recording) {
      console.warn(`[TrajectoryRecorder] Attempted to log event for non-existent recording: ${recordingId}`);
      return;
    }

    const event = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: eventType,
      data: eventData
    };

    recording.events.push(event);
  }

  async finalizeRecording(recordingId, finalState = {}) {
    // If recordingId is null, do nothing
    if (!recordingId) return;

    const recording = this.recordings.get(recordingId);
    if (!recording) {
      console.warn(`[TrajectoryRecorder] Attempted to finalize non-existent recording: ${recordingId}`);
      return;
    }

    recording.endTime = new Date().toISOString();
    recording.finalState = finalState;
    recording.duration = new Date(recording.endTime) - new Date(recording.startTime);

    this.logEvent(recordingId, 'recording_finalized', { finalState });

    try {
      let trajectoryDir = path.join(process.cwd(), '.stigmergy', 'trajectories');
      if (!await fs.pathExists(path.join(process.cwd(), '.stigmergy'))) {
        trajectoryDir = path.join(process.cwd(), '.stigmergy-core', 'trajectories');
      }
      await fs.ensureDir(trajectoryDir);
      
      const filename = `trajectory_${recordingId}.json`;
      const filepath = path.join(trajectoryDir, filename);
      
      await fs.writeJson(filepath, recording, { spaces: 2 });
    } catch (error) {
      console.error(`[TrajectoryRecorder] Failed to save trajectory: ${error.message}`);
    }

    this.recordings.delete(recordingId);
  }

  // --- All other methods remain the same ---
  logLLMInteraction(recordingId, llmCall) { this.logEvent(recordingId, 'llm_interaction', llmCall); }
  logToolCall(recordingId, toolCall) { this.logEvent(recordingId, 'tool_call', toolCall); }
  logStateChange(recordingId, stateChange) { this.logEvent(recordingId, 'state_change', stateChange); }
  logError(recordingId, errorData) { this.logEvent(recordingId, 'error', errorData); }
  logDecision(recordingId, decisionData) { this.logEvent(recordingId, 'decision', decisionData); }
  getRecording(recordingId) { return this.recordings.get(recordingId) || null; }
}

export default new TrajectoryRecorder();
