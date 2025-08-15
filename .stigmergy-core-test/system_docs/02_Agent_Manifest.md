```yaml
agents:
  - id: test-agent-permitted
    tools:
      - file_system.readFile
  - id: test-agent-denied
    tools:
      - some_other_tool
```
