# Web Agent Startup Instructions

## Overview
This document provides startup instructions for web agents in the Stigmergy system. Web agents are designed to work within web-based AI environments like ChatGPT and Gemini.

## Startup Commands
Follow these startup commands exactly:

1. Read the task description carefully
2. Identify the required tools and resources
3. Execute the plan step by step
4. Verify the results
5. Report completion

## Resource Navigation
Use START/END tags to navigate resources:
```
[START RESOURCE]
Resource content here
[END RESOURCE]
```

## YAML References
Understand YAML references in agent configuration:
- `<<:` indicates a merge key
- `*reference` refers to an anchor
- `&anchor` defines an anchor

## Web Environment Limitations
Work within web environment limitations:
- Limited file system access
- No direct process execution
- Restricted network access
- Memory constraints

## Output Format
Provide structured outputs for consumption by other agents:
```json
{
  "status": "completed",
  "result": "Description of what was accomplished",
  "next_steps": ["List of recommended next actions"]
}
```

## Error Handling
When encountering errors:
1. Identify the root cause
2. Attempt to resolve if possible
3. Provide clear error description
4. Suggest alternative approaches