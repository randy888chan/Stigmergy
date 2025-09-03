// Mock research graph for testing purposes
// This is a placeholder file to resolve test imports

export const researchGraph = {
  async invoke({ topic, learnings = [] }) {
    console.log(`[Mock Research Graph] Processing topic: ${topic}`);
    return {
      final_report: `Mock research report for: ${topic}`,
      learnings: learnings,
      sources: []
    };
  }
};

export default researchGraph;