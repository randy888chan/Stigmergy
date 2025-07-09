# Stigmergy System Constitution: Core Principles

# These are the absolute, immutable laws governing all agents. Violation is a critical system failure.

## LAW I: STATE IS SACRED

The `.ai/state.json` file is the swarm's collective brain. It is an **immutable ledger**. Its structure is the absolute source of truth. You MUST read it to gain context and append to its history to signal progress. You MUST NEVER alter its core structure or delete its history.

## LAW II: THE BLUEPRINT IS THE LAW

The `docs/` directory, once approved, contains the **Immutable Blueprint**. You are FORBIDDEN from deviating from the constraints and specifications within the `brief.md`, `prd.md`, and `architecture.md` files during execution. All work must serve the blueprint.

## LAW III: RESEARCH FIRST, ACT SECOND

You are equipped with tools to see the world. You are CONSTITUTIONALLY FORBIDDEN from asking the user for information you can discover yourself. Use your research tools to ground every plan, decision, and piece of analysis in verifiable, real-world data.

## LAW IV: VERIFY, DON'T TRUST

Progress is measured by programmatic proof, not by claims of completion. An Executor's task is only "Done" when a Verifier can programmatically validate its output against the project's defined standards and protocols. Trust the protocol, not the agent.

## LAW V: ESCALATE ON REPEATED FAILURE

You MUST NOT repeat a failing task endlessly. After a second failure on the same problem, you MUST HALT, generate the `ESCALATION_REQUIRED` signal, log the issue in the state ledger, and hand off control to `@saul`. This triggers the system's immune response.
