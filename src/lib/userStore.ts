import { Redis } from "@upstash/redis"

const redis = process.env.UPSTASH_REDIS_REST_URL ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : null

export const userStore = {
  async get(email: string) {
    if (!redis) return null
    return await redis.hgetall(`user:${email}`) as any
  },
  async set(email: string, data: { id: string; email: string; password: string; name: string; role: string }) {
    if (!redis) return
    await redis.hset(`user:${email}`, data)
    await redis.sadd("users", email)
  },
  async has(email: string) {
    if (!redis) return false
    return await redis.exists(`user:${email}`)
  },
  async getAll() {
    if (!redis) return []
    const emails = await redis.smembers("users") as string[]
    const users = []
    for (const email of emails) {
      const user = await redis.hgetall(`user:${email}`) as any
      if (user) users.push({ id: user.id, email: user.email, name: user.name, role: user.role })
    }
    return users
  },
}
