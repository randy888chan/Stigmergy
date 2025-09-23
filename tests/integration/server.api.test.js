import request from 'supertest';
import { Engine } from '../../engine/server.js';
import * as docIntelligence from '../../tools/document_intelligence.js';

// Mock the tool that gets called by the endpoint
jest.mock('../../tools/document_intelligence.js', () => ({
  processDocument: jest.fn().mockResolvedValue({ success: true, segmentCount: 5 }),
}));

describe('POST /api/upload-document', () => {
  let app;

  beforeAll(() => {
    const engine = new Engine();
    app = engine.app; // Get the express app instance from the engine
  });

  it('should process an uploaded document and call the intelligence tool', async () => {
    const response = await request(app)
      .post('/api/upload-document')
      .attach('document', Buffer.from('test document content'), 'test.pdf');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Document processed successfully.');
    expect(response.body.result.segmentCount).toBe(5);

    // Verify that the underlying tool was called
    expect(docIntelligence.processDocument).toHaveBeenCalled();
  });
});
