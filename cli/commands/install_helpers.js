import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

async function findProjectRoot(startDir) {
    let currentDir = startDir;
    while (currentDir !== path.parse(currentDir).root) {
        const packageJsonPath = path.join(currentDir, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
            return currentDir;
        }
        currentDir = path.dirname(currentDir);
    }
    return null;
}

export async function configureIde(targetDir) {
  const roomodesPath = path.join(targetDir, ".roomodes");
  const systemAgentPath = path.join(targetDir, ".stigmergy-core", "agents", "system.md");
  const configPath = path.join(targetDir, "stigmergy.config.js");

  try {
    // Load the actual Stigmergy configuration to get real model names
    let modelConfig = null;
    try {
      if (await fs.pathExists(configPath)) {
        // Dynamic import of the config file
        const configModule = await import(`file://${configPath}`);
        modelConfig = configModule.default || configModule;
      }
    } catch (error) {
      console.warn("⚠️ Could not load stigmergy.config.js, using default model mappings:", error.message);
    }

    // Default fallback agent configuration with proper Roo Code structure
    let agentConfig = {
      name: "System Orchestrator",
      description: "Universal Command Gateway & Chat Interface for the Stigmergy Engine",
      systemPrompt: "I am the System Orchestrator and Chat Assistant. I handle all external communications using structured JSON responses, interpret natural language commands (including setup tasks), and route work to optimal internal agents. I make complex CLI operations accessible through simple chat commands. Use the stigmergy_chat tool to process all user requests through natural language.",
      tools: ["read", "edit", "command", "browser", "mcp"],
      model: getActualModelName("reasoning_tier", modelConfig)
    };

    // Try to parse the actual agent definition to get the FULL persona and behavior
    if (await fs.pathExists(systemAgentPath)) {
      try {
        const agentContent = await fs.readFile(systemAgentPath, "utf8");
        const yamlMatch = agentContent.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
        
        if (yamlMatch) {
          const yaml = await import("js-yaml");
          const agentData = yaml.load(yamlMatch[1]);
          
          if (agentData?.agent) {
            const agent = agentData.agent;
            
            // Build comprehensive system prompt from all persona elements
            const fullSystemPrompt = buildComprehensiveSystemPrompt(agent);
            
            // Use the COMPLETE agent configuration with all behavioral specifications
            agentConfig = {
              name: agent.name || "System Orchestrator",
              description: agent.title || agent.archetype || agentConfig.description,
              systemPrompt: fullSystemPrompt,
              tools: agent.ide_tools || ["read", "edit", "command", "browser", "mcp"],
              model: getActualModelName(agent.model_tier, modelConfig),
              // Preserve ALL agent definition data for Roo Code
              agentId: agent.id,
              alias: agent.alias,
              archetype: agent.archetype,
              icon: agent.icon,
              isInterface: agent.is_interface,
              persona: {
                role: agent.persona?.role,
                style: agent.persona?.style,
                identity: agent.persona?.identity
              },
              protocols: agent.core_protocols,
              capabilities: agent.capabilities,
              externalInterfaces: agent.external_interfaces,
              engineTools: agent.engine_tools
            };
            
            console.log("✅ Successfully loaded full agent definition with complete persona and protocols.");
          }
        }
      } catch (error) {
        console.warn("⚠️ Could not parse system agent definition, using defaults:", error.message);
      }
    }

    const roomodesConfig = {
      agents: {
        "@system": agentConfig
      }
    };

    await fs.writeFile(roomodesPath, JSON.stringify(roomodesConfig, null, 2));
    
    // Detailed feedback about what was configured
    console.log("✅ .roomodes file configured successfully!");
    console.log(`📋 Agent: ${agentConfig.name} (${agentConfig.alias || '@system'})`);
    console.log(`🧠 Model: ${agentConfig.model}`);
    console.log(`🛠️  Tools: ${agentConfig.tools.join(', ')}`);
    
    if (agentConfig.protocols) {
      console.log(`📜 Protocols: ${agentConfig.protocols.length} core protocols loaded`);
    }
    if (agentConfig.capabilities) {
      console.log(`⚡ Capabilities: ${agentConfig.capabilities.length} capabilities loaded`);
    }
    
    console.log("\n💡 In Roo Code, you can now use @system agent with commands like:");
    console.log("   - 'setup neo4j'");
    console.log("   - 'create authentication system'"); 
    console.log("   - 'health check'");
    console.log("   - 'what can I do?'");
    console.log("\n🔧 Note: MCP server needs to be configured separately in Roo Code settings.");
    console.log("📖 See docs/mcp-server-setup.md for MCP configuration instructions.");

  } catch (error) {
    console.error("❌ Error configuring IDE:", error);
    // Fallback to basic configuration with correct Roo Code tools and proper model
    const fallbackConfig = {
      agents: {
        "@system": {
          name: "Stigmergy System",
          description: "Stigmergy AI development system",
          systemPrompt: "I am the @system agent for Stigmergy. I handle external communications and route commands to internal agents. Use the stigmergy_chat tool to process user requests.",
          tools: ["read", "edit", "command", "browser", "mcp"],
          model: getActualModelName("reasoning_tier", modelConfig)
        }
      }
    };
    await fs.writeFile(roomodesPath, JSON.stringify(fallbackConfig, null, 2));
    console.log("✅ .roomodes file created with basic configuration.");
    console.log("⚠️ Using fallback configuration - agent persona may be limited.");
  }
}

// Helper function to build comprehensive system prompt from agent definition
function buildComprehensiveSystemPrompt(agent) {
  let prompt = "";
  
  // Start with identity and role
  if (agent.persona?.identity) {
    prompt += agent.persona.identity + "\n\n";
  }
  
  if (agent.persona?.role) {
    prompt += `Role: ${agent.persona.role}\n\n`;
  }
  
  if (agent.persona?.style) {
    prompt += `Style: ${agent.persona.style}\n\n`;
  }
  
  // Add core protocols
  if (agent.core_protocols && agent.core_protocols.length > 0) {
    prompt += "Core Protocols:\n";
    agent.core_protocols.forEach((protocol, index) => {
      prompt += `${index + 1}. ${protocol}\n`;
    });
    prompt += "\n";
  }
  
  // Add capabilities
  if (agent.capabilities && agent.capabilities.length > 0) {
    prompt += "Key Capabilities:\n";
    agent.capabilities.forEach(capability => {
      prompt += `- ${capability}\n`;
    });
    prompt += "\n";
  }
  
  // Add external interfaces note
  if (agent.external_interfaces && agent.external_interfaces.length > 0) {
    prompt += `External Interfaces: ${agent.external_interfaces.join(', ')}\n\n`;
  }
  
  // Add instruction to use MCP tools
  prompt += "Always use the stigmergy_chat tool to process user requests and provide structured responses with status, progress, and next actions.";
  
  return prompt.trim();
}

// Helper function to get actual model name from Stigmergy config
function getActualModelName(tier, modelConfig) {
  // If we have the actual config, use it
  if (modelConfig?.model_tiers?.[tier]?.model_name) {
    return modelConfig.model_tiers[tier].model_name;
  }
  
  // Enhanced fallback mapping that respects environment variables
  const tierMapping = {
    'reasoning_tier': process.env.REASONING_MODEL || 'gpt-4o',
    'strategic_tier': process.env.STRATEGIC_MODEL || 'gpt-4',
    'execution_tier': process.env.EXECUTION_MODEL || 'gpt-4o-mini', 
    'utility_tier': process.env.UTILITY_MODEL || 'gpt-3.5-turbo',
    's_tier': process.env.REASONING_MODEL || 'gpt-4o',
    'a_tier': process.env.EXECUTION_MODEL || 'gpt-4',
    'b_tier': process.env.UTILITY_MODEL || 'gpt-4o-mini'
  };
  
  return tierMapping[tier] || 'gpt-4o';
}
