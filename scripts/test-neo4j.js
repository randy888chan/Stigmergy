import neo4j from "neo4j-driver";
import "dotenv/config.js";
import chalk from "chalk";
import boxen from "boxen";
import net from "net";
import { URL } from "url";

function checkPort(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000); // 1 second timeout
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function testNeo4jConnection() {
  console.log(chalk.blue.bold("Stigmergy Neo4j Connection Wizard"));
  console.log("------------------------------------");

  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  // 1. Verify .env configuration
  console.log(chalk.yellow("1. Checking .env configuration..."));
  if (!uri || !user || !password) {
    const errorMessage = [
      chalk.red.bold("Configuration Error"),
      "",
      "Missing required environment variables in your .env file:",
      `- NEO4J_URI: ${uri ? chalk.green("Found") : chalk.red("Missing")}`,
      `- NEO4J_USER: ${user ? chalk.green("Found") : chalk.red("Missing")}`,
      `- NEO4J_PASSWORD: ${password ? chalk.green("Found") : chalk.red("Missing")}`,
      "",
      "Please create or check your .env file.",
    ].join("\n");
    console.error(boxen(errorMessage, { padding: 1, borderColor: "red" }));
    return;
  }
  console.log(chalk.green("✓ .env configuration found."));

  // 2. Check Port Availability
  let host, port;
  try {
    const url = new URL(uri);
    host = url.hostname;
    port = Number(url.port);
  } catch (e) {
    console.error(
      chalk.red(`Invalid NEO4J_URI format: ${uri}. It should be like 'bolt://localhost:7687'`)
    );
    return;
  }

  console.log(chalk.yellow(`\n2. Checking port availability at ${host}:${port}...`));
  const isPortOpen = await checkPort(port, host);

  if (!isPortOpen) {
    const errorMessage = [
      chalk.red.bold("Port Unreachable"),
      "",
      `The port ${port} on ${host} is not responding.`,
      "",
      "Suggestions:",
      "1. Ensure your Neo4j database is running.",
      '2. In Neo4j Desktop, make sure the database is "Active".',
      "3. Check that the port in your .env file matches the Bolt port in Neo4j Desktop.",
    ].join("\n");
    console.error(boxen(errorMessage, { padding: 1, borderColor: "red" }));
    return;
  }
  console.log(chalk.green(`✓ Port ${port} is open.`));

  // 3. Test Credentials and Connectivity
  console.log(chalk.yellow("\n3. Testing database credentials..."));
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  try {
    await driver.verifyConnectivity();
    const successMessage = [
      chalk.green.bold("Connection Successful!"),
      "",
      "Your Neo4j database is correctly configured and ready to use.",
    ].join("\n");
    console.log(
      boxen(successMessage, {
        padding: 1,
        borderColor: "green",
        borderStyle: "double",
      })
    );
  } catch (error) {
    let specificAdvice = "";
    if (error.code === "Neo.ClientError.Security.AuthenticationRateLimit") {
      specificAdvice =
        "Authentication failed due to too many failed attempts. Please wait a while before trying again.";
    } else if (
      error.code === "Neo.ClientError.Security.Unauthorized" ||
      error.message.includes("authentication failure")
    ) {
      specificAdvice = [
        "The username or password seems to be incorrect.",
        'The default password is "stigmergy123".',
        "Please verify your credentials in your .env file and in Neo4j Desktop.",
      ].join("\n");
    } else {
      specificAdvice = [
        "An unexpected error occurred. This could be a network issue or a firewall blocking the connection.",
        "Ensure no firewall is blocking the connection to the database.",
      ].join("\n");
    }

    const errorMessage = [
      chalk.red.bold("Authentication Failed"),
      "",
      `URI: ${uri}`,
      `User: ${user}`,
      "",
      chalk.yellow.bold("Specific Advice:"),
      specificAdvice,
      "",
      chalk.dim(`Full Error: ${error.message}`),
    ].join("\n");

    console.error(
      boxen(errorMessage, {
        padding: 1,
        borderColor: "red",
        title: "CONNECTION FAILED",
      })
    );
  } finally {
    await driver.close();
  }
}

testNeo4jConnection();
