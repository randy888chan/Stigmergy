import React, { useState, useEffect, lazy, Suspense } from 'react';
import useWebSocket from '../hooks/useWebSocket.js';

// --- Core Interactive Components ---
import ChatInterface from '../components/ChatInterface.js';
import ActivityLog from '../components/ActivityLog.js';
import DocumentUploader from '../components/DocumentUploader.js';

// --- Lazy-load other components ---
const StateManagement = lazy(() => import('../components/StateManagement.js'));
const CodeBrowser = lazy(() => import('../components/CodeBrowser.js'));

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
          setSystemState(prevState => ({ ...prevState, ...payload }));
          break;
        case 'project_switched':
          // Clear logs and reset status, but base it on the previous state to ensure a clean re-render.
          setSystemState(prevState => ({
            ...prevState,
            project_path: payload.path,
            project_status: 'Project Set',
            logs: [`Project switched to ${payload.path}`],
            agentActivity: [],
          }));
          break;
        default:
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
      setProjectPathInput(''); // Clear input after setting
    }
  };

  const renderCard = (title, Component, props = {}) => (
    <div className="dashboard-card">
        <h2>{title}</h2>
        <div className="card-content">
            <Suspense fallback={<div>Loading...</div>}>
                <Component {...props} />
            </Suspense>
        </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
        {/* Main Content: Chat and primary view */}
        <main className="dashboard-main">
            <div className="chat-container">
                 <ChatInterface sendMessage={sendMessage} engineStatus={systemState.project_status} />
            </div>

            {systemState.project_path && (
                <Suspense fallback={<div>Loading Code Browser...</div>}>
                    <CodeBrowser activeProject={systemState.project_path} />
                </Suspense>
            )}
        </main>

        {/* Sidebar: Controls, Info, and Logs */}
        <aside className="dashboard-sidebar">
            <header className="sidebar-header">
                <h1>Stigmergy</h1>
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
                    <span><b>Active Project:</b> {systemState.project_path || 'None'}</span>
                    <span><b>Status:</b> {systemState.project_status || 'Idle'}</span>
                </div>
            </header>

            <div className="sidebar-content">
                {renderCard("Activity Log", ActivityLog, { logs: systemState.logs, agentActivity: systemState.agentActivity })}
                {renderCard("Document Uploader", DocumentUploader)}
                {renderCard("System State", StateManagement, { state: systemState })}
            </div>
        </aside>
    </div>
  );
};

export default Dashboard;