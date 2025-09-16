import React, { useContext } from 'react';
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
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Stigmergy Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.username || 'User'}!</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Agent Orchestration</h2>
            <AgentOrchestration />
          </div>
          
          <div className="dashboard-card">
            <h2>State Management</h2>
            <StateManagement />
          </div>
          
          <div className="dashboard-card">
            <h2>Task Management</h2>
            <TaskManagement />
          </div>
          
          <div className="dashboard-card">
            <h2>Code Browser</h2>
            <CodeBrowser />
          </div>
          
          <div className="dashboard-card">
            <h2>Cost Monitoring</h2>
            <CostMonitor />
          </div>
          
          <div className="dashboard-card terminal-card">
            <h2>Integrated Terminal</h2>
            <Terminal />
          </div>
          
          <div className="dashboard-card">
            <h2>Process Manager</h2>
            <ProcessManager />
          </div>
          
          <div className="dashboard-card">
            <h2>Agent Visualization</h2>
            <AgentVisualization />
          </div>
          
          <div className="dashboard-card">
            <h2>File Editor</h2>
            <FileEditor />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;