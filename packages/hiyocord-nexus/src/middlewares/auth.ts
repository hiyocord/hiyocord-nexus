import { verify } from "hono/jwt"
import { getCookie } from "hono/cookie"
import { HonoEnv } from "../types"
import { createMiddleware } from "hono/factory"

export const requireAuth = createMiddleware<HonoEnv & { Variables: {user: { user_id: string; exp: number }} }>(async (c, next) => {
  const token = getCookie(c, 'nexus_token')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET, "HS256") as { user_id: string; exp: number }
    c.set('user', payload)
    return await next()
  } catch (err) {
    console.error('JWT verification error:', err)
    return c.json({ error: 'Invalid token' }, 401)
  }
})
