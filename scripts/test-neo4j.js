import neo4j from "neo4j-driver";
import "dotenv/config";
import chalk from "chalk";
import boxen from "boxen";

async function testNeo4jConnection() {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  console.log(chalk.blue("Testing Neo4j Connection..."));

  if (!uri || !user || !password) {
    const errorMessage = [
      chalk.red.bold("Configuration Error"),
      "",
      "Missing required environment variables:",
      `- NEO4J_URI: ${uri ? "Found" : "Missing"}`,
      `- NEO4J_USER: ${user ? "Found" : "Missing"}`,
      `- NEO4J_PASSWORD: ${password ? "******" : "Missing"}`,
      "",
      "Please check your .env file",
    ].join("\n");

    console.error(
      boxen(errorMessage, {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "red",
      })
    );
    return;
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  // Test with retries
  let connected = false;
  for (let i = 1; i <= 3; i++) {
    try {
      console.log(`Connection attempt ${i}/3...`);
      await driver.verifyConnectivity();
      connected = true;
      break;
    } catch (error) {
      if (i === 3) {
        const errorMessage = [
          chalk.red.bold("Connection Failed"),
          "",
          `URI: ${uri}`,
          `User: ${user}`,
          "",
          "Possible causes:",
          "1. Neo4j Desktop not running",
          "2. Database not active",
          "3. Network/firewall issues",
          "",
          chalk.dim(`Error: ${error.message}`),
        ].join("\n");

        console.error(
          boxen(errorMessage, {
            padding: 1,
            margin: 1,
            borderStyle: "double",
            borderColor: "red",
            title: "CONNECTION FAILED",
          })
        );
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  if (connected) {
    console.log(
      boxen(chalk.green("✓ Connection Successful"), {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "green",
        title: "NEO4J CONNECTION",
      })
    );
  }

  await driver.close();
}

testNeo4jConnection();
