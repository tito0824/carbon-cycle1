import { Redis } from "@upstash/redis"

const redis = process.env.UPSTASH_REDIS_REST_URL ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : null

const defaultData = {
  user: { w: 70, tw: 65 },
  t: { hc: 200, mc: 120, lc: 60, p: 180 },
  r: {},
  w: {}
}

export const dataStore = {
  async get(userId: string) {
    if (!redis) return null
    const data = await redis.hgetall(`data:${userId}`)
    return data || null
  },
  async set(userId: string, data: any) {
    if (!redis) return
    await redis.hset(`data:${userId}`, data)
  },
}

export { defaultData }
