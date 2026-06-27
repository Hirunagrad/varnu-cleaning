import { createClient } from '@vercel/kv';
import Redis from 'ioredis';
import fs from 'fs/promises';
import path from 'path';

// Gather possible environment variables
const redisUrl = process.env.REDIS_URL;
const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Determine which client to use
const USE_REDIS = !!redisUrl;
const USE_VERCEL_KV = !USE_REDIS && !!(kvUrl && kvToken);
const USE_MOCK = !USE_REDIS && !USE_VERCEL_KV;

const ioRedisClient = USE_REDIS ? new Redis(redisUrl as string) : null;
const vercelKv = USE_VERCEL_KV ? createClient({ url: kvUrl as string, token: kvToken as string }) : null;

const MOCK_DB_PATH = path.join(process.cwd(), '.mock-kv.json');

async function readMockDb(): Promise<Record<string, any>> {
  try {
    const data = await fs.readFile(MOCK_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function writeMockDb(data: Record<string, any>) {
  await fs.writeFile(MOCK_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export const kv = {
  get: async <T>(key: string): Promise<T | null> => {
    if (USE_REDIS) {
      const val = await ioRedisClient!.get(key);
      return val ? JSON.parse(val) : null;
    }
    if (USE_VERCEL_KV) return vercelKv!.get<T>(key);
    
    const db = await readMockDb();
    return (db[key] as T) || null;
  },
  
  set: async <T>(key: string, value: T): Promise<void> => {
    if (USE_REDIS) {
      await ioRedisClient!.set(key, JSON.stringify(value));
      return;
    }
    if (USE_VERCEL_KV) {
      await vercelKv!.set(key, value);
      return;
    }
    
    const db = await readMockDb();
    db[key] = value;
    await writeMockDb(db);
  },
  
  lpush: async <T>(key: string, value: T): Promise<void> => {
    if (USE_REDIS) {
      await ioRedisClient!.lpush(key, JSON.stringify(value));
      return;
    }
    if (USE_VERCEL_KV) {
      await vercelKv!.lpush(key, value);
      return;
    }
    
    const db = await readMockDb();
    if (!Array.isArray(db[key])) {
      db[key] = [];
    }
    db[key].unshift(value);
    await writeMockDb(db);
  },
  
  lrange: async <T>(key: string, start: number, stop: number): Promise<T[]> => {
    if (USE_REDIS) {
      const vals = await ioRedisClient!.lrange(key, start, stop);
      return vals.map(v => JSON.parse(v));
    }
    if (USE_VERCEL_KV) return vercelKv!.lrange<T>(key, start, stop);
    
    const db = await readMockDb();
    const arr = db[key];
    if (!Array.isArray(arr)) return [];
    const end = stop === -1 ? arr.length : stop + 1;
    return arr.slice(start, end) as T[];
  },
  
  del: async (key: string): Promise<void> => {
    if (USE_REDIS) {
      await ioRedisClient!.del(key);
      return;
    }
    if (USE_VERCEL_KV) {
      await vercelKv!.del(key);
      return;
    }
    
    const db = await readMockDb();
    delete db[key];
    await writeMockDb(db);
  }
};
