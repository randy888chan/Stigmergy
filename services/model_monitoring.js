import * as fs from 'fs-extra';
import path from 'path';

const METRICS_FILE = path.join(process.cwd(), ".ai", "monitoring", "events.jsonl");
const TOOL_ERRORS_FILE = path.join(process.cwd(), ".ai", "monitoring", "tool_errors.jsonl");
const PERFORMANCE_FILE = path.join(process.cwd(), ".ai", "performance", "agent_metrics.jsonl");
const TOOL_USAGE_FILE = path.join(process.cwd(), ".ai", "tools", "usage_stats.jsonl");

async function appendLog(logData, filename = METRICS_FILE) {
  await fs.ensureDir(path.dirname(filename));
  const logString = JSON.stringify({ timestamp: new Date().toISOString(), ...logData });
  await fs.appendFile(filename, logString + '\n');
}

/**
 * Track task execution outcomes for performance analysis
 */
export async function trackTaskSuccess({ taskId, success, agentId, failureReason, executionTime, taskType }) {
  await appendLog({ metric: "task_outcome", taskId, success, agentId, failureReason, executionTime, taskType });
  
  // Also log to performance metrics for @metis analysis
  await appendLog({
    agent_id: agentId,
    task_id: taskId,
    task_type: taskType,
    success,
    duration: executionTime,
    failure_reason: failureReason,
    status: success ? 'success' : 'failed'
  }, PERFORMANCE_FILE);
}

/**
 * Track tool usage with enhanced error details for @metis
 */
export async function trackToolUsage({ toolName, success, agentId, executionTime, error, parameters, result }) {
  await appendLog({ metric: "tool_usage", toolName, success, agentId, executionTime, error });
  
  // Log detailed tool usage for analytics
  await appendLog({
    tool_name: toolName,
    agent_id: agentId,
    success,
    execution_time: executionTime,
    parameters_hash: parameters ? JSON.stringify(parameters).substring(0, 100) : null,
    error_message: error,
    status: success ? 'success' : 'failed'
  }, TOOL_USAGE_FILE);
  
  // If there's an error, log it separately for detailed analysis
  if (!success && error) {
    await trackToolError({
      toolName,
      agentId,
      error,
      parameters,
      executionTime
    });
  }
}

/**
 * Track specific tool errors for @metis analysis
 */
export async function trackToolError({ toolName, agentId, error, parameters, executionTime, context }) {
  const errorData = {
    metric: "tool_error",
    tool_name: toolName,
    agent_id: agentId,
    error_message: error,
    error_type: classifyError(error),
    execution_time: executionTime,
    parameters_sample: parameters ? JSON.stringify(parameters).substring(0, 200) : null,
    context,
    severity: determineSeverity(error)
  };
  
  await appendLog(errorData, TOOL_ERRORS_FILE);
}

/**
 * Classify error types for pattern analysis
 */
function classifyError(error) {
  if (!error || typeof error !== 'string') return 'unknown';
  
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('timeout') || errorLower.includes('timed out')) return 'timeout';
  if (errorLower.includes('network') || errorLower.includes('connection')) return 'network';
  if (errorLower.includes('permission') || errorLower.includes('unauthorized')) return 'permission';
  if (errorLower.includes('not found') || errorLower.includes('enoent')) return 'not_found';
  if (errorLower.includes('syntax') || errorLower.includes('parse')) return 'syntax';
  if (errorLower.includes('memory') || errorLower.includes('out of')) return 'resource';
  if (errorLower.includes('api') || errorLower.includes('rate limit')) return 'api_limit';
  
  return 'application';
}

/**
 * Determine error severity for prioritization
 */
function determineSeverity(error) {
  if (!error || typeof error !== 'string') return 'low';
  
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('critical') || errorLower.includes('fatal')) return 'critical';
  if (errorLower.includes('timeout') || errorLower.includes('network')) return 'high';
  if (errorLower.includes('warning') || errorLower.includes('deprecated')) return 'low';
  
  return 'medium';
}

/**
 * Get tool error patterns for @metis analysis
 */
export async function getToolErrorPatterns({ time_window_hours = 168 }) {
  try {
    const data = await fs.readFile(TOOL_ERRORS_FILE, 'utf8');
    const errors = data.trim().split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .filter(error => 
        new Date(error.timestamp) > new Date(Date.now() - time_window_hours * 60 * 60 * 1000)
      );
    
    if (errors.length === 0) {
      return {
        summary: 'No tool errors in the specified time window',
        patterns: {},
        recommendations: []
      };
    }
    
    const patterns = {
      by_tool: {},
      by_type: {},
      by_severity: {},
      by_agent: {},
      recent_trends: []
    };
    
    errors.forEach(error => {
      // Tool patterns
      patterns.by_tool[error.tool_name] = (patterns.by_tool[error.tool_name] || 0) + 1;
      
      // Type patterns
      patterns.by_type[error.error_type] = (patterns.by_type[error.error_type] || 0) + 1;
      
      // Severity patterns
      patterns.by_severity[error.severity] = (patterns.by_severity[error.severity] || 0) + 1;
      
      // Agent patterns
      patterns.by_agent[error.agent_id] = (patterns.by_agent[error.agent_id] || 0) + 1;
    });
    
    // Generate recommendations
    const recommendations = [];
    
    const topErrorTool = Object.entries(patterns.by_tool)
      .sort((a, b) => b[1] - a[1])[0];
    if (topErrorTool && topErrorTool[1] > 3) {
      recommendations.push(`Tool ${topErrorTool[0]} has ${topErrorTool[1]} errors - investigate implementation`);
    }
    
    const criticalErrors = patterns.by_severity.critical || 0;
    if (criticalErrors > 0) {
      recommendations.push(`${criticalErrors} critical errors detected - immediate attention required`);
    }
    
    const timeoutErrors = patterns.by_type.timeout || 0;
    if (timeoutErrors > 2) {
      recommendations.push(`${timeoutErrors} timeout errors - consider increasing timeout limits or optimizing performance`);
    }
    
    return {
      summary: `Analyzed ${errors.length} tool errors over ${time_window_hours} hours`,
      patterns,
      recommendations,
      total_errors: errors.length
    };
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        summary: 'No tool error data available yet',
        patterns: {},
        recommendations: []
      };
    }
    throw error;
  }
}

/**
 * Track agent performance metrics
 */
export async function trackAgentPerformance({ agentId, taskType, success, executionTime, memoryUsage, quality_score }) {
  await appendLog({
    agent_id: agentId,
    task_type: taskType,
    success,
    execution_time: executionTime,
    memory_usage: memoryUsage,
    quality_score,
    status: success ? 'success' : 'failed'
  }, PERFORMANCE_FILE);
}

/**
 * Clean old monitoring data to prevent excessive disk usage
 */
export async function cleanOldMonitoringData({ retention_days = 30 }) {
  const cutoffDate = new Date(Date.now() - retention_days * 24 * 60 * 60 * 1000);
  
  for (const filename of [METRICS_FILE, TOOL_ERRORS_FILE, PERFORMANCE_FILE, TOOL_USAGE_FILE]) {
    try {
      if (await fs.pathExists(filename)) {
        const data = await fs.readFile(filename, 'utf8');
        const lines = data.trim().split('\n');
        const filteredLines = lines.filter(line => {
          try {
            const entry = JSON.parse(line);
            return new Date(entry.timestamp) > cutoffDate;
          } catch {
            return false;
          }
        });
        
        await fs.writeFile(filename, filteredLines.join('\n') + '\n');
      }
    } catch (error) {
      console.warn(`Failed to clean ${filename}:`, error.message);
    }
  }
}
