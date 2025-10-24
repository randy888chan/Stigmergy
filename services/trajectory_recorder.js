import * as fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import neo4j from 'neo4j-driver';

// List of background agents whose routine executions should not be recorded
const IGNORED_AGENTS = new Set(['health_monitor']);

class TrajectoryRecorder {
  constructor(stateManager) {
    this.recordings = new Map();
    this.driver = stateManager?.getDriver(); // Get driver from GraphStateManager
    if (!this.driver) {
        console.warn('[TrajectoryRecorder] Neo4j driver is not available. Trajectory graph logging will be disabled.');
    }
  }

  startRecording(taskId, initialContext = {}) {
    const agentId = initialContext?.agentId;

    if (agentId && IGNORED_AGENTS.has(agentId)) {
      return null;
    }

    const recordingId = uuidv4();
    const startTime = new Date().toISOString();
    const recording = {
      id: recordingId,
      taskId,
      startTime,
      events: [],
      context: initialContext
    };
    
    this.recordings.set(recordingId, recording);
    this.logEvent(recordingId, 'recording_started', { taskId, initialContext });

    if (this.driver) {
        this.logEvent(recordingId, 'task_started', { taskId });
        const session = this.driver.session();
        session.run(
            'CREATE (m:Mission {id: $id, taskId: $taskId, startTime: $startTime, status: "IN_PROGRESS"})',
            { id: recordingId, taskId, startTime }
        ).catch(error => console.error('[Neo4j] Error creating Mission node:', error))
         .finally(() => session.close());
    }

    return recordingId;
  }

  logEvent(recordingId, eventType, eventData = {}) {
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

    if (this.driver) {
        this.logGraphEvent(recordingId, event);
    }
  }

  async logGraphEvent(recordingId, event) {
      const session = this.driver.session();
      try {
          switch (event.type) {
              case 'task_started':
                  await session.run(
                        `MATCH (m:Mission {id: $recordingId})
                         CREATE (t:Task {id: $taskId, timestamp: $timestamp})
                         CREATE (m)-[:HAS_TASK]->(t)`,
                        { recordingId, taskId: event.data.taskId, timestamp: event.timestamp }
                  );
                  break;
              case 'decision':
                  await session.run(
                      `MATCH (m:Mission {id: $recordingId})
                       CREATE (d:Decision {id: $eventId, timestamp: $timestamp, thought: $thought, reasoning: $reasoning})
                       CREATE (m)-[:MADE_DECISION]->(d)`,
                      { recordingId, eventId: event.id, timestamp: event.timestamp, ...event.data }
                  );
                  break;
              case 'tool_call':
                  const toolCall = event.data.toolCall || {};
                  await session.run(
                      `MATCH (m:Mission {id: $recordingId})
                       CREATE (tc:ToolCall {id: $eventId, timestamp: $timestamp, toolName: $toolName, args: $args})
                       CREATE (m)-[:USED_TOOL]->(tc)`,
                      { recordingId, eventId: event.id, timestamp: event.timestamp, toolName: toolCall.name, args: JSON.stringify(toolCall.arguments) }
                  );
                  break;
              case 'tool_execution_error':
                  await session.run(
                      `MATCH (m:Mission {id: $recordingId})-[:USED_TOOL]->(tc:ToolCall {toolName: $toolName})
                       CREATE (o:Outcome {id: $eventId, timestamp: $timestamp, status: 'FAILED', error: $error})
                       CREATE (tc)-[:HAD_OUTCOME]->(o)`,
                      { recordingId, eventId: event.id, timestamp: event.timestamp, toolName: event.data.toolName, error: event.data.error }
                  );
                  break;
          }
      } catch (error) {
          console.error(`[Neo4j] Error logging event '${event.type}':`, error);
      } finally {
          await session.close();
      }
  }

  async finalizeRecording(recordingId, finalState = {}) {
    if (!recordingId) return;

    const recording = this.recordings.get(recordingId);
    if (!recording) {
      console.warn(`[TrajectoryRecorder] Attempted to finalize non-existent recording: ${recordingId}`);
      return;
    }

    const endTime = new Date().toISOString();
    recording.endTime = endTime;
    recording.finalState = finalState;
    recording.duration = new Date(endTime) - new Date(recording.startTime);

    this.logEvent(recordingId, 'recording_finalized', { finalState });

    if (this.driver) {
        const session = this.driver.session();
        const status = finalState.status || 'COMPLETED';
        await session.run(
          'MATCH (m:Mission {id: $id}) SET m.endTime = $endTime, m.status = $status',
          { id: recordingId, endTime, status }
        ).catch(error => console.error('[Neo4j] Error finalizing Mission node:', error))
         .finally(() => session.close());
    }

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
      console.error(`[TrajectoryRecorder] Failed to save trajectory JSON: ${error.message}`);
    }

    this.recordings.delete(recordingId);
  }

  logLLMInteraction(recordingId, llmCall) { this.logEvent(recordingId, 'llm_interaction', llmCall); }
  logToolCall(recordingId, toolCall) { this.logEvent(recordingId, 'tool_call', toolCall); }
  logStateChange(recordingId, stateChange) { this.logEvent(recordingId, 'state_change', stateChange); }
  logError(recordingId, errorData) { this.logEvent(recordingId, 'error', errorData); }
  logDecision(recordingId, decisionData) { this.logEvent(recordingId, 'decision', decisionData); }
  getRecording(recordingId) { return this.recordings.get(recordingId) || null; }
}

export { TrajectoryRecorder };
