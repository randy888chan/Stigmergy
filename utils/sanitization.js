import { z } from 'zod';

export const toolSchemas = {
  'file_system.writeFile': {
    description: 'Write content to a file',
    parameters: z.object({
      path: z.string().min(1).describe('The file path'),
      content: z.string().describe('The content to write'),
    }),
  },
  'file_system.readFile': {
    description: 'Read content from a file',
    parameters: z.object({
      path: z.string().describe('The file path'),
    }),
  },
  'file_system.pathExists': {
    description: 'Check if a path exists',
    parameters: z.object({
      path: z.string().min(1),
    }),
  },
  'file_system.listDirectory': {
    description: 'List files in a directory',
    parameters: z.object({
      path: z.string().min(1),
    }),
  },
  'shell.execute': {
    description: 'Execute a shell command',
    parameters: z.object({
      command: z.string().min(1),
    }),
  },
  'system.updateStatus': {
    description: 'Update the project status',
    parameters: z.object({
      newStatus: z.string().min(1),
      message: z.string().optional(),
    }),
  },
  'system.request_human_approval': {
    description: 'Ask the user for approval',
    parameters: z.object({
      message: z.string().min(1),
      data: z.record(z.string(), z.any()),
    }),
  },
  'stigmergy.task': {
    description: 'Delegate a task to another agent',
    parameters: z.object({
      subagent_type: z.string().min(1),
      description: z.string().min(1),
    }),
  },
  'git_tool.init': {
    description: 'Initialize git repository',
    parameters: z.object({
      path: z.string().optional(),
    }),
  },
  'git_tool.commit': {
    description: 'Commit changes',
    parameters: z.object({
      message: z.string().min(1),
    }),
  },
  'git_tool.create_branch': {
    description: 'Create a new branch',
    parameters: z.object({
      branchName: z.string().min(1),
    }),
  },
  'git_tool.delete_branch_locally': {
    description: 'Delete a local branch',
    parameters: z.object({
      branchName: z.string().min(1),
    }),
  },
  'git_tool.add': {
      description: 'Stage files for commit',
      parameters: z.object({
          files: z.union([z.string(), z.array(z.string())]).describe('File or files to add')
      })
  },
  'coderag.scan_codebase': {
      description: 'Scan codebase for intelligence',
      parameters: z.object({
          project_root: z.string().optional()
      })
  },
  'coderag.semantic_search': {
      description: 'Search code semantically',
      parameters: z.object({
          query: z.string(),
          project_root: z.string().optional()
      })
  },
  'coderag.find_architectural_issues': {
      description: 'Find issues in code architecture',
      parameters: z.object({})
  },
  'system.stream_thought': {
      description: 'Stream a thought to the dashboard',
      parameters: z.object({
          thought: z.string()
      })
  }
};

export function sanitizeToolCall(toolName, args) {
  const toolDef = toolSchemas[toolName];
  if (!toolDef) {
    // Return args as-is if no schema found, to prevent crashes on unknown tools
    return args;
  }
  try {
    return toolDef.parameters.parse(args);
  } catch (error) {
    throw new Error(`Invalid arguments for tool '${toolName}': ${error.message}`);
  }
}
