# Stigmergy Troubleshooting Guide

This guide helps you solve the most common setup and configuration issues.

## 1. Installation Fails

If `npx @randy888chan/stigmergy install` fails, it's almost always a file permission issue.

*   **Symptom:** You see errors like `EACCES: permission denied`.
*   **Solution:** Make sure you have write permissions in your project directory. On macOS/Linux, you can try running `sudo npx @randy888chan/stigmergy install`, but it's better to fix the underlying directory permissions.

## 2. IDE Chat Doesn't Work (`.roomodes`)

If you send a message to `@system` or `@saul` and nothing happens, your IDE is likely unable to connect to the Stigmergy engine.

*   **Step 1: Is the Engine Running?**
    Make sure you have an active terminal window where you've run `npm start`. You should see output like `[Server] Stigmergy Engine is listening on http://localhost:3000`.

*   **Step 2: Check Your Port**
    The engine runs on a port defined in your `.env` file (`PORT=3000` by default). The installer uses this port to write the API URLs in your `.roomodes` file.
    *   If you change the `PORT` in `.env` *after* installing, the URLs in `.roomodes` will be wrong.
    *   **Solution:** Simply run `npx @randy888chan/stigmergy install` again. It will safely overwrite `.roomodes` with the correct, updated URLs.

## 3. Neo4j Indexing Issues

The code indexer runs automatically the first time you start a project. If it fails, the system will still work, but agents will have less context about your code.

*   **Symptom:** You see an error like `[Engine] Automatic code indexing failed` in your `npm start` terminal.
*   **Solution 1: Check Database Status:** Is your Neo4j database running? Make sure the application is active.
*   **Solution 2: Check Credentials:** Double-check that `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD` in your `.env` file are 100% correct. Any typo will cause a connection failure.

## 4. "No valid agents were found" Error during Install

This was a bug in a previous version. If you see this, you are likely running an older, cached version of the package.

*   **Solution:** Clear your npx cache and try again.
    ```bash
    # For npm v7+
    npm cache clean --force
    # For older npm
    # rm -rf ~/.npm/_npx

    # Then re-run the install
    npx @randy888chan/stigmergy install
    ``````
