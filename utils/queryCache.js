import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 300, // 5 minutes
  useClones: false,
});

export function cachedQuery(key, queryFn) {
  return async (...args) => {
    const cacheKey = `${key}-${JSON.stringify(args)}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const result = await queryFn(...args);
    cache.set(cacheKey, result);
    return result;
  };
}
