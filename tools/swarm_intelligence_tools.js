import fs from "fs/promises";
import path from "path";

export async function get_failure_patterns() {
  const filePath = path.join(process.cwd(), '.ai', 'swarm_memory', 'failure_reports.jsonl');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    if (!data.trim()) return "No failure reports logged yet.";
    const failures = data.trim().split('\n').map(line => JSON.parse(line));
    if (failures.length === 0) return "No failure reports logged yet.";
    const tagCounts = failures.reduce((acc, f) => {
      (f.tags || []).forEach(tag => { acc[tag] = (acc[tag] || 0) + 1; });
      return acc;
    }, {});
    if (Object.keys(tagCounts).length === 0) return `Analyzed ${failures.length} failures, but no common tags.`;
    const [tag, count] = Object.entries(tagCounts).reduce((a, b) => a[1] > b[1] ? a : b);
    return `Analyzed ${failures.length} failures. Most common pattern (${count} times) is tag: '${tag}'.`;
  } catch (error) {
    if (error.code === 'ENOENT') return "No failure reports logged yet.";
    return `Error analyzing patterns: ${error.message}`;
  }
}

// Placeholder for AgentPerformance integration
export async function getBestAgentForTask({ task_type }) {
    console.log(`[Swarm Intelligence] getBestAgentForTask called for: ${task_type}`);
    return `Default agent is recommended for '${task_type}'.`;
}
