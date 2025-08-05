#!/usr/bin/env node
import codeIntelligenceService from "../../services/code_intelligence_service.js";
import chalk from "chalk";
import boxen from "boxen";
import config from "../../stigmergy.config.js";

async function runDiagnostics() {
  console.log(chalk.blue("🔍 Running Neo4j diagnostics..."));

  // Test connection
  const connectionStatus = await codeIntelligenceService.testConnection(3, 1000);

  // Display results
  if (connectionStatus.success) {
    let content = [
      chalk.green.bold("CONNECTION OK"),
      "",
      "Neo4j database is connected and ready for use.",
      "",
    ];

    // Add limitation warnings if any
    if (connectionStatus.limitations && connectionStatus.limitations.warning) {
      content.push(
        chalk.yellow("⚠️ LIMITATION DETECTED:"),
        connectionStatus.limitations.warning,
        connectionStatus.limitations.limitation,
        "",
        chalk.dim(connectionStatus.limitations.recommendation)
      );
    } else {
      content.push(chalk.green("No limitations detected"));
    }

    console.log(
      boxen(content.join("\n"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
        title: "Neo4j Connection Status",
        titleAlignment: "center",
      })
    );
  } else {
    const content = [
      chalk.red.bold("CONNECTION FAILED"),
      "",
      `Error: ${connectionStatus.error}`,
      "",
    ];

    // Add specific troubleshooting steps based on error type
    if (connectionStatus.errorType === "connection_refused") {
      content.push(
        chalk.yellow("Possible Causes:"),
        "• Neo4j Desktop is not running",
        "• Database is not started (check for green status)",
        "• Incorrect URI in .env file",
        "",
        chalk.cyan("Recommended Actions:"),
        "1. Start Neo4j Desktop",
        "2. Start your database instance",
        "3. Verify NEO4J_URI in .env matches (typically bolt://localhost:7687)"
      );
    } else if (connectionStatus.errorType === "authentication_failed") {
      content.push(
        chalk.yellow("Possible Causes:"),
        "• Incorrect username or password",
        "• Default password not changed after first login",
        "",
        chalk.cyan("Recommended Actions:"),
        "1. Verify NEO4J_USER and NEO4J_PASSWORD in .env",
        "2. Try resetting your Neo4j password",
        '3. Check if you need to change default password (often "neo4j" initially)'
      );
    } else {
      content.push(
        chalk.yellow("General Troubleshooting:"),
        "1. Ensure Neo4j Desktop is running",
        "2. Verify database is active (green status)",
        "3. Check credentials in .env file",
        "4. Try restarting both Neo4j and Stigmergy"
      );
    }

    console.log(
      boxen(content.join("\n"), {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "red",
        title: "Neo4j Connection Status",
        titleAlignment: "center",
      })
    );

    // Show config information for debugging
    console.log(chalk.gray("\nCurrent Configuration:"));
    console.log(chalk.gray(`NEO4J_URI: ${process.env.NEO4J_URI || "[not set]"}`));
    console.log(chalk.gray(`NEO4J_USER: ${process.env.NEO4J_USER || "[not set]"}`));
    console.log(chalk.gray(`Features.neo4j: ${config.features?.neo4j || "not set"}`));
  }

  // Exit with appropriate code
  process.exit(connectionStatus.success ? 0 : 1);
}

// Run diagnostics
runDiagnostics().catch((error) => {
  console.error(chalk.red(`Diagnostic failed: ${error.message}`));
  process.exit(1);
});
