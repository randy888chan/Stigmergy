# Stigmergy Observability Guide

## Overview

Stigmergy provides comprehensive observability features to monitor system performance, track costs, and analyze agent behavior. This guide covers the built-in monitoring capabilities and how to access observability data.

## Cost Monitoring

### Real-time Cost Tracking

Stigmergy tracks costs for all LLM operations across different providers:

- **Total Cost**: Cumulative cost since system initialization
- **Daily Cost**: Cost incurred today
- **Weekly Cost**: Cost incurred in the last 7 days
- **Monthly Cost**: Cost incurred in the last 30 days
- **Provider Breakdown**: Cost per LLM provider

### Supported Providers

Cost tracking is supported for all major LLM providers:
- OpenAI (GPT-4, GPT-3.5, etc.)
- Google (Gemini Pro, Gemini Flash, etc.)
- Anthropic (Claude models)
- Mistral (Mistral Large, Medium, etc.)
- DeepSeek (Chat, Coder, etc.)

### Accessing Cost Data

#### Via Dashboard
The cost monitoring dashboard provides real-time visualization of:
- Daily cost trends (line chart)
- Provider cost breakdown
- Total, daily, weekly, and monthly costs

#### Via API
```bash
# Get current cost tracking data
curl http://localhost:3010/api/cost
```

#### Programmatic Access
```javascript
import { getCostTracking } from './engine/llm_adapter.js';

const costData = getCostTracking();
console.log('Total cost:', costData.totalCost);
console.log('Daily cost:', costData.dailyCost);
console.log('Provider costs:', costData.providerCosts);
```

## Trajectory Recording

### What is Trajectory Recording?

Trajectory recording captures the complete execution path of agent tasks, including:
- LLM interactions
- Tool calls
- State changes
- Decision points
- Error conditions

### Recording Structure

Each trajectory recording contains:
```json
{
  "id": "unique-recording-id",
  "taskId": "agent_task_identifier",
  "startTime": "ISO timestamp",
  "endTime": "ISO timestamp",
  "events": [
    {
      "id": "event-id",
      "timestamp": "ISO timestamp",
      "type": "event-type",
      "data": { /* event-specific data */ }
    }
  ],
  "context": { /* initial context */ },
  "finalState": { /* final state data */ }
}
```

### Event Types

- `recording_started`: Initial recording event
- `llm_interaction`: LLM API calls with prompts and responses
- `tool_call`: Tool execution requests
- `state_change`: System state modifications
- `decision`: Agent decision points
- `error`: Error conditions and exceptions
- `recording_finalized`: Final recording event

### Accessing Trajectories

Trajectory recordings are stored in:
- `.stigmergy/trajectories/` (new projects)
- `.stigmergy-core/trajectories/` (legacy projects)

## Performance Monitoring

### Agent Performance Metrics

Stigmergy tracks performance metrics for all agents:
- Response times
- Success rates
- Error rates
- Token usage
- Cost per operation

### System Performance

System-level performance monitoring includes:
- Memory usage
- CPU utilization
- Network latency
- Database performance
- WebSocket connection status

## Evaluation and Benchmarking

### Built-in Benchmark Suite

Stigmergy includes a comprehensive benchmark suite to evaluate system performance:

#### Benchmark Categories
1. **Simple Tasks**: Basic file creation and manipulation
2. **Medium Complexity**: API implementation and component development
3. **Complex Tasks**: Database integration and system architecture

#### Running Benchmarks
```bash
# Run the full benchmark suite
stigmergy test:benchmark

# Run specific benchmark categories
stigmergy test:benchmark --category simple
stigmergy test:benchmark --category medium
stigmergy test:benchmark --category complex
```

### Benchmark Problems

The benchmark suite includes several predefined problems to test different aspects of the system:

1. **Simple File Creation Task**: Creates a JavaScript file with a factorial function
2. **API Endpoint Implementation**: Implements a REST API with Express.js
3. **React Component Development**: Creates React components with search functionality
4. **Database Integration Task**: Implements database integration with Mongoose/Sequelize
5. **Testing Implementation**: Adds unit tests using Jest

### Custom Benchmark Creation

Create custom benchmarks by defining problems in `evaluation/benchmark.json`:

```json
{
  "benchmark": {
    "name": "Custom Benchmark",
    "version": "1.0.0",
    "problems": [
      {
        "id": "custom-1",
        "title": "Custom Problem",
        "description": "Problem description",
        "expected_files": ["expected_file.js"],
        "success_criteria": ["Criterion 1", "Criterion 2"],
        "difficulty": "medium"
      }
    ]
  }
}
```

### Benchmark Runner Implementation

The benchmark runner (`evaluation/runners/benchmark_runner.js`) executes benchmarks by:

1. Creating temporary directories for each problem
2. Initializing Stigmergy in each directory
3. Running the system to solve the problem
4. Validating the solution against success criteria
5. Cleaning up temporary files
6. Reporting results

The runner supports both service mode (connecting to a running Stigmergy service) and direct execution mode.

### Performance Metrics Collection

During benchmark execution, the system collects various performance metrics:

- **Execution Time**: Time taken to complete each task
- **Success Rate**: Percentage of successfully completed tasks
- **Resource Usage**: Memory and CPU consumption
- **LLM Interaction Count**: Number of LLM calls made
- **Token Usage**: Total tokens consumed during execution

### Benchmark Results Analysis

Results are saved to `evaluation/results.json` and include:

- Timestamp of execution
- Benchmark name and version
- Individual problem results
- Success/failure status for each problem
- Execution duration for each problem
- Any errors encountered

### Integration with CI/CD

Benchmarks can be integrated into CI/CD pipelines to monitor performance regressions:

```bash
# Run benchmarks and fail if success rate is below threshold
stigmergy test:benchmark && node scripts/check-benchmark-results.js
```

## Dashboard Monitoring

### Real-time Dashboard

The Stigmergy dashboard provides real-time monitoring of:
- Agent orchestration status
- System state
- Task management
- Code browsing
- Cost monitoring
- Process management
- Agent visualization
- File editing

### Accessing the Dashboard

```bash
# Start Stigmergy with dashboard
stigmergy start-service

# Access dashboard at
http://localhost:3010
```

## Logging and Debugging

### Log Levels

Stigmergy uses the following log levels:
- **ERROR**: Critical system errors
- **WARN**: Warning conditions
- **INFO**: General information
- **DEBUG**: Debug-level information
- **TRACE**: Detailed trace information

### Log Output

Logs are output to:
- Console (standard output)
- Log files (configurable)
- Dashboard (real-time)

### Debugging Tools

#### Agent Debugging
```bash
# Enable debug logging for specific agents
STIGMERGY_DEBUG=agent-name stigmergy start-service
```

#### System Debugging
```bash
# Enable verbose logging
STIGMERGY_DEBUG=all stigmergy start-service
```

## Alerting and Notifications

### Built-in Alerts

Stigmergy provides built-in alerting for:
- Cost threshold exceeded
- Performance degradation
- System errors
- Agent failures

### Custom Alert Configuration

Configure custom alerts in `.stigmergy/config.js`:

```javascript
export default {
  alerts: {
    costThreshold: 10.00, // Alert when daily cost exceeds $10
    performanceThreshold: 5000, // Alert when response time exceeds 5s
    errorRateThreshold: 0.1 // Alert when error rate exceeds 10%
  }
};
```

## Integration with External Monitoring

### Prometheus Integration

Export metrics to Prometheus:
```bash
# Enable Prometheus metrics endpoint
STIGMERGY_PROMETHEUS=true stigmergy start-service

# Metrics available at
http://localhost:3010/metrics
```

### Grafana Dashboards

Pre-built Grafana dashboards are available for:
- Cost monitoring
- Performance metrics
- Agent behavior analysis
- System health

## Best Practices

### Monitoring Setup

1. **Enable Cost Tracking**: Always monitor LLM costs
2. **Review Trajectories**: Regularly analyze agent trajectories
3. **Run Benchmarks**: Periodically evaluate system performance
4. **Check Alerts**: Configure and monitor system alerts
5. **Use Dashboard**: Leverage real-time dashboard monitoring

### Performance Optimization

1. **Provider Selection**: Choose cost-effective providers for different tasks
2. **Caching**: Implement caching for frequent operations
3. **Batching**: Batch similar operations when possible
4. **Monitoring**: Continuously monitor performance metrics

### Troubleshooting

1. **Check Logs**: Review system logs for error conditions
2. **Analyze Trajectories**: Examine trajectory recordings for issues
3. **Run Health Checks**: Use built-in health check commands
4. **Review Benchmarks**: Compare performance against benchmarks