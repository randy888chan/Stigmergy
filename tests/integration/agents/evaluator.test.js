import fs from 'fs-extra';
import path from 'path';

describe('Evaluator Agent Integration', () => {
  test('should generate three solutions for GRAND_BLUEPRINT_PHASE', async () => {
    // This test verifies that the dispatcher agent has the ENSEMBLE_DECISION_MAKING_PROTOCOL
    // which is responsible for generating three different solutions
    
    const dispatcherPath = path.join(process.cwd(), '.stigmergy-core', 'agents', 'dispatcher.md');
    const dispatcherContent = await fs.readFile(dispatcherPath, 'utf8');
    
    expect(dispatcherContent).toContain('ENSEMBLE_DECISION_MAKING_PROTOCOL');
    expect(dispatcherContent).toContain('generate three different solutions');
    expect(dispatcherContent).toContain('delegate to the `@evaluator` agent');
  });

  test('should delegate to evaluator agent via stigmergy.task', async () => {
    // This test verifies that the dispatcher correctly uses stigmergy.task
    // to delegate to the evaluator agent with multiple solutions
    
    const dispatcherPath = path.join(process.cwd(), '.stigmergy-core', 'agents', 'dispatcher.md');
    const dispatcherContent = await fs.readFile(dispatcherPath, 'utf8');
    
    expect(dispatcherContent).toContain('stigmergy.task');
    expect(dispatcherContent).toContain('delegate to the `@evaluator` agent');
  });

  test('evaluator agent should have ENSEMBLE_EVALUATION_PROTOCOL', async () => {
    const evaluatorPath = path.join(process.cwd(), '.stigmergy-core', 'agents', 'evaluator.md');
    const evaluatorContent = await fs.readFile(evaluatorPath, 'utf8');
    
    expect(evaluatorContent).toContain('ENSEMBLE_EVALUATION_PROTOCOL');
    expect(evaluatorContent).toContain('evaluate multiple solutions');
    expect(evaluatorContent).toContain('select the best one');
  });

  test('evaluator agent should analyze and compare solutions', async () => {
    const evaluatorPath = path.join(process.cwd(), '.stigmergy-core', 'agents', 'evaluator.md');
    const evaluatorContent = await fs.readFile(evaluatorPath, 'utf8');
    
    expect(evaluatorContent).toContain('Analyze');
    expect(evaluatorContent).toContain('Compare');
    expect(evaluatorContent).toContain('Rank');
    expect(evaluatorContent).toContain('Select');
  });
});