import request from 'supertest';
import { mock, describe, it, expect, beforeAll } from 'bun:test';

// Mock the tool that gets called by the endpoint
mock.module('../../tools/document_intelligence.js', () => ({
  processDocument: mock().mockResolvedValue({ success: true, segmentCount: 5 }),
}));

describe('POST /api/upload-document', () => {
  let app;
  let Engine;
  let docIntelligence;

  beforeAll(async () => {
    const engineModule = await import('../../engine/server.js');
    Engine = engineModule.Engine;
    docIntelligence = await import('../../tools/document_intelligence.js');
    const engine = new Engine();
    app = engine.app; // Get the hono app instance from the engine
  });

  it('should process an uploaded document and call the intelligence tool', async () => {
    const response = await request(app.fetch)
      .post('/api/upload-document')
      .attach('document', Buffer.from('test document content'), 'test.pdf');

    expect(response.status).toBe(200);
    const json = await response.body.json();
    expect(json.message).toBe('Document processed successfully.');
    expect(json.result.segmentCount).toBe(5);

    // Verify that the underlying tool was called
    expect(docIntelligence.processDocument).toHaveBeenCalled();
  });
});
