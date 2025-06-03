# Advanced Elicitation Task

## Purpose

- Provide optional reflective and brainstorming actions to enhance content quality
- Enable deeper exploration of ideas through structured elicitation techniques
- Support iterative refinement through multiple analytical perspectives

## Instructions

### 1. When to Apply

Apply this protocol when:

- Other tasks/templates indicate to use `tasks#advanced-elicitation`
- After presenting a document section that would benefit from refinement
- User requests brainstorming or deeper exploration of content
- Content needs additional validation or alternative perspectives

### 2. Present Action List

**Present ONLY the numbered list (0-9) with this exact format:**

```
Advanced Reflective, Elicitation & Brainstorming Actions
Choose an action (0-9 - 9 to bypass):

0. Expand or Contract for Audience
1. Explain Reasoning (CoT Step-by-Step)
2. Critique and Refine
3. Analyze Logical Flow and Dependencies
4. Assess Alignment with Overall Goals
5. Identify Potential Risks and Unforeseen Issues
6. Challenge from Critical Perspective (Self or Other Persona)
7. Explore Diverse Alternatives (ToT-Inspired)
8. Hindsight is 20/20: The 'If Only...' Reflection
9. Proceed / No Further Actions
```

### 3. Processing Guidelines

**Do NOT show:**

- The full protocol text with `[[LLM: ...]]` instructions
- Detailed explanations of each option unless executing
- Any internal template markup

**After user selection:**

- Execute the chosen action according to the protocol instructions below
- Ask if they want to select another action or proceed with option 9 once complete
- Continue until user selects option 9 or indicates completion

### 4. Action Definitions

0. Expand or Contract for Audience
   [[LLM: Ask the user whether they want to 'expand' on the content (add more detail, elaborate) or 'contract' it (simplify, clarify, make more concise). Also, ask if there's a specific target audience they have in mind. Once clarified, perform the expansion or contraction from your current role's perspective, tailored to the specified audience if provided.]]

1. Explain Reasoning (CoT Step-by-Step)
   [[LLM: Explain the step-by-step thinking process, characteristic of your role, that you used to arrive at the current proposal for this content.]]

2. Critique and Refine
   [[LLM: From your current role's perspective, review your last output or the current section for flaws, inconsistencies, or areas for improvement, and then suggest a refined version reflecting your expertise.]]

3. Analyze Logical Flow and Dependencies
   [[LLM: From your role's standpoint, examine the content's structure for logical progression, internal consistency, and any relevant dependencies. Confirm if elements are presented in an effective order.]]

4. Assess Alignment with Overall Goals
   [[LLM: Evaluate how well the current content contributes to the stated overall goals of the document, interpreting this from your specific role's perspective and identifying any misalignments you perceive.]]

5. Identify Potential Risks and Unforeseen Issues
   [[LLM: Based on your role's expertise, brainstorm potential risks, overlooked edge cases, or unintended consequences related to the current content or proposal.]]

6. Challenge from Critical Perspective (Self or Other Persona)
   [[LLM: Adopt a critical perspective on the current content. If the user specifies another role or persona (e.g., 'as a customer', 'as [Another Persona Name]'), critique the content or play devil's advocate from that specified viewpoint. If no other role is specified, play devil's advocate from your own current persona's viewpoint, arguing against the proposal or current content and highlighting weaknesses or counterarguments specific to your concerns.]]

7. Explore Diverse Alternatives (ToT-Inspired)
   [[LLM: From your role's perspective, first broadly brainstorm a range of diverse approaches or solutions to the current topic. Then, from this wider exploration, select and present 2 distinct alternatives, detailing the pros, cons, and potential implications you foresee for each.]]

8. Hindsight is 20/20: The 'If Only...' Reflection
   [[LLM: In your current persona, imagine it's a retrospective for a project based on the current content. What's the one 'if only we had known/done X...' that your role would humorously or dramatically highlight, along with the imagined consequences?]]

9. Proceed / No Further Actions
   [[LLM: Acknowledge the user's choice to finalize the current work, accept the AI's last output as is, or move on to the next step without selecting another action from this list. Prepare to proceed accordingly.]]
