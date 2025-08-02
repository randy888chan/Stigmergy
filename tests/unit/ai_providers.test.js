import { getModel } from "../../ai/providers.js";
import { createOpenAI } from "@ai-sdk/openai";

jest.mock("@ai-sdk/openai", () => ({
  createOpenAI: jest.fn(),
}));

describe("AI Provider", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    createOpenAI.mockClear();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test("should throw an error if AI_API_KEY is not set", () => {
    delete process.env.AI_API_KEY;
    process.env.AI_MODEL = "test-model";
    expect(() => getModel()).toThrow(
      "Missing AI configuration. Please set AI_API_KEY and AI_MODEL in your .env file."
    );
  });

  test("should throw an error if AI_MODEL is not set", () => {
    process.env.AI_API_KEY = "test-key";
    delete process.env.AI_MODEL;
    expect(() => getModel()).toThrow(
      "Missing AI configuration. Please set AI_API_KEY and AI_MODEL in your .env file."
    );
  });

  test("should initialize with API key and model", () => {
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "test-model";
    delete process.env.AI_API_BASE_URL;

    const mockProvider = jest.fn();
    createOpenAI.mockReturnValue(mockProvider);

    getModel();

    expect(createOpenAI).toHaveBeenCalledWith({
      apiKey: "test-key",
    });
    expect(mockProvider).toHaveBeenCalledWith("test-model");
  });

  test("should initialize with API key, model, and base URL", () => {
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "test-model";
    process.env.AI_API_BASE_URL = "https://example.com/api";

    const mockProvider = jest.fn();
    createOpenAI.mockReturnValue(mockProvider);

    getModel();

    expect(createOpenAI).toHaveBeenCalledWith({
      apiKey: "test-key",
      baseURL: "https://example.com/api",
    });
    expect(mockProvider).toHaveBeenCalledWith("test-model");
  });
});
