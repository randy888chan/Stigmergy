import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './AgentVisualization.css';

const AgentVisualization = ({ state }) => {
  const [agentMetrics, setAgentMetrics] = useState([]);
  const [taskDistribution, setTaskDistribution] = useState([]);
  const [performanceTrends, setPerformanceTrends] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [viewMode, setViewMode] = useState('overview');

  // Mock data for demonstration
  const mockAgentMetrics = [
    { name: 'dispatcher', tasksCompleted: 42, successRate: 95, avgResponseTime: 120, errorRate: 2 },
    { name: 'dev', tasksCompleted: 128, successRate: 87, avgResponseTime: 340, errorRate: 8 },
    { name: 'qa', tasksCompleted: 96, successRate: 92, avgResponseTime: 280, errorRate: 5 },
    { name: 'design-architect', tasksCompleted: 35, successRate: 89, avgResponseTime: 420, errorRate: 7 },
    { name: 'business_planner', tasksCompleted: 28, successRate: 94, avgResponseTime: 180, errorRate: 3 },
    { name: 'debugger', tasksCompleted: 67, successRate: 85, avgResponseTime: 520, errorRate: 12 },
  ];

  const mockTaskDistribution = [
    { name: 'Code Generation', value: 35 },
    { name: 'Testing', value: 25 },
    { name: 'Planning', value: 20 },
    { name: 'Debugging', value: 15 },
    { name: 'Documentation', value: 5 },
  ];

  const mockPerformanceTrends = [
    { date: '2025-09-01', tasksCompleted: 45, successRate: 88, avgResponseTime: 320 },
    { date: '2025-09-02', tasksCompleted: 52, successRate: 91, avgResponseTime: 290 },
    { date: '2025-09-03', tasksCompleted: 48, successRate: 89, avgResponseTime: 310 },
    { date: '2025-09-04', tasksCompleted: 55, successRate: 93, avgResponseTime: 270 },
    { date: '2025-09-05', tasksCompleted: 60, successRate: 94, avgResponseTime: 250 },
    { date: '2025-09-06', tasksCompleted: 58, successRate: 92, avgResponseTime: 280 },
    { date: '2025-09-07', tasksCompleted: 62, successRate: 95, avgResponseTime: 240 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    // In a real implementation, this would fetch data from the backend
    setAgentMetrics(mockAgentMetrics);
    setTaskDistribution(mockTaskDistribution);
    setPerformanceTrends(mockPerformanceTrends);
  }, []);

  const handleAgentClick = (data, index) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      setSelectedAgent(data.activePayload[0].payload);
    }
  };

  const handleViewChange = (mode) => {
    setViewMode(mode);
    setSelectedAgent(null);
  };

  return (
    <div className="agent-visualization-dashboard">
      <div className="dashboard-header">
        <h2>Agent Visualization Dashboard</h2>
        <div className="view-controls">
          <button 
            className={`view-button ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={() => handleViewChange('overview')}
          >
            Overview
          </button>
          <button 
            className={`view-button ${viewMode === 'performance' ? 'active' : ''}`}
            onClick={() => handleViewChange('performance')}
          >
            Performance
          </button>
          <button 
            className={`view-button ${viewMode === 'distribution' ? 'active' : ''}`}
            onClick={() => handleViewChange('distribution')}
          >
            Distribution
          </button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="overview-view">
          <div className="metrics-summary">
            <div className="metric-card">
              <h3>Total Agents</h3>
              <div className="metric-value">{agentMetrics.length}</div>
            </div>
            <div className="metric-card">
              <h3>Active Tasks</h3>
              <div className="metric-value">24</div>
            </div>
            <div className="metric-card">
              <h3>Overall Success Rate</h3>
              <div className="metric-value">91%</div>
            </div>
            <div className="metric-card">
              <h3>Avg Response Time</h3>
              <div className="metric-value">310ms</div>
            </div>
          </div>

          <div className="charts-container">
            <div className="chart-card">
              <h3>Agent Performance Comparison</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={agentMetrics}
                    onClick={handleAgentClick}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="tasksCompleted" name="Tasks Completed" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="successRate" name="Success Rate (%)" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3>Task Type Distribution</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {taskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'performance' && (
        <div className="performance-view">
          <div className="chart-card">
            <h3>Performance Trends Over Time</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={performanceTrends}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="tasksCompleted" 
                    name="Tasks Completed" 
                    stroke="#8884d8" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="successRate" 
                    name="Success Rate (%)" 
                    stroke="#82ca9d" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3>Response Time by Agent</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={agentMetrics}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgResponseTime" name="Avg Response Time (ms)" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'distribution' && (
        <div className="distribution-view">
          <div className="chart-card">
            <h3>Task Distribution by Agent</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={agentMetrics}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tasksCompleted" name="Tasks Completed" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3>Error Distribution</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={agentMetrics}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="errorRate" name="Error Rate (%)" fill="#ff6b6b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedAgent && (
        <div className="agent-details-panel">
          <h3>Agent Details: {selectedAgent.name}</h3>
          <div className="agent-metrics">
            <div className="metric-item">
              <span className="metric-label">Tasks Completed:</span>
              <span className="metric-value">{selectedAgent.tasksCompleted}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Success Rate:</span>
              <span className="metric-value">{selectedAgent.successRate}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Avg Response Time:</span>
              <span className="metric-value">{selectedAgent.avgResponseTime}ms</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Error Rate:</span>
              <span className="metric-value">{selectedAgent.errorRate}%</span>
            </div>
          </div>
          <button 
            className="close-button"
            onClick={() => setSelectedAgent(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentVisualization;