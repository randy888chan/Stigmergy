import { EventEmitter } from "events";

export class SharedMemory extends EventEmitter {
  constructor() {
    super();
    this.memory = new Map();
    this.persistent = new Map();
  }

  // In-memory cache with file persistence
  async set(key, value, persist = false) {
    this.memory.set(key, value);

    if (persist) {
      this.persistent.set(key, {
        value,
        timestamp: Date.now(),
        ttl: 300000, // 5 minutes
      });
    }

    this.emit("memoryUpdated", { key, value });
  }

  async get(key) {
    const value = this.memory.get(key);

    if (value) return value;

    // Check persistent storage
    const persisted = this.persistent.get(key);
    if (persisted && Date.now() - persisted.timestamp < persisted.ttl) {
      this.memory.set(key, persisted.value);
      return persisted.value;
    }

    return null;
  }

  async invalidate(pattern) {
    const regex = new RegExp(pattern);
    for (const [key] of this.memory) {
      if (regex.test(key)) {
        this.memory.delete(key);
        this.persistent.delete(key);
      }
    }
  }

  // Memory cleanup every 30 seconds
  startCleanup() {
    setInterval(() => {
      for (const [key, data] of this.persistent) {
        if (Date.now() - data.timestamp > data.ttl) {
          this.persistent.delete(key);
          this.memory.delete(key);
        }
      }
    }, 30000);
  }
}
