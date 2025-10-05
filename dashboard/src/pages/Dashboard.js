import React, { useState, useEffect, lazy, Suspense } from 'react';
import useWebSocket from '../hooks/useWebSocket.js';
import '../styles/Dashboard.css';

// --- Core Interactive Components ---
import ControlPanel from '../components/ControlPanel.js';
import ActivityLog from '../components/ActivityLog.js';
import GoalVisualizer from '../components/GoalVisualizer.js';
import ClarificationHandler from '../components/ClarificationHandler.js';

// --- Lazy-load heavier components for better performance ---
const StateManagement = lazy(() => import('../components/StateManagement.js'));
const TaskManagement = lazy(() => import('../components/TaskManagement.js'));
const CodeBrowser = lazy(() => import('../components/CodeBrowser.js'));
const CostMonitor = lazy(() => import('../components/CostMonitor.js'));
const DocumentUploader = lazy(() => import('../components/DocumentUploader.js'));

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
  const { data, sendMessage } = useWebSocket('ws://localhost:3010');
  const [systemState, setSystemState] = useState(INITIAL_STATE);
  const [projectPathInput, setProjectPathInput] = useState('');

  useEffect(() => {
    if (data) {
      const { type, payload } = data;
      console.log("WS Message:", type, payload);
      switch (type) {
        case 'state_update':
          setSystemState(prevState => ({ ...prevState, ...payload }));
          break;
        case 'project_switched':
          setSystemState({ ...INITIAL_STATE, project_path: payload.path, project_status: 'Project Set' });
          break;
        default:
          // For legacy events, we can handle them individually for now
          setSystemState(prevState => {
             const newState = {...prevState};
             if (type === 'log') newState.logs = [...prevState.logs.slice(-50), payload];
             if (['agent_start', 'tool_start', 'tool_end'].includes(type)) newState.agentActivity = [...prevState.agentActivity.slice(-50), { type, ...payload }];
             return newState;
          });
          break;
      }
    }
  }, [data]);

  const handleSetProject = () => {
    if (projectPathInput) {
      sendMessage({ type: 'set_project', payload: { path: projectPathInput } });
    }
  };

  const renderCard = (Component, props = {}) => (
    <div className="dashboard-card">
      <Suspense fallback={<div>Loading Component...</div>}>
        <Component {...props} />
      </Suspense>
    </div>
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Stigmergy Command & Control</h1>
        <div className="project-selector">
          <input
            type="text"
            placeholder="Enter project path..."
            value={projectPathInput}
            onChange={(e) => setProjectPathInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetProject()}
          />
          <button onClick={handleSetProject}>Set Project</button>
        </div>
        <div className="user-info">
          <span>Status: {systemState.project_status || 'Idle'}</span>
          <button onClick={() => sendMessage({ type: 'user_command', payload: 'logout' })} className="logout-button">Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-grid interactive-grid">
          <div className="dashboard-card wide-card">
            <ControlPanel sendMessage={sendMessage} engineStatus={systemState.project_status} />
          </div>
          <div className="dashboard-card wide-card">
            <GoalVisualizer goalSteps={systemState.goalSteps} />
          </div>
          <div className="dashboard-card tall-card">
            <ActivityLog logs={systemState.logs} agentActivity={systemState.agentActivity} />
          </div>
          <div className="dashboard-card tall-card">
            {renderCard(TaskManagement, { tasks: systemState.tasks, sendMessage })}
          </div>

          {renderCard(StateManagement, { state: systemState })}
          <div className="dashboard-card code-browser-card">
            <Suspense fallback={<div>Loading Code Browser...</div>}>
              <CodeBrowser fileStructure={systemState.file_structure} />
            </Suspense>
          </div>
          {renderCard(CostMonitor)}
          {renderCard(DocumentUploader)}
        </div>
      </main>
      
      <ClarificationHandler ws={{ data, sendMessage }} />
    </div>
  );
};

export default Dashboard;