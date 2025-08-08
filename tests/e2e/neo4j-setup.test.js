import neo4j from "neo4j-driver";
import "dotenv/config";

describe("Neo4j Connection", () => {
  let driver;

  // Before running the tests, check if the required environment variables are set
  beforeAll(() => {
    if (!process.env.NEO4J_URI || !process.env.NEO4J_USER || !process.env.NEO4J_PASSWORD) {
      throw new Error(
        "NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD environment variables must be set"
      );
    }
  });

  afterEach(async () => {
    if (driver) {
      await driver.close();
    }
  });

  test("should connect to Neo4j and verify connectivity", async () => {
    driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
    );

    const serverInfo = await driver.getServerInfo();
    expect(serverInfo).toBeDefined();
    expect(serverInfo.address).toBe(process.env.NEO4J_URI);

    await driver.verifyConnectivity();
  }, 10000); // 10 second timeout for the test
});
