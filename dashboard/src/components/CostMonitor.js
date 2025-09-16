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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCostData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/cost');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Transform the data for the dashboard
        const transformedData = {
          totalCost: data.totalCost || 0,
          todayCost: data.dailyCost || 0,
          thisWeekCost: calculateWeeklyCost(data.dailyCostHistory),
          thisMonthCost: calculateMonthlyCost(data.dailyCostHistory),
          providers: Object.entries(data.providerCosts || {}).map(([name, cost]) => ({
            name,
            cost: cost || 0,
            tokens: 0 // We don't have token data in the current implementation
          })),
          chartData: (data.dailyCostHistory || []).map(entry => ({
            date: entry.date,
            cost: entry.cost || 0
          }))
        };
        
        setCostData(transformedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching cost data:', err);
        setError('Failed to load cost data');
      } finally {
        setLoading(false);
      }
    };

    // Fetch data immediately
    fetchCostData();
    
    // Set up polling to refresh data every 30 seconds
    const intervalId = setInterval(fetchCostData, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Helper functions to calculate weekly and monthly costs
  const calculateWeeklyCost = (dailyHistory) => {
    if (!dailyHistory || dailyHistory.length === 0) return 0;
    
    // Get the last 7 days
    const recentDays = dailyHistory.slice(-7);
    return recentDays.reduce((sum, day) => sum + (day.cost || 0), 0);
  };

  const calculateMonthlyCost = (dailyHistory) => {
    if (!dailyHistory || dailyHistory.length === 0) return 0;
    
    // Get the last 30 days
    const recentDays = dailyHistory.slice(-30);
    return recentDays.reduce((sum, day) => sum + (day.cost || 0), 0);
  };

  if (loading) {
    return (
      <div className="cost-monitor">
        <h3>Cost Monitoring</h3>
        <div className="loading">Loading cost data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cost-monitor">
        <h3>Cost Monitoring</h3>
        <div className="error">{error}</div>
      </div>
    );
  }

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
        {costData.providers.length > 0 ? (
          costData.providers.map((provider, index) => (
            <div key={index} className="provider-item">
              <div className="provider-name">{provider.name}</div>
              <div className="provider-cost">${provider.cost.toFixed(2)}</div>
              {provider.tokens > 0 && (
                <div className="provider-tokens">{provider.tokens.toLocaleString()} tokens</div>
              )}
            </div>
          ))
        ) : (
          <div className="no-providers">No provider data available</div>
        )}
      </div>
    </div>
  );
};

export default CostMonitor;