import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AgentOrchestration.css';

const AgentOrchestration = ({ state }) => {
  const [agentData, setAgentData] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    if (state && state.performance) {
      // Transform the performance data into a format suitable for the chart
      const data = Object.entries(state.performance).map(([agentName, metrics]) => ({
        name: agentName,
        tasksCompleted: metrics.tasksCompleted || 0,
        avgResponseTime: metrics.avgResponseTime || 0,
        errorRate: metrics.errorRate || 0,
      }));
      setAgentData(data);
    }
  }, [state]);

  const handleAgentClick = (data, index) => {
    setSelectedAgent(data.activePayload ? data.activePayload[0].payload : null);
  };

  return (
    <div className="agent-orchestration-container">
      <h2>Agent Orchestration</h2>
      <div className="agent-visualization">
        <h3>Agent Performance Metrics</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={agentData}
              onClick={handleAgentClick}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tasksCompleted" name="Tasks Completed" fill="#8884d8" />
              <Bar dataKey="avgResponseTime" name="Avg Response Time (ms)" fill="#82ca9d" />
              <Bar dataKey="errorRate" name="Error Rate (%)" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {selectedAgent && (
          <div className="agent-details">
            <h4>Agent Details: {selectedAgent.name}</h4>
            <ul>
              <li>Tasks Completed: {selectedAgent.tasksCompleted}</li>
              <li>Average Response Time: {selectedAgent.avgResponseTime} ms</li>
              <li>Error Rate: {selectedAgent.errorRate}%</li>
            </ul>
          </div>
        )}
        
        <div className="agent-controls">
          <h3>Agent Controls</h3>
          <div className="control-buttons">
            <button className="control-button">Pause All Agents</button>
            <button className="control-button">Resume All Agents</button>
            <button className="control-button">Restart Failed Agents</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentOrchestration;