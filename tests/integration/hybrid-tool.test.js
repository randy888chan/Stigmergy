// In tests/integration/hybrid-tool.test.js
import axios from "axios";
import { query as archonQuery } from "../../tools/archon_tool.js";
import * as nativeResearch from "../../tools/research.js";

jest.mock("axios");
jest.mock("../../tools/research.js");

describe("Hybrid Archon Tool", () => {
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
