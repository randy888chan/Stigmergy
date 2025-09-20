// Stigmergy Project Configuration
import path from "path";

export default {
  projectName: path.basename(process.cwd()),
  features: {
    neo4j: "auto", // Options: 'required', 'auto', 'memory'
    automation_mode: "autonomous", // Options: 'autonomous', 'approval_required', 'hybrid'
    provider_isolation: true,
    deepcode_integration: true,
  },
  // Add your project-specific configuration here
};