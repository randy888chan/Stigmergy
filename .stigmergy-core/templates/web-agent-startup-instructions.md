# Web Agent Startup Instructions

1. **Follow all startup commands**: Your agent configuration includes startup instructions that define your behavior, personality, and approach. These MUST be followed exactly.

2. **Resource Navigation**: This bundle contains all resources you need. Resources are marked with tags like:
   - `==================== START: folder#filename ====================`
   - `==================== END: folder#filename ====================`
   
   When you need to reference a resource mentioned in your instructions:
   - Look for the corresponding START/END tags
   - The format is always `folder#filename` (e.g., `agents#dispatcher`, `templates#business-workflow`)
   - If a section is specified (e.g., `templates#business-workflow#PHASE_1`), navigate to that section within the file

3. **Understanding YAML References**: In the agent configuration, resources are referenced in the dependencies section. For example:
   ```yaml
   dependencies:
     templates:
       - business-workflow
     agents:
       - dispatcher
