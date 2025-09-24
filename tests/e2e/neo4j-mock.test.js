import { mock, test, expect, describe } from 'bun:test';

// Mock the neo4j-driver
mock.module("neo4j-driver", () => ({
  default: {
    driver: mock(),
    auth: {
      basic: mock(),
    },
  }
}));

describe("Neo4j Mocked Connection", () => {
  test("should use mocked neo4j-driver", async () => {
    const neo4j = (await import("neo4j-driver")).default;

    const mockDriver = {
      verifyConnectivity: mock().mockResolvedValue(true),
      close: mock().mockResolvedValue(true),
      getServerInfo: mock().mockResolvedValue({ address: "mock://localhost:7687" }),
    };
    neo4j.driver.mockReturnValue(mockDriver);
    neo4j.auth.basic.mockReturnValue({});

    const driver = neo4j.driver("mock://localhost:7687", neo4j.auth.basic("user", "password"));

    await driver.verifyConnectivity();
    const serverInfo = await driver.getServerInfo();

    expect(neo4j.driver).toHaveBeenCalledWith("mock://localhost:7687", expect.any(Object));
    expect(driver.verifyConnectivity).toHaveBeenCalled();
    expect(driver.getServerInfo).toHaveBeenCalled();
    expect(serverInfo.address).toBe("mock://localhost:7687");

    await driver.close();
    expect(driver.close).toHaveBeenCalled();
  });
});
