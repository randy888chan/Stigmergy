// In tests/mocks/fs.js

import { Volume } from "memfs";
import { promisify } from "util";

// This is the definitive, high-fidelity mock for the `fs-extra` library.
// It correctly replicates fs-extra's dual promise/callback API for all methods.

// The single, shared in-memory volume for all tests
export const vol = new Volume();

// 1. Create the base, callback-style filesystem from the in-memory volume.
const memfs = require("memfs").createFsFromVolume(vol);

// 2. A robust helper to wrap a promise-returning function so it also accepts a callback.
const promisifyWithCallback =
  (fn) =>
  (...args) => {
    const cb = typeof args[args.length - 1] === "function" ? args.pop() : null;
    const promise = fn(...args);
    if (cb) {
      promise.then((res) => cb(null, res)).catch((err) => cb(err));
    } else {
      return promise;
    }
  };

// 3. Create the mock object, starting with all the synchronous methods from memfs.
const mockFs = { ...memfs };

// 4. Manually build the `.promises` API by promisifying the base callback methods.
mockFs.promises = {
  access: promisify(memfs.access).bind(memfs),
  appendFile: promisify(memfs.appendFile).bind(memfs),
  copyFile: promisify(memfs.copyFile).bind(memfs),
  lstat: promisify(memfs.lstat).bind(memfs),
  mkdir: promisify(memfs.mkdir).bind(memfs),
  open: promisify(memfs.open).bind(memfs),
  readdir: promisify(memfs.readdir).bind(memfs),
  readFile: promisify(memfs.readFile).bind(memfs),
  realpath: promisify(memfs.realpath).bind(memfs),
  rename: promisify(memfs.rename).bind(memfs),
  rm: promisify(memfs.rm).bind(memfs),
  rmdir: promisify(memfs.rmdir).bind(memfs),
  stat: promisify(memfs.stat).bind(memfs),
  unlink: promisify(memfs.unlink).bind(memfs),
  writeFile: promisify(memfs.writeFile).bind(memfs),
  exists: promisify(memfs.exists).bind(memfs),
};

// 5. Re-implement the top-level functions to support both promises and callbacks.
mockFs.readFile = promisifyWithCallback(mockFs.promises.readFile);
mockFs.writeFile = promisifyWithCallback(mockFs.promises.writeFile);
mockFs.appendFile = promisifyWithCallback(mockFs.promises.appendFile);
mockFs.copy = promisifyWithCallback(mockFs.promises.copyFile);
mockFs.remove = promisifyWithCallback(mockFs.promises.rm);
mockFs.readdir = promisifyWithCallback(mockFs.promises.readdir);
mockFs.ensureDir = promisifyWithCallback((path, options) =>
  mockFs.promises.mkdir(path, { recursive: true, ...options })
);
mockFs.pathExists = async (p) => {
  try {
    await mockFs.promises.access(p);
    return true;
  } catch {
    return false;
  }
};
mockFs.writeJson = promisifyWithCallback(async (file, obj, options) => {
  const content = JSON.stringify(obj, null, options?.spaces);
  await mockFs.promises.writeFile(file, content, "utf8");
});
mockFs.readJson = promisifyWithCallback(async (file) => {
  const content = await mockFs.promises.readFile(file, "utf8");
  return JSON.parse(content);
});
mockFs.ensureDirSync = (path, options) => {
  return mockFs.mkdirSync(path, { recursive: true, ...options });
};

// 6. Final Export Structure
const definitiveMock = {
  ...mockFs,
  default: mockFs,
};

export default definitiveMock;