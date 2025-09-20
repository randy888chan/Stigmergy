const express = require('express');
const router = express.Router();

// Mock database
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

// Get all users
router.get('/', (req, res) => {
  res.json(users);
});

module.exports = router;
