import open from "open";
import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";

export async function launchNeo4jWithDefaults() {
  console.log(chalk.blue.bold("Stigmergy Neo4j Desktop Setup Helper"));
  console.log("-----------------------------------------");

  try {
    // Determine the config path based on OS
    let neo4jConfDir;
    const homeDir = os.homedir();
    if (process.platform === "win32") {
      neo4jConfDir = path.join(
        homeDir,
        "AppData",
        "Roaming",
        "Neo4j Desktop",
        "Application",
        "relate-data",
        "dbmss"
      );
    } else if (process.platform === "darwin") {
      neo4jConfDir = path.join(
        homeDir,
        "Library",
        "Application Support",
        "Neo4j Desktop",
        "Application",
        "relate-data",
        "dbmss"
      );
    } else {
      // Linux
      neo4jConfDir = path.join(
        homeDir,
        ".config",
        "Neo4j Desktop",
        "Application",
        "relate-data",
        "dbmss"
      );
    }

    // In a real scenario, we would need to find the specific database folder (e.g., dbms-xxxx-xxxx).
    // For this helper, we'll assume a default path and inform the user.
    // This part of the logic is complex and may require user input to be robust.
    console.log(chalk.yellow("This helper provides a best-effort setup for Neo4j Desktop."));
    console.log(
      chalk.yellow("It does not automatically create a new database instance configuration.")
    );

    const defaultConfig = `
# Default settings for Stigmergy
dbms.connector.bolt.listen_address=:7687
dbms.connector.http.listen_address=:7474
dbms.security.auth_enabled=false
`;

    console.log(chalk.cyan("\nWe will now attempt to open Neo4j Desktop."));
    console.log(chalk.cyan("Please follow these steps in the application:"));
    console.log("1. Create a new project and a new local database.");
    console.log("2. Go to the database settings and open the 'neo4j.conf' file.");
    console.log("3. Ensure the following lines are present:\n" + chalk.gray(defaultConfig));
    console.log("4. Start the database.");

    // Open Neo4j Desktop with a first-run tutorial deep link
    await open(
      "neo4j-desktop://graphapps/neo4j-browser?cmd=play&arg=cypher/guides/importing-data/1-introduction.html"
    );

    console.log(chalk.green("\n✓ Neo4j Desktop should now be opening."));
  } catch (error) {
    console.error(chalk.red("Could not open Neo4j Desktop. Please make sure it is installed."));
    console.error(chalk.dim(`Error: ${error.message}`));
  }
}

// Allow running the script directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  launchNeo4jWithDefaults();
}
