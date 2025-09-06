#!/bin/bash

# Stigmergy Health Check Script
# Run this script to check the health of your Stigmergy installation

echo "🚀 Running Stigmergy Health Check..."
echo "==================================="

# Run the Stigmergy validation command
stigmergy validate

echo ""
echo "✅ Health check completed!"
echo ""
echo "💡 Tips:"
echo "  - If you see warnings, they are usually optional for basic functionality"
echo "  - To start Stigmergy: stigmergy start"
echo "  - To stop Stigmergy: pkill -f 'stigmergy'"
echo "  - In VS Code, use the Continue extension with MCP integration"