import path from 'path';
import fs from 'fs-extra';

/**
 * Creates the toolset for system-level control, accessible to trusted agents.
 * @param {import('../engine/server.js').Engine} engine - The main engine instance.
 * @returns {Object} The system toolset.
 */
export default (engine) => ({
  /**
   * Updates the overall project status.
   * This tool is intentionally flexible to accept `project_status` as an alias for `newStatus`,
   * making it more robust to common AI model mistakes.
   */
  updateStatus: async ({ newStatus, project_status, message }) => {
    const status = newStatus || project_status;
    if (!status) {
      throw new Error("The 'newStatus' or 'project_status' argument is required for system.updateStatus.");
    }
    await engine.stateManager.updateStatus({ newStatus: status, message });
    const confirmation = `System status successfully updated to ${status}.`;
    console.log(`[System Tool] ${confirmation}`);
    return confirmation;
  },

  /**
   * Sends a structured request for human approval to the dashboard.
   * This is the new tool for the dispatcher's "Human Handoff" protocol.
   * @param {object} args
   * @param {string} args.message - The question for the user (e.g., "Please approve this business plan.").
   * @param {object} args.data - The data to be reviewed (e.g., the content of the business plan).
   * @returns {Promise<string>} Confirmation message.
   */
  request_human_approval: async ({ message, data }) => {
    if (!message || !data) {
      throw new Error("The 'message' and 'data' arguments are required for system.request_human_approval.");
    }
    console.log(`[System Tool] Requesting human approval: ${message}`);
    engine.broadcastEvent('human_approval_request', { message, data });
    return "Request for human approval has been sent to the dashboard.";
  },

  /**
   * Logs a message from an agent, typically used for fallbacks.
   * @param {Object} args
   * @param {string} args.message - The message to log.
   * @returns {Promise<string>} Confirmation of the log.
   */
  log: async ({ message }) => {
    console.log(`[System Tool Log] ${message}`);
    return "Message logged successfully.";
  },
  
  /**
   * Runs the health check script
   * @returns {Promise<Object>} Health check results
   */
  run_health_check: async () => {
    try {
      // Import exec dynamically to avoid issues
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execPromise = promisify(exec);
      const { stdout } = await execPromise('bun run scripts/health-check.js');
      return { success: true, report: stdout };
    } catch (error) {
      return { success: false, error: error.message, report: error.stdout || error.stderr };
    }
  },

  /**
   * Runs the validation script
   * @returns {Promise<Object>} Validation results
   */
  run_validation: async () => {
    try {
      // Import exec dynamically to avoid issues
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execPromise = promisify(exec);
      const { stdout } = await execPromise('bun run cli/index.js validate');
      return { success: true, report: stdout };
    } catch (error) {
      return { success: false, error: error.message, report: error.stdout || error.stderr };
    }
  },

  update_objective: async ({ agent, task, thought }) => {
    if (!agent || !task) {
      throw new Error("The 'agent' and 'task' arguments are required for system.update_objective.");
    }
    const payload = { agent, task, thought: thought || "Executing..." };
    engine.broadcastEvent('objective_update', payload);
    const confirmation = `Objective updated for agent ${agent}.`;
    console.log(`[System Tool] ${confirmation}`);
    return confirmation;
  },

  // Inside the returned object in tools/system_tools.js, add this new function:
  stream_thought: async ({ thought }) => {
    if (!thought) {
      return "No thought provided to stream.";
    }
    const payload = { thought, timestamp: new Date().toISOString() };
    engine.broadcastEvent('thought_stream', payload);
    // We don't need to log this to the console as it will appear on the dashboard.
    return "Thought streamed to dashboard.";
  },

  hard_reset_environment: async ({ reason }) => {
    console.warn(`[System Tool] Executing hard environment reset. Reason: ${reason}`);
    engine.broadcastEvent('system_alert', {
      level: 'critical',
      message: `Performing a hard environment reset due to: ${reason}. The system will restart in a clean state.`
    });

    // We need to give the broadcast a moment to send before shutting down.
    await new Promise(resolve => setTimeout(resolve, 1000));

    // This command will stop the current process and restart everything.
    // We don't need to await it as the process will terminate.
    const { exec } = await import('child_process');
    exec('bun run dev:reset', (err) => {
      if (err) {
        console.error("Failed to execute hard reset script:", err);
      }
    });

    return "Hard environment reset initiated. The server is restarting.";
  },
// Inside the returned object in tools/system_tools.js, add this new function:
promote_from_sandbox: async ({ filePath }, agentId) => {
    if (!filePath) {
        throw new Error("The 'filePath' argument is required for system.promote_from_sandbox.");
    }
    if (!agentId) {
        throw new Error("The 'agentId' is required for this tool and must be provided by the executor.");
    }

    const projectRoot = engine.projectRoot;
    const sandboxPath = path.join(projectRoot, '.stigmergy-core', 'sandboxes', agentId, filePath);
    const destinationPath = path.join(projectRoot, filePath);

    // Security check: ensure the source exists and the destination is within the project
    if (!await fs.pathExists(sandboxPath)) {
        return `EXECUTION FAILED: Source file does not exist in the sandbox: ${sandboxPath}`;
    }
    if (!destinationPath.startsWith(projectRoot)) {
        return `EXECUTION FAILED: Security violation. Attempted to promote file outside of project root.`;
    }

    try {
        await fs.copy(sandboxPath, destinationPath, { overwrite: true });
        const message = `Successfully promoted '${filePath}' from sandbox to project root.`;
        console.log(`[System Tool] ${message}`);
        return message;
    } catch (error) {
        return `EXECUTION FAILED: Failed to promote file: ${error.message}`;
    }
},
analyze_task_execution_strategy: async ({ task_description }) => {
    if (!task_description) {
      throw new Error("The 'task_description' argument is required for system.analyze_task_execution_strategy.");
    }

    const lowerCaseDescription = task_description.toLowerCase();
    let executor;
    let reasoning;

    if (/\b(algorithm|complex logic|data structure|optimization)\b/.test(lowerCaseDescription)) {
      executor = '@qwen-executor';
      reasoning = 'Task involves complex algorithms or logic, best suited for Qwen model.';
    } else if (/\b(crud|api|database|user interface|ui component)\b/.test(lowerCaseDescription)) {
      executor = '@gemini-executor';
      reasoning = 'Task involves standard web development patterns (CRUD, API, UI), suitable for Gemini model.';
    } else {
      executor = '@executor';
      reasoning = 'Default internal executor for general tasks.';
    }

    return { executor, reasoning };
  },
});