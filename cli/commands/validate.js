import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { z } from "zod";
import chalk from "chalk";
import { OutputFormatter } from "../utils/output_formatter.js";

const agentSchema = z
  .object({
    agent: z
      .object({
        id: z
          .string()
          .regex(/^[a-z0-9_-]+$/, "Agent ID must be lowercase with hyphens/underscores only."),
        name: z.string().min(1, "Agent name is required"),
        alias: z.string().startsWith("@", "Alias must start with '@'").optional(),
        archetype: z.string().optional(),
        title: z.string().optional(),
        icon: z.string().optional(),
        is_interface: z.boolean().optional(),
        model_tier: z.enum([
          // New semantic tier names
          "reasoning_tier", "strategic_tier", "execution_tier", "utility_tier",
          // Alternative provider tiers
          "openrouter_reasoning", "openrouter_execution", 
          "deepseek_reasoning", "deepseek_execution",
          "kimi_reasoning", "mistral_reasoning", "anthropic_reasoning", "openai_reasoning",
          // Legacy tiers (backward compatibility)
          "s_tier", "a_tier", "b_tier", "c_tier", "default"
        ], {
          errorMap: () => ({ message: "Model tier must be one of the available configured tiers. See stigmergy.config.js for valid options." })
        }),
        persona: z
          .object({
            role: z.string().min(1, "Persona role is required"),
            style: z.string().optional(),
            identity: z.string().optional(),
          })
          .optional(),
        core_protocols: z
          .array(z.string())
          .min(1, "At least one core protocol is required")
          .optional(),
        ide_tools: z.array(z.string()).optional(),
        engine_tools: z.array(z.string()).optional(),
        tools: z.array(z.string()).optional(), // Legacy support
        source: z.string().optional(), // Legacy support
      })
      .passthrough(), // Allow additional fields for flexibility
  })
  .passthrough();

export async function validateAgents(providedAgentsPath) {
  OutputFormatter.section("Agent Definition Validation");
  OutputFormatter.step("Scanning agent definitions...");

  let agentsDir = providedAgentsPath;

  if (!agentsDir) {
    // 1. Check for local override
    const localAgentsPath = path.join(process.cwd(), ".stigmergy-core", "agents");
    if (fs.existsSync(localAgentsPath)) {
      agentsDir = localAgentsPath;
      console.log(chalk.blue(`[Validate] Using local override for agents from: ${agentsDir}`));
    } else {
      // 2. Fallback to the globally installed (packaged) path
      const globalAgentsPath = path.resolve(__dirname, '..', '..', '.stigmergy-core', 'agents');
      if (fs.existsSync(globalAgentsPath)) {
        agentsDir = globalAgentsPath;
        console.log(chalk.blue(`[Validate] Using global package agents from: ${agentsDir}`));
      } else {
        return {
          success: false,
          error: `Agents directory not found in local override or global package.`,
        };
      }
    }
  }

  const agentFiles = await fs.readdir(agentsDir);
  let validAgents = 0;
  let invalidAgents = 0;
  let warnings = 0;
  const aliases = new Map();
  const validationResults = [];

  for (const file of agentFiles) {
    if (!file.endsWith(".md") && !file.endsWith(".yml") && !file.endsWith(".yaml")) {
      continue;
    }

    const content = await fs.readFile(path.join(agentsDir, file), "utf8");
    const yamlMatch = content.match(/```(?:yaml|yml)\s*([\s\S]*?)```/);

    if (!yamlMatch) {
      OutputFormatter.error(`${file}: Missing YAML code block`);
      invalidAgents++;
      validationResults.push({ file, status: "error", message: "Missing YAML code block" });
      continue;
    }

    if (content.includes("```yml") && !content.includes("```yaml")) {
      OutputFormatter.warning(`${file}: Prefer 'yaml' over 'yml' in code block`);
      warnings++;
      validationResults.push({ file, status: "warning", message: "Prefer 'yaml' over 'yml' in code block" });
    }

    try {
      const agentData = yaml.load(yamlMatch[1]);
      
      // Enhanced validation with backward compatibility
      agentSchema.parse(agentData);
      
      // Additional validation checks
      const agent = agentData.agent;
      
      // Warn about legacy fields
      if (agent.tools && !agent.engine_tools) {
        OutputFormatter.warning(`${file}: Using deprecated 'tools' field. Consider migrating to 'engine_tools'`);
        warnings++;
        validationResults.push({ file, status: "warning", message: "Using deprecated 'tools' field. Consider migrating to 'engine_tools'" });
      }
      
      if (!agent.core_protocols && !agent.tools) {
        OutputFormatter.warning(`${file}: Missing 'core_protocols' field. This may affect agent behavior.`);
        warnings++;
        validationResults.push({ file, status: "warning", message: "Missing 'core_protocols' field. This may affect agent behavior." });
      }
      
      // Check for duplicate aliases
      if (agent?.alias) {
        if (aliases.has(agent.alias)) {
          OutputFormatter.error(`${file}: Duplicate alias '${agent.alias}' (also used in ${aliases.get(agent.alias)})`);
          invalidAgents++;
          validationResults.push({ file, status: "error", message: `Duplicate alias '${agent.alias}' (also used in ${aliases.get(agent.alias)})` });
          continue;
        } else {
          aliases.set(agent.alias, file);
        }
      }
      
      // Validate engine tools format
      if (agent.engine_tools) {
        const validToolPatterns = [
          'file_system.*', 'shell.*', 'research.*', 'code_intelligence.*',
          'swarm_intelligence.*', 'qa.*', 'business_verification.*',
          'guardian.*', 'core.*', 'system.*', 'stigmergy.*',
          'mcp_code_search.*', 'superdesign.*', 'qwen_integration.*',
          'lightweight_archon.*', 'coderag.*', 'document_intelligence.*',
          'chat_interface.*'
        ];
        
        for (const tool of agent.engine_tools) {
          const isValidPattern = validToolPatterns.some(pattern => {
            if (pattern.endsWith('.*')) {
              return tool.startsWith(pattern.slice(0, -2));
            }
            return tool === pattern;
          });
          
          if (!isValidPattern) {
            OutputFormatter.warning(`${file}: Unknown engine tool pattern '${tool}'`);
            warnings++;
            validationResults.push({ file, status: "warning", message: `Unknown engine tool pattern '${tool}'` });
          }
        }
      }
      
      // Validate file naming convention
      const expectedFileName = `${agent.id}.md`;
      if (file !== expectedFileName) {
        OutputFormatter.warning(`${file}: Filename should match agent ID: expected '${expectedFileName}'`);
        warnings++;
        validationResults.push({ file, status: "warning", message: `Filename should match agent ID: expected '${expectedFileName}'` });
      }
      
      OutputFormatter.success(`${file}: Valid agent definition`);
      validAgents++;
      validationResults.push({ file, status: "success", message: "Valid agent definition" });
      
    } catch (e) {
      if (e instanceof z.ZodError) {
        OutputFormatter.error(`${file}: Zod validation failed:`);
        const fieldErrors = e.flatten().fieldErrors;
        Object.entries(fieldErrors).forEach(([field, errors]) => {
          console.log(chalk.red(`  → ${field}: ${errors.join(', ')}`));
        });
        invalidAgents++;
        validationResults.push({ file, status: "error", message: `Zod validation failed: ${JSON.stringify(fieldErrors)}` });
      } else {
        OutputFormatter.error(`${file}: Invalid YAML - ${e.message}`);
        invalidAgents++;
        validationResults.push({ file, status: "error", message: `Invalid YAML - ${e.message}` });
      }
    }
  }

  // Display summary
  OutputFormatter.summary({
    "Total Files Scanned": agentFiles.length,
    "Valid Agents": validAgents,
    "Invalid Agents": invalidAgents,
    "Warnings": warnings
  }, "Validation Summary");

  if (invalidAgents > 0) {
    return {
      success: false,
      error: `${invalidAgents} agent definition(s) failed validation.`,
      results: validationResults
    };
  }

  OutputFormatter.success("All agent definitions validated successfully");
  return { success: true, results: validationResults };
}

async function main() {
  const result = await validateAgents();
  if (!result.success) {
    OutputFormatter.error(`Validation failed: ${result.error}`);
    process.exit(1);
  }
}

// If this script is run directly, execute the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}