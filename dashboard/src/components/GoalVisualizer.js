import React from 'react';
import './GoalVisualizer.css';

const GoalVisualizer = ({ goalSteps }) => {
  return (
    <div className="goal-visualizer-container">
      <h3>Goal Trajectory</h3>
      {goalSteps.length > 0 ? (
        <ul className="goal-steps">
          {goalSteps.map((step, index) => (
            <li key={index} className="goal-step current">
              <div className="step-number">Step {step.step}</div>
              <div className="step-task">{step.task}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No goal is currently being executed.</p>
      )}
    </div>
  );
};

export default GoalVisualizer;
