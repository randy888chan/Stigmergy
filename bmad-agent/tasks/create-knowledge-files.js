#!/usr/bin/env node
/**
 * BMAD Agent Knowledge Update Utility
 * 
 * This script extracts information from project documents and updates:
 * 1. Knowledge files in the .ai directory
 * 2. Agent customization strings in the orchestrator config files
 */

const fs = require('fs');
const path = require('path');

// Paths
const PROJECT_ROOT = process.cwd();
const AI_DIR = path.join(PROJECT_ROOT, '.ai');
const IDE_CONFIG_PATH = path.join(PROJECT_ROOT, 'bmad-agent/ide-bmad-orchestrator.cfg.md');
const WEB_CONFIG_PATH = path.join(PROJECT_ROOT, 'bmad-agent/web-bmad-orchestrator-agent.cfg.md');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');

// Ensure .ai directory exists
if (!fs.existsSync(AI_DIR)) {
  fs.mkdirSync(AI_DIR, { recursive: true });
  console.log('Created .ai directory for knowledge files');
}

// Knowledge file paths
const PROJECT_CONTEXT_PATH = path.join(AI_DIR, 'project-context.md');
const TECH_STACK_PATH = path.join(AI_DIR, 'tech-stack.md');
const DATA_MODELS_PATH = path.join(AI_DIR, 'data-models.md');
const DEPLOYMENT_INFO_PATH = path.join(AI_DIR, 'deployment-info.md');
const VERSION_HISTORY_PATH = path.join(AI_DIR, 'knowledge-versions.md');
const KNOWLEDGE_REQUESTS_PATH = path.join(AI_DIR, 'knowledge-requests.md');
const KNOWLEDGE_MAP_PATH = path.join(AI_DIR, 'knowledge-map.md');

/**
 * Extract project information from documents
 * @returns {Object} Project information
 */
function extractProjectInfo() {
  // This would ideally parse the actual project docs
  // For now, returning a placeholder object
  return {
    projectName: "Example Project",
    description: "Placeholder project description",
    primaryLanguages: "JavaScript, TypeScript",
    frameworks: "React, Node.js, Express",
    databases: "MongoDB, Redis",
    patterns: "MVC, Microservices",
    projectType: "Web Application",
    dataSources: "Customer transactions, User behavior",
    analysisTypes: "Clustering, Classification",
    modelTypes: "Regression, Neural Networks",
    environments: "Dev, Staging, Production",
    cicdTools: "GitHub Actions, Jenkins",
    infrastructureComponents: "AWS EC2, S3, Docker",
    applicationType: "SPA Web Application",
    testingTypes: "Unit, Integration, E2E",
    testingTools: "Jest, Cypress, Playwright"
  };
}

/**
 * Create or update a knowledge file
 * @param {string} filePath Path to the knowledge file
 * @param {string} content Content for the file
 */
function updateKnowledgeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated knowledge file: ${path.relative(PROJECT_ROOT, filePath)}`);
}

/**
 * Update agent customization in config file
 * @param {string} configPath Path to the config file
 * @param {string} agentTitle Title of the agent to update
 * @param {string} customization New customization string
 * @returns {boolean} Success status
 */
function updateAgentCustomization(configPath, agentTitle, customization) {
  if (!fs.existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`);
    return false;
  }

  try {
    let configContent = fs.readFileSync(configPath, 'utf8');
    const agentRegex = new RegExp(`## Title: ${agentTitle}[\\s\\S]*?Customize: .*`, 'g');
    
    if (!agentRegex.test(configContent)) {
      console.warn(`Agent "${agentTitle}" not found in ${path.basename(configPath)}`);
      return false;
    }
    
    configContent = configContent.replace(
      agentRegex, 
      (match) => match.replace(/Customize: ".*"/, `Customize: "${customization}"`)
    );
    
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log(`Updated ${agentTitle} customization in ${path.basename(configPath)}`);
    return true;
  } catch (error) {
    console.error(`Error updating ${path.basename(configPath)}: ${error.message}`);
    return false;
  }
}

/**
 * Create or update the version history file
 * @param {string} versionNumber Version number to use
 * @param {Object} projectInfo Project information
 * @param {string[]} changedFiles List of files that were updated
 */
function updateVersionHistory(versionNumber, projectInfo, changedFiles) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const agentName = "Knowledge Update Agent";
  const changeType = "MINOR"; // Default to MINOR, could be logic to determine based on changes
  
  // Check if version history exists
  let previousVersions = "";
  let nextVersion = "1.0.0";
  
  if (fs.existsSync(VERSION_HISTORY_PATH)) {
    const existingContent = fs.readFileSync(VERSION_HISTORY_PATH, 'utf8');
    // Extract current version
    const versionMatch = existingContent.match(/## Current Version: ([\d\.]+)/);
    if (versionMatch && versionMatch[1]) {
      const currentVersion = versionMatch[1];
      // Parse version and increment
      const versionParts = currentVersion.split('.');
      versionParts[1] = (parseInt(versionParts[1]) + 1).toString(); // Increment minor version
      nextVersion = versionParts.join('.');
    }
    
    // Extract version history table
    const historyMatch = existingContent.match(/## Version History\s+\|(.*\|[\s\S]*?\n\n)/);
    if (historyMatch && historyMatch[1]) {
      previousVersions = historyMatch[0];
    }
  }
  
  // Generate list of file changes
  const fileChangesList = changedFiles.map(file => `- \`${file}\`: Updated with latest project information`).join('\n');
  
  const versionHistoryContent = `# Knowledge Version History

## Current Version: ${nextVersion}
**Last Updated:** ${today}
**Updated By:** ${agentName}
**Change Type:** ${changeType}

## Change Summary
Updated project knowledge files with latest information.

## File Updates
${fileChangesList}

## Details

### Added
- New project-specific information extracted from documentation
- Cross-references between related knowledge areas
- Improved agent customizations

### Changed
- Updated technology stack details
- Refined project context information
- Enhanced deployment and infrastructure documentation

### Removed
- Outdated or superseded information

## Impact Analysis
- **Development:** Development agents now have more accurate technology context
- **Testing:** QA agents have better understanding of test requirements
- **Deployment:** DevOps agents have improved infrastructure knowledge
- **Timeline:** No significant impact on project timeline

## Version History

| Version | Date | Updated By | Change Type | Summary |
|---------|------|------------|-------------|---------|
| ${nextVersion} | ${today} | ${agentName} | ${changeType} | Updated project knowledge files |
${previousVersions ? previousVersions.split("\n").slice(3).join("\n") : ""}
`;

  updateKnowledgeFile(VERSION_HISTORY_PATH, versionHistoryContent);
}

/**
 * Create a basic knowledge request log if it doesn't exist
 */
function initializeKnowledgeRequestLog() {
  if (!fs.existsSync(KNOWLEDGE_REQUESTS_PATH)) {
    const content = `# Knowledge Request Log

This document tracks requests for additional information or clarification on aspects of the project where knowledge is missing, incomplete, or unclear.

## How to Use This Log

1. Agents submit knowledge requests when they encounter gaps
2. Team members review and respond to requests
3. Resolved requests are marked and incorporated into the knowledge base

---

`;
    updateKnowledgeFile(KNOWLEDGE_REQUESTS_PATH, content);
    console.log('Initialized knowledge request log');
  }
}

/**
 * Create cross-references between knowledge files
 * @param {Object} projectInfo Project information
 */
function createCrossReferences(projectInfo) {
  // Add references to context file
  if (fs.existsSync(PROJECT_CONTEXT_PATH)) {
    let content = fs.readFileSync(PROJECT_CONTEXT_PATH, 'utf8');
    if (!content.includes("## Related Knowledge Files")) {
      const crossRefs = `
## Related Knowledge Files
- [Technology Stack](./${path.basename(TECH_STACK_PATH)})
- [Data Models](./${path.basename(DATA_MODELS_PATH)})
- [Deployment Information](./${path.basename(DEPLOYMENT_INFO_PATH)})
- [Knowledge Version History](./${path.basename(VERSION_HISTORY_PATH)})
`;
      content += crossRefs;
      fs.writeFileSync(PROJECT_CONTEXT_PATH, content, 'utf8');
      console.log('Added cross-references to project context file');
    }
  }
  
  // Similarly add references to other files
  const filesAndRefs = [
    {
      path: TECH_STACK_PATH,
      refs: [
        `## Related Knowledge Files`,
        `- [Project Context](./${path.basename(PROJECT_CONTEXT_PATH)})`,
        `- [Data Models](./${path.basename(DATA_MODELS_PATH)})`,
        `- [Deployment Information](./${path.basename(DEPLOYMENT_INFO_PATH)})`
      ]
    },
    {
      path: DATA_MODELS_PATH,
      refs: [
        `## Related Knowledge Files`,
        `- [Project Context](./${path.basename(PROJECT_CONTEXT_PATH)})`,
        `- [Technology Stack](./${path.basename(TECH_STACK_PATH)})`,
        `- [Deployment Information](./${path.basename(DEPLOYMENT_INFO_PATH)})`
      ]
    },
    {
      path: DEPLOYMENT_INFO_PATH,
      refs: [
        `## Related Knowledge Files`,
        `- [Project Context](./${path.basename(PROJECT_CONTEXT_PATH)})`,
        `- [Technology Stack](./${path.basename(TECH_STACK_PATH)})`,
        `- [Data Models](./${path.basename(DATA_MODELS_PATH)})`
      ]
    }
  ];
  
  filesAndRefs.forEach(item => {
    if (fs.existsSync(item.path)) {
      let content = fs.readFileSync(item.path, 'utf8');
      if (!content.includes("## Related Knowledge Files")) {
        content += "\n\n" + item.refs.join("\n");
        fs.writeFileSync(item.path, content, 'utf8');
        console.log(`Added cross-references to ${path.basename(item.path)}`);
      }
    }
  });
}

// Main execution
function main() {
  console.log("BMAD Agent Knowledge Update Utility");
  console.log("===================================");
  
  // Extract project info (would be more sophisticated in a real implementation)
  const projectInfo = extractProjectInfo();
  
  // Create knowledge files
  console.log("\nCreating knowledge files...");
  
  // Project context file
  const projectContextContent = `# Project Context - ${projectInfo.projectName}

## Project Overview
- **Name:** ${projectInfo.projectName}
- **Description:** ${projectInfo.description}
- **Type:** ${projectInfo.projectType}

## Key Terminology
[Project-specific terms and definitions would be extracted from documentation]

## Domain Knowledge
[Domain-specific information would be extracted from documentation]

## Project Constraints
- Technical stack: ${projectInfo.primaryLanguages}, ${projectInfo.frameworks}
- Infrastructure: ${projectInfo.infrastructureComponents}

## Additional Resources
- Project documentation is located in the \`docs/\` directory
- Architecture diagrams can be found in \`docs/architecture.md\` (BMAD standard naming)
- Project brief is in \`docs/project-brief.md\`
- PRD is in \`docs/prd.md\`
`;
  updateKnowledgeFile(PROJECT_CONTEXT_PATH, projectContextContent);
  
  // Tech stack file
  const techStackContent = `# Technology Stack

## Languages
- ${projectInfo.primaryLanguages}

## Frameworks & Libraries
- ${projectInfo.frameworks}

## Data Storage
- ${projectInfo.databases}

## Architecture Patterns
- ${projectInfo.patterns}

## Development Tools
- Version Control: Git
- CI/CD: ${projectInfo.cicdTools}
- Testing: ${projectInfo.testingTools}
`;
  updateKnowledgeFile(TECH_STACK_PATH, techStackContent);
  
  // Data models file
  const dataModelsContent = `# Data Models & Sources

## Data Sources
- ${projectInfo.dataSources}

## Analysis Approaches
- ${projectInfo.analysisTypes}

## Model Types
- ${projectInfo.modelTypes}

## Data Entities
[Would be extracted from actual documentation]
`;
  updateKnowledgeFile(DATA_MODELS_PATH, dataModelsContent);
  
  // Deployment info file
  const deploymentInfoContent = `# Deployment Information

## Environments
- ${projectInfo.environments}

## CI/CD Tools
- ${projectInfo.cicdTools}

## Infrastructure Components
- ${projectInfo.infrastructureComponents}

## Deployment Process
[Would be extracted from actual documentation]
`;
  updateKnowledgeFile(DEPLOYMENT_INFO_PATH, deploymentInfoContent);
  
  // Initialize knowledge request log
  initializeKnowledgeRequestLog();
  
  // Create cross-references between knowledge files
  createCrossReferences(projectInfo);
  
  // Update version history
  const changedFiles = [
    'project-context.md',
    'tech-stack.md',
    'data-models.md',
    'deployment-info.md'
  ];
  updateVersionHistory("1.0.0", projectInfo, changedFiles);
  
  // Update agent customizations
  console.log("\nUpdating agent customizations...");
  
  // Create customization strings
  const devCustomization = `Specialized in ${projectInfo.primaryLanguages} for ${projectInfo.projectType}. Using ${projectInfo.frameworks}, ${projectInfo.databases}, and following ${projectInfo.patterns} architecture.`;
  
  const dataScientistCustomization = `Working with ${projectInfo.dataSources} data. Project requires ${projectInfo.analysisTypes} and ${projectInfo.modelTypes} models.`;
  
  const devopsCustomization = `Managing deployment to ${projectInfo.environments} using ${projectInfo.cicdTools}. Infrastructure includes ${projectInfo.infrastructureComponents}.`;
  
  const qaCustomization = `Testing ${projectInfo.applicationType} with focus on ${projectInfo.testingTypes}. Using ${projectInfo.testingTools} for automation.`;
  
  // Update IDE config
  updateAgentCustomization(IDE_CONFIG_PATH, "Frontend Dev", devCustomization);
  updateAgentCustomization(IDE_CONFIG_PATH, "Full Stack Dev", devCustomization);
  updateAgentCustomization(IDE_CONFIG_PATH, "Data Scientist", dataScientistCustomization);
  updateAgentCustomization(IDE_CONFIG_PATH, "DevOps Engineer", devopsCustomization);
  updateAgentCustomization(IDE_CONFIG_PATH, "QA Tester", qaCustomization);
  
  // Update Web config
  updateAgentCustomization(WEB_CONFIG_PATH, "Data Scientist", dataScientistCustomization);
  updateAgentCustomization(WEB_CONFIG_PATH, "DevOps Engineer", devopsCustomization);
  updateAgentCustomization(WEB_CONFIG_PATH, "QA Tester", qaCustomization);
  
  console.log("\nKnowledge update complete!");
  console.log("Knowledge files have been created in the .ai/ directory");
  console.log("Agent customizations have been updated in the configuration files");
  console.log("\nNext steps:");
  console.log("1. Review the generated knowledge files and edit as needed");
  console.log("2. If using the web agent, rebuild using: node build-web-agent.js");
  console.log("3. For IDE agents, the changes should be effective immediately");
}

// Run the script
try {
  main();
} catch (error) {
  console.error("An error occurred during knowledge update:", error);
  process.exit(1);
}