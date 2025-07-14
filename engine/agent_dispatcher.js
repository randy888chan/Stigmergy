function agentDispatcher(state) {
  // Simple logic for now. The engine can call this to decide
  // the next agent in a fully autonomous loop. For now, it's
  // primarily driven by user selection in the IDE.
  const getNextAgent = () => {
    switch (state.project_status) {
      case 'NEEDS_BRIEFING':
        return 'analyst'; // Mary
      case 'NEEDS_PLANNING':
        return 'design-architect'; // Winston
      case 'READY_FOR_EXECUTION':
        return 'dispatcher'; // Saul
      default:
        // Default to a general-purpose agent if state is unknown
        return 'dispatcher';
    }
  };

  return { getNextAgent };
}

module.exports = agentDispatcher;
