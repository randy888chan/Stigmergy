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

## 3. Agents Are Not Working (No Errors)

This is the most common issue. You start the engine, and it seems to be running, but when you try to interact with agents like `@saul` or `@system`, nothing happens, or they don't perform the actions you expect (like creating files or doing research).

*   **Symptom:** The `npm run stigmergy:start` command runs without crashing, but the AI seems unresponsive or unintelligent.
*   **Cause:** This is almost always a **failed connection to the Neo4j database**. The engine will now fail to start if it cannot connect, but if the connection is lost *after* startup, this can still occur. The "Code Intelligence" service is the brain of the system, and without it, agents cannot function correctly.

*   **Solution: Use the Health Check Endpoint**

    To quickly diagnose this, open a new terminal (while the engine is still running) and use `curl` to check the new health endpoint. (Note: The default port is 3000, but yours may differ if you changed it in `.env`).

    ```bash
    curl http://localhost:3000/api/system/health
    ```

    *   **If the connection is GOOD**, you will see a response like this:
        ```json
        {"engine":"RUNNING","dependencies":{"neo4j":{"connected":true,"message":"Connection successful."}}}
        ```

    *   **If the connection is BAD**, you will see a response with an error message:
        ```json
        {"engine":"RUNNING","dependencies":{"neo4j":{"connected":false,"message":"Error: Could not connect to any server in your Bolt list..."}}}
        ```

*   **How to Fix a Bad Connection:**
    1.  **Is Neo4j Desktop running?** Make sure the application is open and the database itself has been started (it should have a green "Active" status).
    2.  **Are your credentials correct?** Double- and triple-check the `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD` in your `.env` file. A tiny typo will cause the connection to fail. After correcting them, you must restart the Stigmergy engine.

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
