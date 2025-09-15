import React from 'react';
import './TaskProgress.css';

const TaskProgress = ({ state }) => {
  const tasks = state.project_manifest?.tasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="task-progress-container">
      <h2>Task Progress</h2>
      <div className="progress-section">
        <div className="progress-bar-container">
          <div 
            id="progress-bar" 
            className="progress-bar" 
            style={{ width: `${progressPercentage}%` }}
          >
            {progressPercentage}%
          </div>
        </div>
        <p id="progress-text">{completedTasks}/{totalTasks} Tasks Completed</p>
      </div>
    </div>
  );
};

export default TaskProgress;