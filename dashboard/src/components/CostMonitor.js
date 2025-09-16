import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './CostMonitor.css';

const CostMonitor = () => {
  const [costData, setCostData] = useState({
    totalCost: 0,
    todayCost: 0,
    thisWeekCost: 0,
    thisMonthCost: 0,
    providers: [],
    chartData: []
  });

  // Mock data for demonstration
  useEffect(() => {
    // In a real implementation, this would come from the WebSocket connection
    const mockData = {
      totalCost: 12.45,
      todayCost: 2.30,
      thisWeekCost: 8.75,
      thisMonthCost: 12.45,
      providers: [
        { name: 'OpenAI', cost: 7.80, tokens: 125000 },
        { name: 'Google', cost: 3.25, tokens: 89000 },
        { name: 'OpenRouter', cost: 1.40, tokens: 45000 }
      ],
      chartData: [
        { date: '2023-05-01', cost: 1.2 },
        { date: '2023-05-02', cost: 2.5 },
        { date: '2023-05-03', cost: 1.8 },
        { date: '2023-05-04', cost: 3.1 },
        { date: '2023-05-05', cost: 2.9 },
        { date: '2023-05-06', cost: 1.7 },
        { date: '2023-05-07', cost: 2.3 }
      ]
    };
    
    setCostData(mockData);
  }, []);

  return (
    <div className="cost-monitor">
      <h3>Cost Monitoring</h3>
      
      <div className="cost-summary">
        <div className="cost-item">
          <h4>Total Cost</h4>
          <div className="cost-value">${costData.totalCost.toFixed(2)}</div>
        </div>
        <div className="cost-item">
          <h4>Today</h4>
          <div className="cost-value">${costData.todayCost.toFixed(2)}</div>
        </div>
        <div className="cost-item">
          <h4>This Week</h4>
          <div className="cost-value">${costData.thisWeekCost.toFixed(2)}</div>
        </div>
        <div className="cost-item">
          <h4>This Month</h4>
          <div className="cost-value">${costData.thisMonthCost.toFixed(2)}</div>
        </div>
      </div>
      
      <div className="cost-chart">
        <h4>Daily Cost Trend</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={costData.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Cost']} />
            <Line 
              type="monotone" 
              dataKey="cost" 
              stroke="#8884d8" 
              activeDot={{ r: 8 }} 
              name="Cost ($)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="providers-list">
        <h4>Provider Breakdown</h4>
        {costData.providers.map((provider, index) => (
          <div key={index} className="provider-item">
            <div className="provider-name">{provider.name}</div>
            <div className="provider-cost">${provider.cost.toFixed(2)}</div>
            <div className="provider-tokens">{provider.tokens.toLocaleString()} tokens</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostMonitor;