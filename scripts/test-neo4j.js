import neo4j from "neo4j-driver";
import "dotenv/config";
import chalk from "chalk";
import boxen from "boxen";

async function testNeo4jConnection() {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  console.log(chalk.cyan("Attempting to connect to Neo4j..."));
  console.log(`  URI: ${uri ? uri : chalk.yellow("Not Found!")}`);
  console.log(`  User: ${user ? user : chalk.yellow("Not Found!")}`);
  console.log(`  Password: ${password ? "******" : chalk.yellow("Not Found!")}`);
  console.log("\n");

  if (!uri || !user || !password) {
    const errorMessage = [
      chalk.red.bold("Connection Test Failed"),
      "",
      "One or more required environment variables are missing.",
      "Please ensure NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD are set in your .env file.",
    ].join("\n");
    console.error(
      boxen(errorMessage, {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "red",
        title: "CONFIGURATION ERROR",
      })
    );
    return;
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  try {
    await driver.verifyConnectivity();
    const successMessage = [
      chalk.green.bold("Connection Test Successful!"),
      "",
      "Successfully connected to the Neo4j database.",
      "The Stigmergy engine should now be able to start correctly.",
    ].join("\n");
    console.log(
      boxen(successMessage, {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "green",
        title: "CONNECTION OK",
      })
    );
  } catch (error) {
    const errorMessage = [
      chalk.red.bold("Connection Test Failed"),
      "",
      "Could not connect to the Neo4j database with the provided credentials.",
      "",
      chalk.yellow.bold("Common Causes:"),
      "1. Neo4j Desktop application is not running.",
      '2. The database is not set to "Active" in Neo4j Desktop.',
      "3. Incorrect credentials (URI, User, or Password) in your .env file.",
      "",
      chalk.red.dim(`Original error: ${error.message}`),
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
  } finally {
    await driver.close();
  }
}

testNeo4jConnection();
