import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class TrajectoryRecorder {
  constructor() {
    this.recordings = new Map();
  }

  /**
   * Start recording a new trajectory
   * @param {string} taskId - Unique identifier for the task
   * @param {object} initialContext - Initial context for the trajectory
   * @returns {string} recordingId - Unique identifier for the recording
   */
  startRecording(taskId, initialContext = {}) {
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

  /**
   * Log an LLM interaction in the trajectory
   * @param {string} recordingId - The recording identifier
   * @param {object} llmCall - Details of the LLM call
   */
  logLLMInteraction(recordingId, llmCall) {
    this.logEvent(recordingId, 'llm_interaction', llmCall);
  }

  /**
   * Log a tool call in the trajectory
   * @param {string} recordingId - The recording identifier
   * @param {object} toolCall - Details of the tool call
   */
  logToolCall(recordingId, toolCall) {
    this.logEvent(recordingId, 'tool_call', toolCall);
  }

  /**
   * Log a state change in the trajectory
   * @param {string} recordingId - The recording identifier
   * @param {object} stateChange - Details of the state change
   */
  logStateChange(recordingId, stateChange) {
    this.logEvent(recordingId, 'state_change', stateChange);
  }

  /**
   * Log a general event in the trajectory
   * @param {string} recordingId - The recording identifier
   * @param {string} eventType - Type of the event
   * @param {object} eventData - Data associated with the event
   */
  logEvent(recordingId, eventType, eventData = {}) {
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

  /**
   * Finalize a recording and save it to disk
   * @param {string} recordingId - The recording identifier
   * @param {object} finalState - Final state of the task
   * @returns {Promise<void>}
   */
  async finalizeRecording(recordingId, finalState = {}) {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      console.warn(`[TrajectoryRecorder] Attempted to finalize non-existent recording: ${recordingId}`);
      return;
    }

    recording.endTime = new Date().toISOString();
    recording.finalState = finalState;
    recording.duration = new Date(recording.endTime) - new Date(recording.startTime);

    this.logEvent(recordingId, 'recording_finalized', { finalState });

    // Save to disk
    try {
      const trajectoryDir = path.join(process.cwd(), '.stigmergy-core', 'trajectories');
      await fs.ensureDir(trajectoryDir);
      
      const filename = `trajectory_${recordingId}.json`;
      const filepath = path.join(trajectoryDir, filename);
      
      await fs.writeJson(filepath, recording, { spaces: 2 });
      console.log(`[TrajectoryRecorder] Saved trajectory to ${filepath}`);
    } catch (error) {
      console.error(`[TrajectoryRecorder] Failed to save trajectory: ${error.message}`);
    }

    // Remove from memory
    this.recordings.delete(recordingId);
  }

  /**
   * Get a recording by ID (for testing purposes)
   * @param {string} recordingId - The recording identifier
   * @returns {object|null} The recording or null if not found
   */
  getRecording(recordingId) {
    return this.recordings.get(recordingId) || null;
  }
}

// Export a singleton instance
export default new TrajectoryRecorder();