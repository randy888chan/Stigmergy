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

## 3. Engine Fails to Start or AI is Unresponsive

This is the most common and critical issue. It manifests in two ways:

1.  You run `npm run stigmergy:start` and the process exits immediately with a large red "CRITICAL DATABASE ERROR" message.
2.  The engine seems to start, but agents like `@saul` are unresponsive, don't perform tasks (like research or coding), or get stuck in a loop asking what to do.

- **Cause:** In both cases, the cause is a **failed connection to the Neo4j database**. The database is the AI's "brain," allowing it to understand your code. If the engine cannot connect to it, it cannot function.

- **Solution: Use the Neo4j Connection Tester**

  We've included a simple tool to diagnose this specific problem. In your terminal, run:

  ```bash
  npm run test:neo4j
  ```

  This script will attempt to connect to Neo4j using the credentials in your `.env` file and give you a clear, color-coded report.
  - **If you get a GREEN `CONNECTION OK` box:** Your credentials are correct and the database is reachable. If agents are still not working, the problem lies elsewhere.
  - **If you get a RED `CONNECTION FAILED` box:** The script could reach the server, but the login failed. This means your `NEO4J_URI` is likely correct, but your `NEO4J_USER` or `NEO4J_PASSWORD` are wrong.
  - **If you get a RED `CONFIGURATION ERROR` box:** The script couldn't even find the required credentials in your `.env` file.

- **How to Fix a Bad Connection:**
  1.  **Is Neo4j Desktop running?** Make sure the application is open.
  2.  **Is your database active?** Inside Neo4j Desktop, find your project's database and make sure it has a green "Active" status. Click the "Start" button if it's stopped.
  3.  **Are your credentials correct?** Double- and triple-check the `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD` values in your project's `.env` file. A tiny typo will cause the connection to fail.
  4.  **Restart the engine.** After making any changes to your `.env` file or Neo4j, stop the Stigmergy engine (`Ctrl+C`) and restart it with `npm run stigmergy:start`.

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
