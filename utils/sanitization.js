import { z } from 'zod';

// Placeholder for tool schemas. In a real application, this would be
// dynamically built or imported from a central schema definition file.
const toolSchemas = {
  // Example schema for a 'file_system.writeFile' tool
  'file_system.writeFile': {
    path: z.string().min(1),
    content: z.string(),
  },
  'file_system.readFile': {
    // A basic regex to allow typical file paths but reject paths with shell command characters.
    // This is not exhaustive but is a good starting point.
    path: z.string().regex(/^[\w\/\.-]+$/, "Invalid characters in path"),
  },
  // Example schema for a 'shell.run' tool
  'shell.run': {
    command: z.string().min(1),
  },
  'stigmergy.task': {
    subagent_type: z.string().min(1),
    description: z.string().min(1),
  }
};

/**
 * Sanitizes and validates arguments for a tool call against its predefined Zod schema.
 * @param {string} toolName - The name of the tool being called (e.g., 'file_system.writeFile').
 * @param {object} args - The arguments object to validate.
 * @returns {object} The validated and sanitized arguments.
 * @throws {Error} If the tool name is invalid or the arguments fail validation.
 */
export function sanitizeToolCall(toolName, args) {
  const toolSchema = toolSchemas[toolName];
  if (!toolSchema) {
    throw new Error(`Invalid tool: ${toolName}. No schema found for validation.`);
  }

  const schema = z.object(toolSchema);
  try {
    return schema.parse(args);
  } catch (error) {
    // Re-throw with a more informative error message
    throw new Error(`Invalid arguments for tool '${toolName}': ${error.message}`);
  }
}
