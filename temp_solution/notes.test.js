const request = require('supertest');
const express = require('express');

const app = express();
app.get('/', (req, res) => {
  res.send('Hello World!');
});

describe('GET /', () => {
  it('should return 200 OK', async () => {
    await request(app).get('/').expect(200);
  });
});