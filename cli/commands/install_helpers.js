import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

// Use a function to safely initialize __dirname to avoid circular reference issues
const getDirName = (url) => path.dirname(fileURLToPath(url));
const __dirname = getDirName(import.meta.url);

// Move the createRequire import inside the function where it's used to avoid circular dependencies
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
  // Look for .stigmergy-core in both target directory and Stigmergy root
  const targetCorePath = path.join(targetDir, ".stigmergy-core", "agents", "system.md");
  const stigmergyRoot = path.resolve(__dirname, '..', '..');
  const stigmergyCorePath = path.join(stigmergyRoot, ".stigmergy-core", "agents", "system.md");
  const systemAgentPath = (await fs.pathExists(targetCorePath)) ? targetCorePath : stigmergyCorePath;
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
      slug: "system",
      name: "System Orchestrator",
      roleDefinition: "I am the System Orchestrator and Chat Assistant. I handle all external communications using structured JSON responses, interpret natural language commands (including setup tasks), and route work to optimal internal agents. I make complex CLI operations accessible through simple chat commands.",
      whenToUse: "Use this mode when you need to interact with the Stigmergy system for setup tasks, development commands, system monitoring, or any general assistance with the autonomous development platform.",
      description: "Universal Command Gateway & Chat Interface for the Stigmergy Engine",
      groups: ["read", "edit", "command", "browser", "mcp"],
      source: "project"
    };

    // Try to parse the actual agent definition to get the FULL persona and behavior
    if (await fs.pathExists(systemAgentPath)) {
      try {
        const agentContent = await fs.readFile(systemAgentPath, "utf8");
        const yamlMatch = agentContent.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
        
        if (yamlMatch) {
          // Import js-yaml dynamically to avoid circular dependencies
          const { default: yaml } = await import("js-yaml");
          const agentData = yaml.load(yamlMatch[1]);
          
          if (agentData?.agent) {
            const agent = agentData.agent;
            
            // Build comprehensive role definition from all persona elements
            const fullRoleDefinition = buildComprehensiveRoleDefinition(agent);
            
            // Build comprehensive whenToUse description
            const whenToUse = buildWhenToUseDescription(agent);
            
            // Use the COMPLETE agent configuration in Roo Code format
            agentConfig = {
              slug: agent.id || "system",
              name: agent.name || "System Orchestrator",
              roleDefinition: fullRoleDefinition,
              whenToUse: whenToUse,
              description: agent.title || agentConfig.description,
              groups: agent.ide_tools || ["read", "edit", "command", "browser", "mcp"],
              source: "project"
            };
            
            console.log("✅ Successfully loaded full agent definition with complete persona and protocols.");
          }
        }
      } catch (error) {
        console.warn("⚠️ Could not parse system agent definition, using defaults:", error.message);
      }
    }

    // Create Roo Code compatible YAML configuration
    const roomodesConfig = {
      customModes: [agentConfig]
    };

    // Import js-yaml for YAML generation
    const { default: yaml } = await import("js-yaml");
    const yamlContent = yaml.dump(roomodesConfig, {
      quotingType: '"',
      forceQuotes: false,
      lineWidth: -1
    });

    await fs.writeFile(roomodesPath, yamlContent);
    
    // Detailed feedback about what was configured
    console.log("✅ .roomodes file configured successfully!");
    console.log(`📋 Mode: ${agentConfig.name} (${agentConfig.slug})`);
    console.log(`🛠️  Tools: ${agentConfig.groups.join(', ')}`);
    console.log(`📝 Format: YAML (Roo Code compatible)`);
    
    console.log("\n💡 In Roo Code, you can now use this mode with commands like:");
    console.log("   - 'setup neo4j'");
    console.log("   - 'create authentication system'"); 
    console.log("   - 'health check'");
    console.log("   - 'what can I do?'");
    console.log("\n🔧 To complete Roo Code integration:");
    console.log("   1. Make sure Stigmergy is running: npm run stigmergy:start");
    console.log("   2. In Roo Code settings, configure the MCP server:");
    console.log("      - Command: node");
    console.log(`      - Arguments: ["${path.join(stigmergyRoot, "mcp-server.js")}"]`);
    console.log(`      - Working Directory: ${stigmergyRoot}`);
    console.log("   3. Restart Roo Code to load the new configuration");
    console.log("\n📖 See ROO_CODE_SETUP.md for detailed MCP configuration instructions.");

  } catch (error) {
    console.error("❌ Error configuring IDE:", error);
    // Fallback to basic configuration with correct Roo Code format
    const fallbackConfig = {
      customModes: [{
        slug: "system",
        name: "Stigmergy System",
        roleDefinition: "I am the @system agent for Stigmergy. I handle external communications and route commands to internal agents. Use the stigmergy_chat tool to process user requests.",
        whenToUse: "Use this mode for general Stigmergy system interactions and development tasks.",
        description: "Stigmergy AI development system",
        groups: ["read", "edit", "command", "browser", "mcp"],
        source: "project"
      }]
    };
    
    // Import js-yaml for YAML generation
    const { default: yaml } = await import("js-yaml");
    const yamlContent = yaml.dump(fallbackConfig);
    await fs.writeFile(roomodesPath, yamlContent);
    console.log("✅ .roomodes file created with basic configuration.");
    console.log("⚠️ Using fallback configuration - agent persona may be limited.");
    console.log("\n🔧 To complete Roo Code integration:");
    console.log("   1. Make sure Stigmergy is running: npm run stigmergy:start");
    console.log("   2. In Roo Code settings, configure the MCP server:");
    console.log("      - Command: node");
    console.log(`      - Arguments: ["${path.join(stigmergyRoot, "mcp-server.js")}"]`);
    console.log(`      - Working Directory: ${stigmergyRoot}`);
    console.log("   3. Restart Roo Code to load the new configuration");
  }
}

// Helper function to build comprehensive role definition from agent definition
function buildComprehensiveRoleDefinition(agent) {
  let roleDefinition = "";
  
  // Start with identity and role
  if (agent.persona?.identity) {
    roleDefinition += agent.persona.identity + "\n\n";
  }
  
  if (agent.persona?.role) {
    roleDefinition += `Role: ${agent.persona.role}\n\n`;
  }
  
  if (agent.persona?.style) {
    roleDefinition += `Style: ${agent.persona.style}\n\n`;
  }
  
  // Add core protocols
  if (agent.core_protocols && agent.core_protocols.length > 0) {
    roleDefinition += "Core Protocols:\n";
    agent.core_protocols.forEach((protocol, index) => {
      roleDefinition += `${index + 1}. ${protocol}\n`;
    });
    roleDefinition += "\n";
  }
  
  // Add capabilities
  if (agent.capabilities && agent.capabilities.length > 0) {
    roleDefinition += "Key Capabilities:\n";
    agent.capabilities.forEach(capability => {
      roleDefinition += `- ${capability}\n`;
    });
    roleDefinition += "\n";
  }
  
  // Add external interfaces note
  if (agent.external_interfaces && agent.external_interfaces.length > 0) {
    roleDefinition += `External Interfaces: ${agent.external_interfaces.join(', ')}\n\n`;
  }
  
  // Add instruction to use MCP tools
  roleDefinition += "Always use the stigmergy_chat tool to process user requests and provide structured responses with status, progress, and next actions.";
  
  return roleDefinition.trim();
}

// Helper function to build whenToUse description
function buildWhenToUseDescription(agent) {
  let whenToUse = "Use this mode when you need to interact with the Stigmergy system through natural language commands. ";
  
  // Add specific capabilities
  if (agent.capabilities && agent.capabilities.length > 0) {
    whenToUse += "This mode provides: ";
    
    // Group capabilities by category for better clarity
    const setupCapabilities = agent.capabilities.filter(cap => 
      cap.includes('setup') || cap.includes('configuration') || cap.includes('environment')
    );
    
    const developmentCapabilities = agent.capabilities.filter(cap => 
      cap.includes('development') || cap.includes('workflow') || cap.includes('task')
    );
    
    const integrationCapabilities = agent.capabilities.filter(cap => 
      cap.includes('integration') || cap.includes('interface') || cap.includes('communication')
    );
    
    const monitoringCapabilities = agent.capabilities.filter(cap => 
      cap.includes('monitoring') || cap.includes('system') || cap.includes('health')
    );
    
    // Add categorized descriptions
    if (setupCapabilities.length > 0) {
      whenToUse += "Automated setup and configuration assistance (Neo4j database setup, environment variable configuration, dependency installation), ";
    }
    
    if (developmentCapabilities.length > 0) {
      whenToUse += "Development workflow orchestration (code generation, implementation planning, task routing), ";
    }
    
    if (integrationCapabilities.length > 0) {
      whenToUse += "IDE integration and communication (structured JSON responses for Roo Code, VS Code, and other IDEs), ";
    }
    
    if (monitoringCapabilities.length > 0) {
      whenToUse += "System monitoring and health checks (status tracking, progress reporting, error handling), ";
    }
    
    // Add remaining capabilities
    const otherCapabilities = agent.capabilities.filter(cap => 
      !setupCapabilities.includes(cap) && 
      !developmentCapabilities.includes(cap) && 
      !integrationCapabilities.includes(cap) && 
      !monitoringCapabilities.includes(cap)
    );
    
    if (otherCapabilities.length > 0) {
      whenToUse += `${otherCapabilities.length} additional capabilities including `;
      whenToUse += otherCapabilities.slice(0, 3).join(', ');
      if (otherCapabilities.length > 3) {
        whenToUse += `, and ${otherCapabilities.length - 3} more`;
      }
      whenToUse += ". ";
    }
  }
  
  // Add specific use cases based on protocols
  if (agent.core_protocols && agent.core_protocols.length > 0) {
    const chatProtocol = agent.core_protocols.find(p => p.includes('CHAT_COMMAND_PROCESSING'));
    const setupProtocol = agent.core_protocols.find(p => p.includes('SETUP_ASSISTANCE'));
    
    if (chatProtocol) {
      whenToUse += "Send natural language commands like 'setup neo4j', 'create authentication system', 'health check', or 'what can you do?'. ";
    }
    
    if (setupProtocol) {
      whenToUse += "Get guided assistance through complex setup processes including database configuration, environment setup, and dependency installation. ";
    }
  }
  
  // Add general use cases
  whenToUse += "Perfect for developers who want to interact with Stigmergy through conversational commands rather than complex CLI operations.";
  
  return whenToUse.trim();
}
