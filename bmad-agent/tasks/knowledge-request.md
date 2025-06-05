# Task: Submit Knowledge Request

## Description
Submit a request for additional information or clarification on aspects of the project where knowledge is missing, incomplete, or unclear. This helps maintain a comprehensive and accurate knowledge base.

## Input Required
- Specific knowledge gap or question
- Context where this information is needed
- Impact of the missing knowledge on current tasks

## Steps

1. **Analyze Knowledge Gap**
   - Clearly identify what information is missing
   - Determine why this information is important
   - Assess the impact of not having this information
   - Consider potential sources for this information

2. **Formulate Knowledge Request**
   - Write a clear, specific question or request
   - Provide context explaining why this information is needed
   - Include any relevant references to existing documentation
   - Suggest potential sources or stakeholders who might have the answer
   - Specify urgency level and impact on timeline

3. **Document the Request**
   - Create or update the knowledge request log (`.ai/knowledge-requests.md`)
   - Add a new entry with:
     - Unique ID (e.g., KR-001)
     - Date submitted
     - Requesting agent/role
     - Request details
     - Status (Open)
     - Priority (High/Medium/Low)
   - Ensure the format is consistent with existing entries

4. **Reference the Request**
   - In the current work document, reference the knowledge request ID
   - Document any assumptions made in the absence of this information
   - Note how these assumptions might affect the current work

5. **Notify User**
   - Inform the user about the knowledge request
   - Explain the importance and impact of the missing information
   - Suggest when this information will be needed to avoid delays

## Output
1. Updated knowledge request log (`.ai/knowledge-requests.md`) with new entry
2. Reference to the knowledge request in the current work document
3. Clear communication to the user about the knowledge gap and its implications

## Knowledge Request Format
```markdown
## KR-[ID]: [Brief Title]

- **Date**: YYYY-MM-DD
- **Requesting Agent**: [Agent Name/Role]
- **Status**: Open | In Progress | Resolved | Declined
- **Priority**: High | Medium | Low

### Request
[Detailed description of the information needed]

### Context
[Why this information is needed and how it will be used]

### Impact
[How this missing information affects the project]

### Potential Sources
[Suggestions for where this information might be found]

### Resolution
[To be filled when resolved]
```

## Validation Criteria
- Request is specific and actionable
- Impact and urgency are clearly communicated
- Request is properly logged in the knowledge request log
- Current work documents reference the knowledge request ID
- User is informed about the knowledge gap and its implications