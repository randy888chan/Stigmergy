# Stigmergy Troubleshooting Guide

This guide helps you solve the most common setup and configuration issues.

## 1. Installation Fails

If `npx @randy888chan/stigmergy install` fails, it's almost always a file permission issue.

- **Symptom:** You see errors like `EACCES: permission denied`.
- **Solution:** Make sure you have write permissions in your project directory. On macOS/Linux, you can try running `sudo npx @randy888chan/stigmergy install`, but it's better to fix the underlying directory permissions.

## 2. IDE Chat Doesn't Work (`.roomodes`)

If you send a message to `@system` or `@saul` and nothing happens, your IDE is likely unable to connect to the Stigmergy engine.

- **Step 1: Is the Engine Running?**
  Make sure you have an active terminal window where you've run `npm start`. You should see output like `[Server] Stigmergy Engine is listening on http://localhost:3000`.

- **Step 2: Check Your Port**
  The engine runs on a port defined in your `.env` file (`PORT=3000` by default). The installer uses this port to write the API URLs in your `.roomodes` file.
  - If you change the `PORT` in `.env` _after_ installing, the URLs in `.roomodes` will be wrong.
  - **Solution:** Simply run `npx @randy888chan/stigmergy install` again. It will safely overwrite `.roomodes` with the correct, updated URLs.

## 2. Neo4j Connection Issues

Stigmergy uses Neo4j for advanced code intelligence, but is designed to operate with limited functionality when Neo4j is unavailable.

### Common Symptoms

- "Neo4j Connection Warning" during startup (yellow box)
- "Code intelligence features temporarily unavailable" messages
- Slower analysis of code structure and dependencies

### Troubleshooting Steps

#### 1. Check Current Connection Status

```bash
npm run test:neo4j
```

This will give you a detailed report of your Neo4j connection status.

#### 2. Understanding Connection Status

| Status                             | Meaning                                                                      | Action                                               |
| ---------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| **CONNECTION OK** (green)          | Neo4j is connected and functioning properly                                  | No action needed                                     |
| **LIMITED FUNCTIONALITY** (yellow) | Neo4j is connected but has limitations (e.g., Community Edition size limits) | Consider upgrading Neo4j edition for larger projects |
| **FALLING BACK** (yellow)          | Neo4j is unavailable but system is using fallback verification               | Fix Neo4j connection for full functionality          |
| **CRITICAL ERROR** (red)           | Neo4j is required but connection failed                                      | Must fix before continuing                           |

#### 3. Fixing Connection Issues

**If you get a "FALLING BACK" status:**

1. Ensure Neo4j Desktop is running
2. Verify your database is active (green status in Neo4j Desktop)
3. Check your `.env` file has correct credentials:
   ```
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   ```

**If you get a "CRITICAL ERROR" status:**

1. Run `npm run test:neo4j` for detailed diagnostics
2. Try restarting Neo4j Desktop
3. Reset your Neo4j password if needed (default is often "neo4j" initially)
4. Check for firewall issues blocking port 7687

#### 4. Using the System While Fixing Neo4j

When Neo4j is unavailable, Stigmergy automatically:

- Uses fallback verification for basic checks
- Continues planning and documentation tasks
- Logs issues for later review
- Alerts when connection is restored

You can continue most development activities, but code intelligence features (like dependency analysis) will be limited until Neo4j is available.

## 4. "No valid agents were found" Error during Install

This was a bug in a previous version. If you see this, you are likely running an older, cached version of the package.

- **Solution:** Clear your npx cache and try again.

  ```bash
  # For npm v7+
  npm cache clean --force
  # For older npm
  # rm -rf ~/.npm/_npx

  # Then re-run the install
  npx @randy888chan/stigmergy install
  ```
