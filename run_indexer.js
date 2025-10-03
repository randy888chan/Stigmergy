import { CodeIntelligenceService } from '/path/to/your/stigmergy/services/code_intelligence_service.js';
    import config from '/path/to/your/stigmergy/stigmergy.config.js';

    async function main() {
      console.log("Starting codebase indexing...");
      const codeIntel = new CodeIntelligenceService(config);
      await codeIntel.testConnection(); // Ensure Neo4j is running

      const files = await codeIntel.scanProjectStructure(process.cwd());
      const { symbols, relationships } = await codeIntel.extractSemanticInformation(files);
      await codeIntel.buildKnowledgeGraph(symbols, relationships);
      console.log("Codebase indexing complete. The swarm is ready.");
    }

    main();
