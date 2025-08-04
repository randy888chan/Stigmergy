## docs/troubleshooting_scenarios.md

### Scenario: Research Tool Fails

**Symptoms**:

- Agents stuck at research phase
- Timeout errors in logs

**Solution**:

```bash
1. Verify FIRECRAWL_KEY in .env
2. Test connectivity: curl https://api.firecrawl.dev?token=$FIRECRAWL_KEY
3. Check rate limits at https://firecrawl.dev/dashboard
4. Switch to alternative provider if needed
```

### Scenario: Slow Code Indexing

**Symptoms**:

- Engine startup >2 minutes
- High CPU during indexing

**Optimization**:

```bash
# Create .neo4jignore
node_modules/
dist/
.*
*.log

# Then reindex selectively
npm run stigmergy index --only src/
```
