/**
 * @jest-environment node
 */
import request from 'supertest';
import { jest } from '@jest/globals';

// Mock the tool that gets called by the endpoint
jest.unstable_mockModule('../../tools/document_intelligence.js', () => ({
  processDocument: jest.fn().mockResolvedValue({ success: true, segmentCount: 5 }),
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
