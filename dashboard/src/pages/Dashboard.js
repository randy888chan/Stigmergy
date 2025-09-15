import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AgentOrchestration from '../components/AgentOrchestration';
import StateManagement from '../components/StateManagement';
import TaskManagement from '../components/TaskManagement';
import CodeBrowser from '../components/CodeBrowser';
import Terminal from '../components/Terminal';
import ProcessManager from '../components/ProcessManager';
import AgentVisualization from '../components/AgentVisualization';
import FileEditor from '../components/FileEditor';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

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