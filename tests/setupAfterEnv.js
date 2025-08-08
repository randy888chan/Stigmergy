// Mock heavy dependencies globally
jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: () => Promise.resolve({ text: () => "MOCK_RESPONSE" }),
    }),
  })),
}));
