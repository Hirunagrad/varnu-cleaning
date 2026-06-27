import { createClient } from '@vercel/kv';
import fs from 'fs/promises';
import path from 'path';

const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const vercelKv = createClient({
  url: kvUrl || 'https://mock.upstash.io',
  token: kvToken || 'mock',
});

// Mock KV using a local JSON file if environment variables are not set.
const USE_MOCK = !kvUrl || !kvToken;
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
    if (!USE_MOCK) return vercelKv.get<T>(key);
    const db = await readMockDb();
    return (db[key] as T) || null;
  },
  set: async <T>(key: string, value: T): Promise<void> => {
    if (!USE_MOCK) {
      await vercelKv.set(key, value);
      return;
    }
    const db = await readMockDb();
    db[key] = value;
    await writeMockDb(db);
  },
  lpush: async <T>(key: string, value: T): Promise<void> => {
    if (!USE_MOCK) {
      await vercelKv.lpush(key, value);
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
    if (!USE_MOCK) return vercelKv.lrange<T>(key, start, stop);
    const db = await readMockDb();
    const arr = db[key];
    if (!Array.isArray(arr)) return [];
    const end = stop === -1 ? arr.length : stop + 1;
    return arr.slice(start, end) as T[];
  },
  del: async (key: string): Promise<void> => {
    if (!USE_MOCK) {
      await vercelKv.del(key);
      return;
    }
    const db = await readMockDb();
    delete db[key];
    await writeMockDb(db);
  }
};
