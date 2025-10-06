import React, { useState, useEffect, lazy, Suspense } from 'react';
import useWebSocket from '../hooks/useWebSocket.js';

// --- Core Interactive Components ---
import ControlPanel from '../components/ControlPanel.js';
import ActivityLog from '../components/ActivityLog.js';
import DocumentUploader from '../components/DocumentUploader.js';

// --- Lazy-load other components if needed ---
const StateManagement = lazy(() => import('../components/StateManagement.js'));

const INITIAL_STATE = {
  logs: [],
  agentActivity: [],
  tasks: [],
  goalSteps: [],
  project_status: 'Idle',
  project_manifest: null,
  project_path: '',
  goal: '',
  file_structure: [],
};

const Dashboard = () => {
  const { data, sendMessage } = useWebSocket('ws://localhost:3010/ws');
  const [systemState, setSystemState] = useState(INITIAL_STATE);
  const [projectPathInput, setProjectPathInput] = useState('');

  useEffect(() => {
    if (data) {
      const { type, payload } = data;
      switch (type) {
        case 'state_update':
          // When we get a state update, update the entire state object.
          setSystemState(prevState => ({ ...prevState, ...payload }));
          break;
        case 'project_switched':
          // When the project is switched, reset the state and set the new path.
          setSystemState({ ...INITIAL_STATE, project_path: payload.path, project_status: 'Project Set' });
          break;
        default:
          // Handle legacy or simple event types for the activity log
          setSystemState(prevState => {
             const newState = {...prevState};
             // This can be simplified in the future, but it works for now.
             if (type === 'log') newState.logs = [...prevState.logs.slice(-50), payload];
             if (['agent_start', 'tool_start', 'tool_end'].includes(type)) newState.agentActivity = [...prevState.agentActivity.slice(-50), { type, ...payload }];
             return newState;
          });
          break;
      }
    }
  }, [data]);

  // THIS IS THE NEW FUNCTION TO HANDLE PROJECT SWITCHING
  const handleSetProject = () => {
    if (projectPathInput) {
      sendMessage({ type: 'set_project', payload: { path: projectPathInput } });
    }
  };

  const renderCard = (Component, props = {}) => (
    <div className="dashboard-card">
      <Suspense fallback={<div>Loading...</div>}>
        <Component {...props} />
      </Suspense>
    </div>
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Stigmergy Command & Control</h1>
        {/* THIS IS THE NEW UI FOR PROJECT TARGETING */}
        <div className="project-selector">
          <input
            type="text"
            placeholder="Enter absolute path to project..."
            value={projectPathInput}
            onChange={(e) => setProjectPathInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetProject()}
          />
          <button onClick={handleSetProject}>Set Active Project</button>
        </div>
        <div className="user-info">
          <span>Active Project: {systemState.project_path || 'None'}</span>
          <span>Status: {systemState.project_status || 'Idle'}</span>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-grid">
            <div className="dashboard-card grid-col-span-8 grid-row-span-2">
                <h2>Activity Log</h2>
                <div className="card-content">
                    <ActivityLog logs={systemState.logs} agentActivity={systemState.agentActivity} />
                </div>
            </div>
            <div className="dashboard-card grid-col-span-4">
                <h2>Control Panel</h2>
                <div className="card-content">
                    <ControlPanel sendMessage={sendMessage} engineStatus={systemState.project_status} />
                </div>
            </div>
            <div className="dashboard-card grid-col-span-4">
                <h2>Document Uploader</h2>
                <div className="card-content">
                    <DocumentUploader />
                </div>
            </div>
            <div className="dashboard-card grid-col-span-12">
                <h2>System State</h2>
                <div className="card-content">
                    <Suspense fallback={<div>Loading State...</div>}>
                        <StateManagement state={systemState} />
                    </Suspense>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;