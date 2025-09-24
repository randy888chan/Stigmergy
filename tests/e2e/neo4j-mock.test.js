import { jest } from '@jest/globals';

// Mock the neo4j-driver
jest.unstable_mockModule("neo4j-driver", () => ({
  default: {
    driver: jest.fn(),
    auth: {
      basic: jest.fn(),
    },
  }
}));

describe("Neo4j Mocked Connection", () => {
  test("should use mocked neo4j-driver", async () => {
    const neo4j = (await import("neo4j-driver")).default;

    const mockDriver = {
      verifyConnectivity: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true),
      getServerInfo: jest.fn().mockResolvedValue({ address: "mock://localhost:7687" }),
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
