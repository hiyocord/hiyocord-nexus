import { Context, Next } from "hono"
import { verify } from "hono/jwt"
import { getCookie } from "hono/cookie"
import { HonoEnv } from "../types"

export const requireAuth = async (c: Context<HonoEnv>, next: Next) => {
  const token = getCookie(c, 'nexus_token')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET) as { user_id: string; exp: number }
    c.set('user', payload)
    return await next()
  } catch (err) {
    console.error('JWT verification error:', err)
    return c.json({ error: 'Invalid token' }, 401)
  }
}
