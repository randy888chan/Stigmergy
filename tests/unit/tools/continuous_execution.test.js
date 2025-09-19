import continuousExecution from '../../../tools/continuous_execution.js';

describe('Continuous Execution Tool', () => {
  describe('findNextExecutableTask', () => {
    it('should find a task with all dependencies met', () => {
      const tasks = [
        { id: 'task1', status: 'COMPLETED', dependencies: [] },
        { id: 'task2', status: 'COMPLETED', dependencies: [] },
        { id: 'task3', status: 'PENDING', dependencies: ['task1', 'task2'] },
        { id: 'task4', status: 'PENDING', dependencies: ['task3'] }
      ];
      
      const result = continuousExecution.findNextExecutableTask(tasks);
      expect(result).toEqual({
        id: 'task3',
        status: 'PENDING',
        dependencies: ['task1', 'task2']
      });
    });
    
    it('should return null when no executable task is found', () => {
      const tasks = [
        { id: 'task1', status: 'PENDING', dependencies: ['task2'] },
        { id: 'task2', status: 'PENDING', dependencies: ['task1'] } // Circular dependency
      ];
      
      const result = continuousExecution.findNextExecutableTask(tasks);
      expect(result).toBeNull();
    });
    
    it('should handle tasks with no dependencies', () => {
      const tasks = [
        { id: 'task1', status: 'PENDING', dependencies: [] },
        { id: 'task2', status: 'COMPLETED', dependencies: [] }
      ];
      
      const result = continuousExecution.findNextExecutableTask(tasks);
      expect(result).toEqual({
        id: 'task1',
        status: 'PENDING',
        dependencies: []
      });
    });
  });
  
  describe('updateTaskStatus', () => {
    it('should update the status of a specific task', () => {
      const tasks = [
        { id: 'task1', status: 'PENDING' },
        { id: 'task2', status: 'PENDING' }
      ];
      
      const result = continuousExecution.updateTaskStatus('task1', 'COMPLETED', tasks);
      expect(result).toEqual([
        { id: 'task1', status: 'COMPLETED' },
        { id: 'task2', status: 'PENDING' }
      ]);
    });
    
    it('should not modify other tasks when updating one task', () => {
      const tasks = [
        { id: 'task1', status: 'PENDING' },
        { id: 'task2', status: 'COMPLETED' }
      ];
      
      const result = continuousExecution.updateTaskStatus('task1', 'IN_PROGRESS', tasks);
      expect(result[1]).toEqual({ id: 'task2', status: 'COMPLETED' });
    });
  });
});