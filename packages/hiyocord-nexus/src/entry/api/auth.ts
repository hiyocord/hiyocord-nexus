import { Hono } from "hono"
import { cors } from "hono/cors"
import { sign, verify } from "hono/jwt"
import { getCookie } from "hono/cookie"
import { HonoEnv } from "../../types"

export default (app: Hono<HonoEnv>) => {
  app.use(
    '/api/auth/*',
    cors({
      origin: [
        'http://localhost:5173',
        'https://dash.nexus.hiyocord.org'
      ],
      allowMethods: ['POST', 'GET', 'OPTIONS'],
      credentials: true,
    })
  )


  // Web API: Discord OAuth2認証画面にリダイレクト
  app.get("/api/auth/discord/authorize", async (c) => {
    const origin = c.req.query("origin")

    if (!origin) {
      return c.json({ error: "origin parameter is required" }, 400)
    }

    // オリジンのバリデーション（必要に応じてホワイトリストを実装）
    try {
      new URL(origin)
    } catch {
      return c.json({ error: "Invalid origin" }, 400)
    }

    const redirectUri = `${origin}/callback`
    const discordAuthUrl = new URL("https://discord.com/api/oauth2/authorize")
    discordAuthUrl.searchParams.set("client_id", c.env.DISCORD_APPLICATION_ID)
    discordAuthUrl.searchParams.set("redirect_uri", redirectUri)
    discordAuthUrl.searchParams.set("response_type", "code")
    discordAuthUrl.searchParams.set("scope", "identify")

    return c.redirect(discordAuthUrl.toString(), 302)
  })

  // Web API: Discord OAuth2トークン交換
  app.post("/api/auth/discord", async (c) => {
    try {
      const { code, redirect_uri } = await c.req.json<{ code: string; redirect_uri: string }>()

      if (!code || !redirect_uri) {
        return c.json({ error: "code and redirect_uri are required" }, 400)
      }

      // Discord OAuth2トークン取得
      const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: c.env.DISCORD_APPLICATION_ID,
          client_secret: c.env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri,
        }),
      })

      if (!tokenResponse.ok) {
        console.error('Failed to get Discord token:', await tokenResponse.text())
        return c.json({ error: 'Failed to authenticate with Discord' }, 401)
      }

      const tokenData = await tokenResponse.json() as { access_token: string }

      // Discordユーザー情報取得
      const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      })

      if (!userResponse.ok) {
        console.error('Failed to get Discord user:', await userResponse.text())
        return c.json({ error: 'Failed to get user information' }, 401)
      }

      const user = await userResponse.json() as {
        id: string
        username: string
        discriminator: string
        avatar: string | null
      }

      // JWT生成
      const token = await sign(
        {
          user_id: user.id,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7日間有効
        },
        c.env.JWT_SECRET
      )

      // HttpOnly Cookieとして設定
      c.header('Set-Cookie', `nexus_token=${token}; HttpOnly; SameSite=Strict; Max-Age=604800; Path=/`)

      return c.json({
        user: {
          id: user.id,
          username: user.username,
          discriminator: user.discriminator,
          avatar: user.avatar,
        },
      }, 200)
    } catch (err) {
      console.error('Auth error:', err)
      return c.json({ error: 'Internal server error' }, 500)
    }
  })

  // Web API: 現在のユーザー情報取得
  app.get("/api/auth/me", async (c) => {
    const token = getCookie(c, 'nexus_token')

    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const payload = await verify(token, c.env.JWT_SECRET) as { user_id: string; exp: number }

      return c.json({
        user: {
          id: payload.user_id,
        },
      }, 200)
    } catch (err) {
      console.error('JWT verification error:', err)
      return c.json({ error: 'Invalid token' }, 401)
    }
  })

  // Web API: ログアウト
  app.post("/api/auth/logout", async (c) => {
    // Cookieを削除
    c.header('Set-Cookie', 'nexus_token=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/')
    return c.json({}, 200)
  })
}
