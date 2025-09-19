import React, { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import './TaskManagement.css';

const TaskManagement = () => {
  const { state, sendMessage } = useWebSocket();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    description: '',
    priority: 'medium',
  });
  const [filter, setFilter] = useState('all');

  const tasks = state?.project_manifest?.tasks || [];

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const handleCreateTask = () => {
    if (newTask.description.trim() === '') return;

    sendMessage({
      type: 'user_create_task',
      payload: {
        description: newTask.description,
        priority: newTask.priority,
      },
    });

    setNewTask({
      description: '',
      priority: 'medium',
    });
    setShowCreateForm(false);
  };

  const handleTaskAction = (taskId, action) => {
    // In a real implementation, this would call an API to update the task
    console.log(`Performing action ${action} on task ${taskId}`);
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'PENDING': return 'status-pending';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'COMPLETED': return 'status-completed';
      case 'FAILED': return 'status-failed';
      default: return 'status-default';
    }
  };

  return (
    <div className="task-management-container">
      <h2>Task Management</h2>
      
      <div className="task-controls">
        <div className="task-filter">
          <label htmlFor="task-filter">Filter: </label>
          <select 
            id="task-filter"
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Tasks</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        
        <button 
          className="create-task-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create New Task'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-task-form">
          <h3>Create New Task</h3>
          <div className="form-group">
            <label htmlFor="task-description">Description:</label>
            <textarea
              id="task-description"
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              placeholder="Enter task description"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="task-priority">Priority:</label>
            <select
              id="task-priority"
              value={newTask.priority}
              onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="task-agent">Assigned Agent:</label>
            <input
              type="text"
              id="task-agent"
              value={newTask.assigned_agent}
              onChange={(e) => setNewTask({...newTask, assigned_agent: e.target.value})}
              placeholder="Agent name (optional)"
            />
          </div>
          
          <button className="submit-task-button" onClick={handleCreateTask}>
            Create Task
          </button>
        </div>
      )}

      <div className="task-list">
        <h3>Tasks ({filteredTasks.length})</h3>
        {filteredTasks.length > 0 ? (
          <div className="task-items">
            {filteredTasks.map((task) => (
              <div key={task.id} className="task-item">
                <div className="task-header">
                  <span className={`task-status ${getStatusClass(task.status)}`}>
                    {task.status}
                  </span>
                  <span className="task-priority priority-{task.priority}">
                    {task.priority}
                  </span>
                </div>
                
                <div className="task-description">
                  {task.description}
                </div>
                
                <div className="task-meta">
                  <div className="task-id">ID: {task.id}</div>
                  {task.assigned_agent && (
                    <div className="task-agent">Agent: {task.assigned_agent}</div>
                  )}
                  <div className="task-created">
                    Created: {task.created_at ? new Date(task.created_at).toLocaleString() : 'N/A'}
                  </div>
                </div>
                
                <div className="task-actions">
                  {task.status !== 'COMPLETED' && (
                    <button 
                      className="task-action-button"
                      onClick={() => handleTaskAction(task.id, 'start')}
                    >
                      Start
                    </button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <button 
                      className="task-action-button"
                      onClick={() => handleTaskAction(task.id, 'complete')}
                    >
                      Complete
                    </button>
                  )}
                  <button 
                    className="task-action-button"
                    onClick={() => handleTaskAction(task.id, 'edit')}
                  >
                    Edit
                  </button>
                  <button 
                    className="task-action-button task-action-delete"
                    onClick={() => handleTaskAction(task.id, 'delete')}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-tasks">No tasks found</p>
        )}
      </div>
    </div>
  );
};

export default TaskManagement;