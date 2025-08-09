## Neo4j Configuration

Stigmergy requires a running Neo4j database:

1. **Install Neo4j Desktop**: Download from [Neo4j website](https://neo4j.com/download/)
2. **Create a database** with these settings:
   - Username: `neo4j`
   - Password: (your choice)
   - Bolt Port: `7687`
3. **Update your `.env` file**:
   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   ```
