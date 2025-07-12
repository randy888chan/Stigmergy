const glob = require('glob');
const path = require('path');
const parser = require('./parser');
const neo4jLoader = require('./neo4j_loader');

const projectRoot = process.cwd();

async function main() {
  console.log('🚀 Starting Code Graph Indexer...');

  await neo4jLoader.init();
  await neo4jLoader.clearDatabase();
  console.log('✓ Cleared existing graph data.');

  const files = glob.sync('**/*.{js,ts,jsx,tsx}', {
    cwd: projectRoot,
    ignore: ['node_modules/**', 'dist/**'],
  });

  console.log(`Found ${files.length} files to index.`);

  let allNodes = [];
  let allRelationships = [];

  for (const file of files) {
    const filePath = path.join(projectRoot, file);
    try {
      const { nodes, relationships } = await parser.parseFile(filePath, projectRoot);
      allNodes.push(...nodes);
      allRelationships.push(...relationships);
      console.log(`  - Parsed ${file}`);
    } catch (e) {
      console.error(`  - FAILED to parse ${file}: ${e.message}`);
    }
  }
  
  console.log(`\nFound ${allNodes.length} nodes and ${allRelationships.length} relationships.`);
  
  await neo4jLoader.loadData({ nodes: allNodes, relationships: allRelationships });
  console.log('✓ Loaded all data into Neo4j.');
  
  await neo4jLoader.close();
  console.log('\n✅ Indexing complete!');
}

main().catch(console.error);
