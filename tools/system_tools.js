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
   * Sends a structured request for human approval to the dashboard and waits for a response.
   * This tool pauses the agent's execution until the user responds via the UI.
   * @param {object} args
   * @param {string} args.message - The question for the user (e.g., "Please approve this business plan.").
   * @param {object} args.data - The data to be reviewed (e.g., the content of the business plan).
   * @returns {Promise<string>} The user's decision ('approved' or 'rejected').
   */
  request_human_approval: async ({ message, data }) => {
    if (!message || !data) {
      throw new Error("The 'message' and 'data' arguments are required for system.request_human_approval.");
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    console.log(`[System Tool] Requesting human approval (ID: ${requestId}): ${message}`);

    const approvalPromise = new Promise((resolve) => {
      engine.pendingApprovals.set(requestId, resolve);
    });

    engine.broadcastEvent('human_approval_request', { requestId, message, data });

    // The agent's execution will pause here until the promise is resolved.
    const decision = await approvalPromise;

    return `Human operator responded with: '${decision}'. You may now proceed.`;
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

  execute_cypher_query: async ({ query }) => {
    if (!query) {
      throw new Error("The 'query' argument is required for system.execute_cypher_query.");
    }
    if (!engine.stateManager || !engine.stateManager.getDriver()) {
        return "EXECUTION FAILED: Neo4j database is not connected.";
    }
    const driver = engine.stateManager.getDriver();
    const session = driver.session();
    try {
        console.log(`[System Tool] Executing Cypher Query: ${query}`);
        const result = await session.run(query);
        // Neo4j records are complex objects. We need to serialize them into a more digestible format.
        const serializedRecords = result.records.map(record => {
            const serializedRecord = {};
            record.keys.forEach(key => {
                serializedRecord[key] = record.get(key);
            });
            return serializedRecord;
        });
        return JSON.stringify(serializedRecords, null, 2);
    } catch (error) {
        console.error(`[System Tool] Cypher query failed: ${error.message}`);
        return `EXECUTION FAILED: ${error.message}`;
    } finally {
        await session.close();
    }
  },

  update_proposal_status: async ({ proposal_id, new_status, reason }) => {
    if (!proposal_id || !new_status) {
      throw new Error("The 'proposal_id' and 'new_status' arguments are required for system.update_proposal_status.");
    }

    const proposalsDir = path.join(engine.corePath, 'proposals');
    const proposalPath = path.join(proposalsDir, `${proposal_id}.json`);

    try {
      const proposal = await fs.readJson(proposalPath);
      proposal.status = new_status;
      if (reason) {
        proposal.status_reason = reason;
      }
      await fs.writeJson(proposalPath, proposal, { spaces: 2 });

      engine.broadcastEvent('proposal_updated', proposal);
      const message = `Successfully updated proposal ${proposal_id} to status ${new_status}.`;
      console.log(`[System Tool] ${message}`);
      return message;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return `EXECUTION FAILED: Proposal with ID ${proposal_id} not found.`;
      }
      return `EXECUTION FAILED: Failed to update proposal: ${error.message}`;
    }
  },
});