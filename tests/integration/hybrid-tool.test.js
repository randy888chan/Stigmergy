import { mock, describe, it, expect, beforeEach } from 'bun:test';

mock.module("axios", () => ({
  default: {
    get: mock(),
    post: mock(),
  }
}));
mock.module("../../tools/research.js", () => ({
  deep_dive: mock(),
}));

describe("Hybrid Archon Tool", () => {
  let axios;
  let archonQuery;
  let nativeResearch;

  beforeEach(async () => {
    mock.restore();
    axios = (await import("axios")).default;
    const archonToolModule = await import("../../tools/archon_tool.js");
    archonQuery = archonToolModule.query;
    nativeResearch = await import("../../tools/research.js");
  });

  it("should use Archon RAG when the server is healthy", async () => {
    axios.get.mockResolvedValue({ status: 200, data: { status: "healthy" } });
    axios.post.mockResolvedValue({ data: { results: [{ content: "Archon Result" }] } });

    await archonQuery({ query: "test" });

    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8181/api/rag/query",
      expect.any(Object)
    );
    expect(nativeResearch.deep_dive).not.toHaveBeenCalled();
  });

  it("should fall back to native research when Archon server fails", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));

    await archonQuery({ query: "test" });

    expect(nativeResearch.deep_dive).toHaveBeenCalledWith({ query: "test" });
  });
});
