import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Define the mock service instance that all tests will use
const mockServiceInstance = {
    findUsages: jest.fn(),
    getDefinition: jest.fn(),
    getModuleDependencies: jest.fn(),
    calculateCKMetrics: jest.fn(),
    _runQuery: jest.fn(),
};

// Mock modules using the ESM-compatible API
jest.unstable_mockModule("../../../services/code_intelligence_service.js", () => ({
    // Mock the class constructor to return our singleton instance
    CodeIntelligenceService: jest.fn().mockImplementation(() => mockServiceInstance),
}));

jest.unstable_mockModule("../../../utils/queryCache.js", () => ({
    cachedQuery: jest.fn((name, fn) => fn), // Mock cachedQuery to just execute the function
}));

jest.unstable_mockModule("../../../ai/providers.js", () => ({
    getModelForTier: jest.fn(),
}));

jest.unstable_mockModule("ai", () => ({
    generateObject: jest.fn(),
}));


describe("Code Intelligence Tools", () => {
    let codeIntelligenceTools;
    let generateObject;
    let getModelForTier;

    beforeEach(async () => {
        // Dynamically import the modules *after* the mocks are in place
        codeIntelligenceTools = await import("../../../tools/code_intelligence.js");
        generateObject = (await import("ai")).generateObject;
        getModelForTier = (await import("../../../ai/providers.js")).getModelForTier;

        // It's good practice to reset mocks before each test, though beforeEach should handle this.
        // We'll clear them in afterEach to be safe.
    });

    afterEach(() => {
        // Clear all mocks after each test to ensure isolation
        jest.clearAllMocks();
    });

    test("findUsages should call the service", async () => {
        await codeIntelligenceTools.findUsages({ symbolName: "test" });
        expect(mockServiceInstance.findUsages).toHaveBeenCalledWith({ symbolName: "test" });
    });

    test("getDefinition should call the service", async () => {
        await codeIntelligenceTools.getDefinition({ symbolName: "test" });
        expect(mockServiceInstance.getDefinition).toHaveBeenCalledWith({ symbolName: "test" });
    });

    test("getModuleDependencies should call the service", async () => {
        await codeIntelligenceTools.getModuleDependencies({ filePath: "test.js" });
        expect(mockServiceInstance.getModuleDependencies).toHaveBeenCalledWith({
            filePath: "test.js",
        });
    });

    test("calculateCKMetrics should call the service", async () => {
        await codeIntelligenceTools.calculateCKMetrics({ className: "Test" });
        expect(mockServiceInstance.calculateCKMetrics).toHaveBeenCalledWith({
            className: "Test",
        });
    });

    describe("get_full_codebase_context", () => {
        test("should format a successful query result", async () => {
            const mockResult = [
                { file: 'a.js', members: [{ name: 'ClassA', type: 'Class' }] },
                { file: 'b.js', members: [{name: null}] } // test case where members are empty
            ];
            mockServiceInstance._runQuery.mockResolvedValue(mockResult);

            const context = await codeIntelligenceTools.get_full_codebase_context();
            expect(context).toContain("File: a.js");
            expect(context).toContain("- Class: ClassA");
            expect(context).toContain("File: b.js");
            expect(context).toContain("(No defined classes or functions found)");
        });

        test("should handle empty query results", async () => {
            mockServiceInstance._runQuery.mockResolvedValue([]);
            const context = await codeIntelligenceTools.get_full_codebase_context();
            expect(context).toContain("No code intelligence data found.");
        });

        test("should handle query errors gracefully", async () => {
            mockServiceInstance._runQuery.mockRejectedValue(new Error("DB connection failed"));
            const context = await codeIntelligenceTools.get_full_codebase_context();
            expect(context).toContain("Error retrieving codebase context: DB connection failed.");
        });
    });

    describe("validate_tech_stack", () => {
        test("should call generateObject with the correct parameters and return the object", async () => {
            const mockResponse = {
                is_suitable: true,
                pros: ["Fast"],
                cons: ["Complex"],
                recommendation: "Go for it",
            };
            generateObject.mockResolvedValue({ object: mockResponse });

            const result = await codeIntelligenceTools.validate_tech_stack({
                technology: "React",
                project_goal: "Build a blog",
            });

            expect(getModelForTier).toHaveBeenCalledWith("b_tier");
            expect(generateObject).toHaveBeenCalled();
            expect(result).toEqual(mockResponse);
        });
    });
});
