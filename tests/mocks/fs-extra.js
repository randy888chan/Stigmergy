import { mock } from 'bun:test';
// We use require here to get the real memfs library for our mock's implementation
const memfs = require('memfs');

// Create a new, clean in-memory file system volume
const vol = new memfs.Volume();
const fs = memfs.createFsFromVolume(vol);

// This is a "high-fidelity" mock. It includes the extra functions
// from fs-extra that the native fs module doesn't have.
const fsExtraMock = {
  ...fs,
  // --- Add the missing fs-extra functions ---
  ensureDir: (path) => fs.promises.mkdir(path, { recursive: true }),
  remove: (path) => fs.promises.rm(path, { recursive: true, force: true }),
  pathExists: fs.promises.exists,
  copy: mock(), // Keep complex functions as simple mocks for now
  // --- Default export for compatibility ---
  default: {
    ...fs,
    ensureDir: (path) => fs.promises.mkdir(path, { recursive: true }),
    remove: (path) => fs.promises.rm(path, { recursive: true, force: true }),
    pathExists: fs.promises.exists,
    copy: mock(),
  },
  vol, // Export the volume so tests can manipulate the file system
};

export default fsExtraMock;