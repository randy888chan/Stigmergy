# 🤖 Stigmergy Universal IDE Integration

Stigmergy's standalone service architecture allows it to integrate with any development environment and any programming language through the **Model-Context Protocol (MCP)**. This guide explains how to connect your IDE to the Stigmergy global service.

## ARCHITECTURE

The integration is simple: your IDE communicates directly with the Stigmergy global service, which runs in the background on your system.

```
IDE (VS Code, Roo Code, Cursor, etc.)
    |
    | (MCP over WebSocket)
    |
    ▼
Stigmergy Global Service (localhost:3010)
    |
    | (Manages all projects)
    |
    ▼
Your Project Files (/path/to/your/project)
```

The Stigmergy service intelligently detects which project you are working on based on the file paths sent by your IDE.

## 🚀 Setup

Setup is a one-time process. Once configured, Stigmergy will work automatically with all your projects.

1.  **Install and Run Stigmergy**:
    If you haven't already, install Stigmergy globally and start the service:
    ```bash
    # Install Stigmergy (if you haven't already)
    npm install -g @randy888chan/stigmergy

    # Start the global service
    stigmergy start-service
    ```

2.  **Initialize Your Project**:
    Navigate to your project's root directory and run `init`. This creates a lightweight `.stigmergy/` folder for project-specific configurations.
    ```bash
    cd /path/to/your/project
    stigmergy init
    ```

3.  **Configure Your IDE**:
    In your IDE's settings (e.g., for the Continue extension in VS Code, or the native settings in Roo Code), find the "MCP Server" or "IDE Connection" setting and point it to the Stigmergy global service URL:

    **`http://localhost:3010`**

    There is no longer a need to configure a path to a specific `mcp-server.js` script.

That's it! Your IDE is now connected to Stigmergy. You can use your IDE's chat or command interface to interact with Stigmergy's autonomous agents.

## ✅ Benefits of the New Architecture

- **Truly Universal**: Works with any project (Python, Java, Go, etc.) without any project-level installation.
- **Zero Maintenance**: The connection is to the global service. When you update Stigmergy (`npm update -g @randy888chan/stigmergy`), all your projects get the latest features automatically.
- **No More Local Scripts**: You can safely delete any old `mcp-server.js` files from your projects.
- **Smart Context Detection**: The global service knows which project you're working on and manages context automatically.
- **Robust and Stable**: Runs as a persistent background service, ensuring it's always ready when you need it.
