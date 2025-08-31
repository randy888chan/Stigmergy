import { cachedQuery } from "../../../utils/queryCache.js";
import NodeCache from "node-cache";

jest.mock('node-cache', () => {
    const cache = new Map();
    return jest.fn().mockImplementation(() => ({
      get: jest.fn((key) => cache.get(key)),
      set: jest.fn((key, value) => cache.set(key, value)),
      flushAll: jest.fn(() => cache.clear()),
    }));
  });
  
  describe('cachedQuery', () => {
    let queryFn;
    let cachedFn;
  
    beforeEach(() => {
      // Reset mocks and cache before each test
      const MockNodeCache = NodeCache;
      MockNodeCache.mockClear();
      const cacheInstance = new MockNodeCache();
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
