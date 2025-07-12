function agentDispatcher(state) {
  // Simple logic for now, can be expanded
  const getNextAgent = () => {
    switch (state.project_status) {
      case 'NEEDS_BRIEFING':
        return 'analyst'; // Mary
      case 'NEEDS_PLANNING':
        return 'design-architect'; // Winston
      case 'READY_FOR_EXECUTION':
        return 'dispatcher'; // Saul
      default:
        return 'dispatcher'; // Default to Saul
    }
  };

  return { getNextAgent };
}

module.exports = agentDispatcher;
