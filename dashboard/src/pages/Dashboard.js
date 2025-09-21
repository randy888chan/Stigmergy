import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import AgentOrchestration from '../components/AgentOrchestration.js';
import StateManagement from '../components/StateManagement.js';
import TaskManagement from '../components/TaskManagement.js';
import CodeBrowser from '../components/CodeBrowser.js';
import Terminal from '../components/Terminal.js';
import ProcessManager from '../components/ProcessManager.js';
import AgentVisualization from '../components/AgentVisualization.js';
import FileEditor from '../components/FileEditor.js';
import CostMonitor from '../components/CostMonitor.js';
import ClarificationHandler from '../components/ClarificationHandler.js';
import useWebSocket from '../hooks/useWebSocket.js';
import '../styles/Dashboard.css';

// New interactive components
import ControlPanel from '../components/ControlPanel.js';
import ActivityLog from '../components/ActivityLog.js';
import GoalVisualizer from '../components/GoalVisualizer.js';


const Dashboard = () => {
  const { user, logout } = useAuth();
  const { data, sendMessage } = useWebSocket(`ws://localhost:${process.env.PORT || 3010}`);

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
          setLogs(prevLogs => [...prevLogs.slice(-20), payload]); // Keep logs from getting too long
          break;
        case 'agent_start':
        case 'tool_start':
        case 'tool_end':
          setAgentActivity(prev => [...prev.slice(-20), { type, ...payload }]); // Keep activity from getting too long
          break;
        case 'executeGoal_step':
          // Replace with the current step
          setGoalSteps([payload]);
          break;
        case 'state_update':
          setSystemState(payload);
          setTasks(payload.project_manifest?.tasks || []);
          break;
        case 'status':
          setEngineStatus(payload.message);
          break;
        default:
          // console.log(`[WS] Unhandled message type: ${type}`);
          break;
      }
    }
  }, [data]);


  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Stigmergy Command & Control</h1>
        <div className="user-info">
          <span>{engineStatus}</span>
          <span>Welcome, {user?.username || 'User'}!</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-grid interactive-grid">
          {/* Top Row: Controls and High-Level Status */}
          <div className="dashboard-card wide-card">
            <ControlPanel sendMessage={sendMessage} engineStatus={engineStatus} />
          </div>
          <div className="dashboard-card wide-card">
            <GoalVisualizer goalSteps={goalSteps} />
          </div>

          {/* Mid Row: Real-time logging and tasks */}
          <div className="dashboard-card tall-card">
            <ActivityLog logs={logs} agentActivity={agentActivity} />
          </div>
          <div className="dashboard-card tall-card">
            <TaskManagement tasks={tasks} sendMessage={sendMessage} />
          </div>

          {/* Other components */}
          <div className="dashboard-card">
            <StateManagement state={systemState} />
          </div>
          <div className="dashboard-card">
            <CodeBrowser />
          </div>
          <div className="dashboard-card">
            <CostMonitor />
          </div>
          <div className="dashboard-card terminal-card">
            <Terminal />
          </div>
        </div>
      </main>
      
      <ClarificationHandler ws={{ data, sendMessage }} />
    </div>
  );
};

export default Dashboard;