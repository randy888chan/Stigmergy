import { z } from 'zod';

const qwenGenerateSchema = {
  description: 'Generate code using Qwen AI',
  parameters: z.object({
    prompt: z.string(),
    language: z.string().optional(),
    context: z.string().optional(),
  }),
};

const qwenReviewSchema = {
  description: 'Review code using Qwen AI',
  parameters: z.object({
    code: z.string(),
    language: z.string().optional(),
  }),
};

const qwenExplainSchema = {
  description: 'Explain code using Qwen AI',
  parameters: z.object({
    code: z.string(),
    language: z.string().optional(),
  }),
};

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
  },
  'document_intelligence.processDocument': {
    description: 'Processes an uploaded document (PDF, DOCX, TXT, MD) and extracts its content.',
    parameters: z.object({
      filePath: z.string().describe('The absolute path to the document to process.'),
    }),
  },
  'archon_tool.healthCheck': {
    description: 'Checks if the Archon server is running and healthy.',
    parameters: z.object({}),
  },
  'archon_tool.query': {
    description: 'Queries the Archon advanced RAG system for research.',
    parameters: z.object({
      query: z.string().describe('The research query.'),
    }),
  },
  'research.deep_dive': {
    description: 'Conducts a deep dive research on a topic.',
    parameters: z.object({
      query: z.string(),
      learnings: z.array(z.string()).optional(),
    }),
  },
  'research.evaluate_sources': {
    description: 'Evaluates the credibility of a list of URLs.',
    parameters: z.object({
      urls: z.array(z.string()),
    }),
  },
  'research.scrape_and_synthesize': {
    description: 'Scrapes a list of URLs and synthesizes the content.',
    parameters: z.object({
      urls: z.array(z.string()),
    }),
  },
  'gemini.query': {
    description: 'Execute a prompt using the local Gemini CLI',
    parameters: z.object({
      prompt: z.string().describe('The prompt to send to Gemini'),
    }),
  },
  'gemini.health_check': {
    description: 'Check if Gemini CLI is responsive',
    parameters: z.object({}),
  },
  'qwen.qwen_generate_code': qwenGenerateSchema,
  'qwen.qwen_review_code': qwenReviewSchema,
  'qwen.qwen_explain_code': qwenExplainSchema,
  'qwen_integration.qwen_generate_code': qwenGenerateSchema,
  'qwen_integration.qwen_review_code': qwenReviewSchema,
  'qwen_integration.qwen_explain_code': qwenExplainSchema
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
