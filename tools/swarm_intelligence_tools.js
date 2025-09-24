import * as fs from "fs/promises";
import path from "path";

/**
 * Enhanced failure pattern analysis with root cause identification
 */
export async function get_failure_patterns({ reportsPath = null } = {}) {
  const filePath = reportsPath || path.join(process.cwd(), '.ai', 'swarm_memory', 'failure_reports.jsonl');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    if (!data.trim()) return "No failure reports logged yet.";
    
    const failures = data.trim().split('\n').map(line => {
        try {
            return JSON.parse(line);
        } catch (e) {
            return null;
        }
    }).filter(Boolean);

    if (failures.length === 0) return "No failure reports logged yet.";
    
    // Enhanced analysis with trends and patterns
    const analysis = {
      total_failures: failures.length,
      recent_failures: failures.filter(f => 
        new Date(f.timestamp || f.created_at) > new Date(Date.now() - 7*24*60*60*1000)
      ).length,
      tag_patterns: {},
      agent_patterns: {},
      tool_patterns: {},
      trends: []
    };
    
    failures.forEach(failure => {
      // Tag analysis
      (failure.tags || []).forEach(tag => {
        analysis.tag_patterns[tag] = (analysis.tag_patterns[tag] || 0) + 1;
      });
      
      // Agent analysis
      if (failure.agent) {
        analysis.agent_patterns[failure.agent] = (analysis.agent_patterns[failure.agent] || 0) + 1;
      }
      
      // Tool analysis
      if (failure.tool) {
        analysis.tool_patterns[failure.tool] = (analysis.tool_patterns[failure.tool] || 0) + 1;
      }
    });
    
    // Find top patterns
    const topTag = Object.entries(analysis.tag_patterns)
      .sort((a, b) => b[1] - a[1])[0];
    const topAgent = Object.entries(analysis.agent_patterns)
      .sort((a, b) => b[1] - a[1])[0];
    const topTool = Object.entries(analysis.tool_patterns)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      summary: `Analyzed ${analysis.total_failures} failures (${analysis.recent_failures} in last 7 days)`,
      top_patterns: {
        tag: topTag ? `${topTag[0]} (${topTag[1]} occurrences)` : 'None',
        agent: topAgent ? `${topAgent[0]} (${topAgent[1]} failures)` : 'None', 
        tool: topTool ? `${topTool[0]} (${topTool[1]} failures)` : 'None'
      },
      detailed_analysis: analysis,
      recommendations: generateFailureRecommendations(analysis)
    };
  } catch (error) {
    if (error.code === 'ENOENT') return "No failure reports logged yet.";
    return `Error analyzing patterns: ${error.message}`;
  }
}

/**
 * Get agent performance metrics from agent_performance.js logs
 */
export async function get_agent_performance_metrics({ time_window_hours = 168 }) { // Default 7 days
  try {
    // Try to read performance data from engine/agent_performance.js tracking
    const performanceFile = path.join(process.cwd(), '.ai', 'performance', 'agent_metrics.jsonl');
    
    let performances = [];
    try {
      const data = await fs.readFile(performanceFile, 'utf8');
      performances = data.trim().split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line))
        .filter(p => new Date(p.timestamp) > new Date(Date.now() - time_window_hours * 60 * 60 * 1000));
    } catch (e) {
      // File doesn't exist yet, return empty analysis
    }
    
    const metrics = {
      total_tasks: performances.length,
      agents: {},
      overall_success_rate: 0,
      average_execution_time: 0
    };
    
    if (performances.length === 0) {
      return {
        summary: 'No performance data available yet',
        metrics,
        recommendations: ['Start executing tasks to generate performance data']
      };
    }
    
    // Analyze per-agent performance
    performances.forEach(perf => {
      const agent = perf.agent_id || 'unknown';
      if (!metrics.agents[agent]) {
        metrics.agents[agent] = {
          total_tasks: 0,
          successful_tasks: 0,
          failed_tasks: 0,
          total_time: 0,
          success_rate: 0,
          avg_time: 0
        };
      }
      
      const agentMetrics = metrics.agents[agent];
      agentMetrics.total_tasks++;
      
      if (perf.success || perf.status === 'success') {
        agentMetrics.successful_tasks++;
      } else {
        agentMetrics.failed_tasks++;
      }
      
      if (perf.execution_time || perf.duration) {
        agentMetrics.total_time += perf.execution_time || perf.duration;
      }
    });
    
    // Calculate derived metrics
    let totalSuccessful = 0;
    let totalTime = 0;
    
    Object.values(metrics.agents).forEach(agent => {
      agent.success_rate = agent.total_tasks > 0 ? 
        Math.round((agent.successful_tasks / agent.total_tasks) * 100) : 0;
      agent.avg_time = agent.total_tasks > 0 ? 
        Math.round(agent.total_time / agent.total_tasks) : 0;
      
      totalSuccessful += agent.successful_tasks;
      totalTime += agent.total_time;
    });
    
    metrics.overall_success_rate = Math.round((totalSuccessful / performances.length) * 100);
    metrics.average_execution_time = Math.round(totalTime / performances.length);
    
    return {
      summary: `Analyzed ${performances.length} tasks over ${time_window_hours} hours`,
      metrics,
      recommendations: generatePerformanceRecommendations(metrics)
    };
    
  } catch (error) {
    return `Error analyzing performance metrics: ${error.message}`;
  }
}

/**
 * Get tool usage statistics to identify underutilized or problematic tools
 */
export async function get_tool_usage_statistics({ time_window_hours = 168 }) {
  try {
    const toolUsageFile = path.join(process.cwd(), '.ai', 'tools', 'usage_stats.jsonl');
    
    let usages = [];
    try {
      const data = await fs.readFile(toolUsageFile, 'utf8');
      usages = data.trim().split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line))
        .filter(u => new Date(u.timestamp) > new Date(Date.now() - time_window_hours * 60 * 60 * 1000));
    } catch (e) {
      // File doesn't exist yet
    }
    
    const stats = {
      total_tool_calls: usages.length,
      tools: {},
      success_rate_by_tool: {},
      most_used_tools: [],
      least_used_tools: [],
      problematic_tools: []
    };
    
    if (usages.length === 0) {
      return {
        summary: 'No tool usage data available yet',
        stats,
        recommendations: ['Tool usage tracking will begin once agents start working']
      };
    }
    
    // Analyze tool usage patterns
    usages.forEach(usage => {
      const tool = usage.tool_name || 'unknown';
      if (!stats.tools[tool]) {
        stats.tools[tool] = {
          total_calls: 0,
          successful_calls: 0,
          failed_calls: 0,
          total_time: 0,
          avg_time: 0,
          success_rate: 0
        };
      }
      
      const toolStats = stats.tools[tool];
      toolStats.total_calls++;
      
      if (usage.success || usage.status === 'success') {
        toolStats.successful_calls++;
      } else {
        toolStats.failed_calls++;
      }
      
      if (usage.execution_time) {
        toolStats.total_time += usage.execution_time;
      }
    });
    
    // Calculate derived metrics and rankings
    const toolEntries = Object.entries(stats.tools);
    
    toolEntries.forEach(([tool, toolStats]) => {
      toolStats.success_rate = toolStats.total_calls > 0 ?
        Math.round((toolStats.successful_calls / toolStats.total_calls) * 100) : 0;
      toolStats.avg_time = toolStats.total_calls > 0 ?
        Math.round(toolStats.total_time / toolStats.total_calls) : 0;
    });
    
    // Rankings
    stats.most_used_tools = toolEntries
      .sort((a, b) => b[1].total_calls - a[1].total_calls)
      .slice(0, 5)
      .map(([tool, stats]) => ({ tool, calls: stats.total_calls }));
      
    stats.problematic_tools = toolEntries
      .filter(([tool, stats]) => stats.success_rate < 70 && stats.total_calls > 5)
      .sort((a, b) => a[1].success_rate - b[1].success_rate)
      .slice(0, 3)
      .map(([tool, stats]) => ({ tool, success_rate: stats.success_rate }));
    
    return {
      summary: `Analyzed ${usages.length} tool calls over ${time_window_hours} hours`,
      stats,
      recommendations: generateToolUsageRecommendations(stats)
    };
    
  } catch (error) {
    return `Error analyzing tool usage: ${error.message}`;
  }
}

/**
 * Generate recommendations based on failure analysis
 */
function generateFailureRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.recent_failures > analysis.total_failures * 0.5) {
    recommendations.push('High recent failure rate detected - investigate system changes');
  }
  
  const topFailureAgent = Object.entries(analysis.agent_patterns)
    .sort((a, b) => b[1] - a[1])[0];
  if (topFailureAgent && topFailureAgent[1] > 3) {
    recommendations.push(`Agent ${topFailureAgent[0]} has ${topFailureAgent[1]} failures - review its protocols`);
  }
  
  const topFailureTool = Object.entries(analysis.tool_patterns)
    .sort((a, b) => b[1] - a[1])[0];
  if (topFailureTool && topFailureTool[1] > 2) {
    recommendations.push(`Tool ${topFailureTool[0]} failing frequently - check implementation or dependencies`);
  }
  
  return recommendations;
}

/**
 * Generate recommendations based on performance metrics
 */
function generatePerformanceRecommendations(metrics) {
  const recommendations = [];
  
  if (metrics.overall_success_rate < 85) {
    recommendations.push('Overall success rate below 85% - review agent protocols and error handling');
  }
  
  Object.entries(metrics.agents).forEach(([agent, stats]) => {
    if (stats.success_rate < 70) {
      recommendations.push(`Agent ${agent} has low success rate (${stats.success_rate}%) - needs protocol improvement`);
    }
    
    if (stats.avg_time > 300000) { // 5 minutes
      recommendations.push(`Agent ${agent} has high average execution time - consider optimization`);
    }
  });
  
  return recommendations;
}

/**
 * Generate recommendations based on tool usage statistics
 */
function generateToolUsageRecommendations(stats) {
  const recommendations = [];
  
  if (stats.problematic_tools.length > 0) {
    stats.problematic_tools.forEach(({tool, success_rate}) => {
      recommendations.push(`Tool ${tool} has low success rate (${success_rate}%) - investigate and improve`);
    });
  }
  
  // Check for underutilized tools that might be valuable
  const allTools = Object.keys(stats.tools);
  const commonTools = ['file_system', 'research', 'code_intelligence'];
  
  commonTools.forEach(tool => {
    if (!allTools.includes(tool)) {
      recommendations.push(`Consider implementing ${tool} tools for better agent capabilities`);
    }
  });
  
  return recommendations;
}

/**
 * Enhanced agent recommendation based on performance data
 */
export async function getBestAgentForTask({ task_type }) {
    console.log(`[Swarm Intelligence] getBestAgentForTask called for: ${task_type}`);
    
    try {
        const performanceData = await get_agent_performance_metrics({ time_window_hours: 336 }); // 2 weeks
        
        if (!performanceData.metrics || !performanceData.metrics.agents) {
            return `Default agent is recommended for '${task_type}' (no performance data available).`;
        }
        
        // Task type to agent mapping with performance consideration
        const taskAgentMap = {
            'development': ['dev', 'enhanced-dev'],
            'testing': ['qa'],
            'research': ['analyst'],
            'planning': ['business_planner', 'ux-expert'],
            'debugging': ['debugger'],
            'architecture': ['reference-architect', 'design-architect']
        };
        
        const candidateAgents = taskAgentMap[task_type] || ['dev'];
        let bestAgent = candidateAgents[0];
        let bestScore = 0;
        
        candidateAgents.forEach(agent => {
            const agentStats = performanceData.metrics.agents[agent];
            if (agentStats) {
                // Score based on success rate and experience (total tasks)
                const score = (agentStats.success_rate * 0.7) + (Math.min(agentStats.total_tasks, 50) * 0.6);
                if (score > bestScore) {
                    bestScore = score;
                    bestAgent = agent;
                }
            }
        });
        
        const agentStats = performanceData.metrics.agents[bestAgent];
        const reason = agentStats ? 
            `success rate: ${agentStats.success_rate}%, tasks completed: ${agentStats.total_tasks}` :
            'default selection';
            
        return `Recommended agent '${bestAgent}' for '${task_type}' (${reason}).`;
    } catch (error) {
        console.warn('Error in getBestAgentForTask:', error.message);
        return `Default agent is recommended for '${task_type}' (error in analysis: ${error.message}).`;
    }
}

/**
 * System health overview combining all metrics
 */
export async function get_system_health_overview() {
    try {
        const [failures, performance, toolUsage] = await Promise.all([
            get_failure_patterns(),
            get_agent_performance_metrics({ time_window_hours: 168 }),
            get_tool_usage_statistics({ time_window_hours: 168 })
        ]);
        
        const health = {
            overall_health: 'good', // Will be calculated
            metrics: {
                failures,
                performance, 
                toolUsage
            },
            alerts: [],
            recommendations: []
        };
        
        // Determine overall health
        let healthScore = 100;
        
        if (typeof performance.metrics === 'object' && performance.metrics.overall_success_rate < 80) {
            healthScore -= 20;
            health.alerts.push('Low overall success rate');
        }
        
        if (typeof failures.detailed_analysis === 'object' && failures.detailed_analysis.recent_failures > 10) {
            healthScore -= 15;
            health.alerts.push('High recent failure rate');
        }
        
        if (typeof toolUsage.stats === 'object' && toolUsage.stats.problematic_tools.length > 2) {
            healthScore -= 10;
            health.alerts.push('Multiple problematic tools');
        }
        
        health.overall_health = healthScore >= 80 ? 'good' : healthScore >= 60 ? 'warning' : 'critical';
        
        // Combine recommendations
        [failures, performance, toolUsage].forEach(metric => {
            if (metric.recommendations) {
                health.recommendations.push(...metric.recommendations);
            }
        });
        
        return health;
    } catch (error) {
        return {
            overall_health: 'error',
            error: error.message,
            recommendations: ['Check system logs and configuration']
        };
    }
}

/**
 * Get tool error analysis from model monitoring logs
 */
export async function get_tool_error_analysis({ time_window_hours = 168 }) {
    try {
        // Import dynamically to avoid circular dependencies
        const { getToolErrorPatterns } = await import('../services/model_monitoring.js');
        
        const errorAnalysis = await getToolErrorPatterns({ time_window_hours });
        
        // Enhance with trend analysis
        const enhanced = {
            ...errorAnalysis,
            insights: generateErrorInsights(errorAnalysis.patterns),
            priority_actions: generatePriorityActions(errorAnalysis.patterns)
        };
        
        return enhanced;
    } catch (error) {
        return {
            summary: 'Error analysis unavailable',
            error: error.message,
            recommendations: ['Check model monitoring service configuration']
        };
    }
}

/**
 * Generate insights from error patterns
 */
function generateErrorInsights(patterns) {
    const insights = [];
    
    // Tool reliability insights
    const toolErrors = Object.entries(patterns.by_tool || {});
    if (toolErrors.length > 0) {
        const mostProblematicTool = toolErrors.sort((a, b) => b[1] - a[1])[0];
        insights.push({
            type: 'tool_reliability',
            message: `Tool '${mostProblematicTool[0]}' accounts for ${mostProblematicTool[1]} errors`,
            severity: mostProblematicTool[1] > 5 ? 'high' : 'medium'
        });
    }
    
    // Error type insights
    const typeErrors = Object.entries(patterns.by_type || {});
    if (typeErrors.length > 0) {
        const dominantType = typeErrors.sort((a, b) => b[1] - a[1])[0];
        insights.push({
            type: 'error_category',
            message: `Most common error type: ${dominantType[0]} (${dominantType[1]} occurrences)`,
            severity: dominantType[1] > 10 ? 'high' : 'medium'
        });
    }
    
    // Severity insights
    const criticalErrors = patterns.by_severity?.critical || 0;
    const highErrors = patterns.by_severity?.high || 0;
    
    if (criticalErrors > 0 || highErrors > 5) {
        insights.push({
            type: 'severity_alert',
            message: `High-impact errors detected: ${criticalErrors} critical, ${highErrors} high priority`,
            severity: 'critical'
        });
    }
    
    return insights;
}

/**
 * Generate priority actions based on error patterns
 */
function generatePriorityActions(patterns) {
    const actions = [];
    
    // Critical tool failures
    const toolErrors = Object.entries(patterns.by_tool || {})
        .sort((a, b) => b[1] - a[1]);
    
    if (toolErrors.length > 0 && toolErrors[0][1] > 5) {
        actions.push({
            priority: 1,
            action: 'investigate_tool_failure',
            tool: toolErrors[0][0],
            description: `Investigate and fix recurring failures in ${toolErrors[0][0]} tool`,
            impact: 'high'
        });
    }
    
    // Network/timeout issues
    const timeoutErrors = patterns.by_type?.timeout || 0;
    const networkErrors = patterns.by_type?.network || 0;
    
    if (timeoutErrors + networkErrors > 3) {
        actions.push({
            priority: 2,
            action: 'optimize_network_reliability',
            description: 'Address network connectivity and timeout issues',
            impact: 'medium'
        });
    }
    
    // Permission issues
    const permissionErrors = patterns.by_type?.permission || 0;
    if (permissionErrors > 2) {
        actions.push({
            priority: 3,
            action: 'review_permissions',
            description: 'Review and fix file/API permission configurations',
            impact: 'medium'
        });
    }
    
    return actions.sort((a, b) => a.priority - b.priority);
}
