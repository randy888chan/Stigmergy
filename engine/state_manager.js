const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { v4: uuidv4 } = require('uuid'); // Add uuid for unique IDs

const STATE_FILE_PATH = path.resolve(process.cwd(), '.ai', 'state.json');

async function getState() {
  await fs.ensureDir(path.dirname(STATE_FILE_PATH));
  if (!(await fs.pathExists(STATE_FILE_PATH)) || (await fs.readFile(STATE_FILE_PATH, 'utf8')).trim() === '') {
    const defaultState = require('../.stigmergy-core/templates/state-tmpl.json');
    defaultState.history[0].timestamp = new Date().toISOString();
    await fs.writeJson(STATE_FILE_PATH, defaultState, { spaces: 2 });
    return defaultState;
  }
  return fs.readJson(STATE_FILE_PATH);
}

async function updateState(newState) {
  await fs.writeJson(STATE_FILE_PATH, newState, { spaces: 2 });
  return newState;
}

async function updateStatusAndHistory(newStatus, historyEvent) {
  const state = await getState();
  if (newStatus) state.project_status = newStatus;
  state.history.push({
    id: uuidv4(),
    ...historyEvent,
    timestamp: new Date().toISOString(),
  });
  return updateState(state);
}

// --- NEW LIFECYCLE MANAGEMENT FUNCTIONS ---

async function initializeStateForGrandBlueprint(goal) {
    let state = require('../.stigmergy-core/templates/state-tmpl.json'); // Start fresh
    state.goal = goal;
    state.project_status = "GRAND_BLUEPRINT_PHASE";
    state.artifacts_created = { // New object to track planning progress
        brief: false,
        prd: false,
        architecture: false,
        blueprint_yaml: false,
        stories: false
    };
    state.history = [{
        id: uuidv4(),
        agent_id: 'user',
        signal: 'PROJECT_START',
        summary: `Stigmergy engine engaged via IDE with goal: ${goal}`,
        timestamp: new Date().toISOString(),
    }];
    await fs.ensureDir(path.join(process.cwd(), 'docs'));
    await fs.ensureDir(path.join(process.cwd(), '.ai', 'stories'));
    return updateState(state);
}

async function recordTaskCompletion(action, result) {
    const state = await getState();
    const { taskId, type } = action;

    if (type === "EXECUTION_TASK" && taskId) {
        const task = state.project_manifest?.tasks?.find(t => t.id === taskId);
        if (task) {
            task.status = "COMPLETED";
            await updateStatusAndHistory(null, { agent_id: action.agent, signal: 'TASK_COMPLETED', summary: `Task ${taskId} completed. Agent thought: ${result}` });
        }
    } else if (type === "PLANNING_TASK") {
        // Here we mark which part of the blueprint is done
        const artifactKey = action.agent === 'analyst' ? 'brief'
                          : action.agent === 'pm' ? 'prd'
                          : action.agent === 'design-architect' ? 'architecture' // Simplified, assumes it does all its parts
                          : action.agent === 'sm' ? 'stories' // Simplified
                          : null;
        if(artifactKey) state.artifacts_created[artifactKey] = true;

        if (action.task.includes('execution-blueprint.yml')) {
            state.artifacts_created.blueprint_yaml = true;
            const blueprintContent = await fs.readFile(path.join(CWD, 'execution-blueprint.yml'), 'utf8');
            const blueprint = yaml.load(blueprintContent);
            state.project_manifest = blueprint; // Ingest the manifest
        }
        await updateStatusAndHistory(null, { agent_id: action.agent, signal: 'ARTIFACT_CREATED', summary: `Agent ${action.agent} completed its planning task.` });
    }
}

async function advanceToExecution() {
    return updateStatusAndHistory("EXECUTION_PHASE", { agent_id: 'user', signal: 'EXECUTION_APPROVED', summary: 'User approved the Grand Blueprint for execution.'});
}

async function fulfillSecretRequest(key_name, secret) {
    const state = await getState();
    if (!state.secrets) state.secrets = {};
    state.secrets[key_name] = secret; // Store secrets in state for the session
    return updateStatusAndHistory("EXECUTION_PHASE", { agent_id: 'user', signal: 'INPUT_PROVIDED', summary: `User provided secret for ${key_name}.` });
}

module.exports = {
  getState,
  updateState,
  updateStatusAndHistory,
  initializeStateForGrandBlueprint,
  recordTaskCompletion,
  advanceToExecution,
  fulfillSecretRequest
};
