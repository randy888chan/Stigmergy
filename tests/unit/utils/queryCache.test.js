import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const cache = new Map();
const mockCacheInstance = {
    get: jest.fn((key) => cache.get(key)),
    set: jest.fn((key, value) => cache.set(key, value)),
    flushAll: jest.fn(() => cache.clear()),
};
const mockNodeCache = jest.fn().mockImplementation(() => mockCacheInstance);

jest.unstable_mockModule('node-cache', () => ({
    default: mockNodeCache,
}));

const { cachedQuery } = await import("../../../utils/queryCache.js");
const { default: NodeCache } = await import("node-cache");
  
describe('cachedQuery', () => {
    let queryFn;
    let cachedFn;
  
    beforeEach(() => {
      // Reset mocks and cache before each test
      NodeCache.mockClear();
      const cacheInstance = new NodeCache();
      cacheInstance.get.mockClear();
      cacheInstance.set.mockClear();
      cacheInstance.flushAll(); 
  
      queryFn = jest.fn();
    });
  
    it('should call the query function when the cache is empty', async () => {
      queryFn.mockResolvedValue('result');
      cachedFn = cachedQuery('test', queryFn);
  
      const result = await cachedFn('arg1', 'arg2');
  
      expect(result).toBe('result');
      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(queryFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  
    it('should return the cached result without calling the query function', async () => {
      queryFn.mockResolvedValue('result');
      cachedFn = cachedQuery('test', queryFn);
  
      await cachedFn('arg1', 'arg2');
      const result = await cachedFn('arg1', 'arg2');
  
      expect(result).toBe('result');
      expect(queryFn).toHaveBeenCalledTimes(1);
    });
  
    it('should call the query function again for different arguments', async () => {
      queryFn.mockResolvedValueOnce('result1').mockResolvedValueOnce('result2');
      cachedFn = cachedQuery('test', queryFn);
  
      const result1 = await cachedFn('arg1');
      const result2 = await cachedFn('arg2');
  
      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(queryFn).toHaveBeenCalledTimes(2);
    });
});
