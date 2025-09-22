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
const Terminal = lazy(() => import('../components/Terminal.js'));
const CostMonitor = lazy(() => import('../components/CostMonitor.js'));


const Dashboard = () => {
  // CORRECTED: Hardcode the port to 3010, removing the 'process.env.PORT' reference.
  const { data, sendMessage } = useWebSocket('ws://localhost:3010');

  // Centralized state management
  const [logs, setLogs] = useState([]);
  const [agentActivity, setAgentActivity] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [goalSteps, setGoalSteps] = useState([]);
  const [engineStatus, setEngineStatus] = useState('Idle');
  const [systemState, setSystemState] = useState(null);

  useEffect(() => {
    if (data) {
      const { type, payload } = data;
      switch (type) {
        case 'log':
          setLogs(prevLogs => [...prevLogs.slice(-50), payload]);
          break;
        case 'agent_start':
        case 'tool_start':
        case 'tool_end':
          setAgentActivity(prev => [...prev.slice(-50), { type, ...payload }]);
          break;
        case 'executeGoal_step':
          setGoalSteps([payload]);
          break;
        case 'state_update':
          setSystemState(payload);
          setTasks(payload.project_manifest?.tasks || []);
          setEngineStatus(payload.project_status || 'Idle');
          break;
        case 'status':
          setEngineStatus(payload.message);
          break;
        default:
          break;
      }
    }
  }, [data]);

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
        <div className="user-info">
          <span>Status: {engineStatus}</span>
          <button onClick={() => sendMessage({ type: 'user_command', payload: 'logout' })} className="logout-button">Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-grid interactive-grid">
          <div className="dashboard-card wide-card">
            <ControlPanel sendMessage={sendMessage} engineStatus={engineStatus} />
          </div>
          <div className="dashboard-card wide-card">
            <GoalVisualizer goalSteps={goalSteps} />
          </div>
          <div className="dashboard-card tall-card">
            <ActivityLog logs={logs} agentActivity={agentActivity} />
          </div>
          <div className="dashboard-card tall-card">
            {renderCard(TaskManagement, { tasks, sendMessage })}
          </div>

          {renderCard(StateManagement, { state: systemState })}
          {renderCard(CodeBrowser)}
          {renderCard(CostMonitor)}
          <div className="dashboard-card terminal-card">
            {renderCard(Terminal)}
          </div>
        </div>
      </main>
      
      <ClarificationHandler ws={{ data, sendMessage }} />
    </div>
  );
};

export default Dashboard;