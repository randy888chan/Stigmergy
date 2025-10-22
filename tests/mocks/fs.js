import { Volume } from 'memfs';
import { promisify } from 'util';

// The single, shared in-memory volume for all tests
export const vol = new Volume();

// Create a basic fs object from the volume.
const memfs = require('memfs').createFsFromVolume(vol);

// --- START: Definitive Fix for Callback Compatibility ---
// Some dependencies expect callback-based fs methods. We need to wrap the
// promise-based methods from memfs to provide this, while also preserving
// the original promise-based behavior for other parts of the code.

const originalMkdir = memfs.mkdir;
memfs.mkdir = (path, options, callback) => {
    let cb = callback;
    let opts = options;
    if (typeof options === 'function') {
        cb = options;
        opts = undefined;
    }
    // If no callback is provided, return the original promise.
    if (typeof cb !== 'function') {
        return originalMkdir.call(memfs, path, opts);
    }
    // Otherwise, execute with the callback.
    originalMkdir.call(memfs, path, opts)
        .then(res => cb(null, res))
        .catch(err => cb(err));
};

const originalAppendFile = memfs.appendFile;
memfs.appendFile = (path, data, options, callback) => {
    let cb = callback;
    let opts = options;
    if (typeof options === 'function') {
        cb = options;
        opts = undefined;
    }
    if (typeof cb !== 'function') {
        return originalAppendFile.call(memfs, path, data, opts);
    }
    originalAppendFile.call(memfs, path, data, opts)
        .then(res => cb(null, res))
        .catch(err => cb(err));
};
// --- END: Definitive Fix ---


// --- Create a comprehensive mock that includes fs-extra methods ---
const mockFs = {
  ...memfs,
  promises: memfs.promises,
};

// Manually implement the most common fs-extra methods
mockFs.ensureDir = promisify(memfs.mkdir);
mockFs.ensureDirSync = memfs.mkdirSync;
mockFs.pathExists = promisify(memfs.exists).bind(memfs);
mockFs.writeJson = async (file, obj, options) => {
  const content = JSON.stringify(obj, null, options?.spaces);
  await mockFs.promises.writeFile(file, content, 'utf8');
};
mockFs.readJson = async (file, options) => {
  const content = await mockFs.promises.readFile(file, 'utf8');
  return JSON.parse(content);
};
mockFs.copy = promisify(memfs.copyFile).bind(memfs);
mockFs.remove = promisify(memfs.rm).bind(memfs);


// --- Final Export ---
const definitiveMock = {
  ...mockFs,
  default: mockFs,
};

export default definitiveMock;
