import { AppType, HonoEnv } from "./types";
import { Context } from "hono";
import { getManifest } from "./manifest";
import { Manifest } from "@hiyocord/hiyocord-nexus-types";
import { verifyJWT } from "./jwt";

/**
 * 権限チェック
 */
const checkPermission = (
  manifest: Manifest,
  method: string,
  path: string
): boolean => {
  const permissions = manifest.permissions || [];

  for (const permission of permissions) {
    // 文字列型のpermission (DISCORD_BOT, DISCORD_OAUTH)
    if (typeof permission === "string") {
      if (permission === "DISCORD_BOT") {
        // DISCORD_BOT権限があれば全APIアクセス許可
        return true;
      }
      continue;
    }

    // DISCORD_API_SCOPE型のpermission
    if (permission.type === "DISCORD_API_SCOPE") {
      const scopes = permission.scopes;

      // パスマッチングを行う
      for (const [scopePath, methods] of Object.entries(scopes)) {
        if (matchPath(scopePath, path) && methods.includes(method)) {
          return true;
        }
      }
    }
  }

  return false;
};

/**
 * パスマッチング
 * {param}形式のパラメータを考慮してパスが一致するかチェック
 */
const matchPath = (scopePath: string, requestPath: string): boolean => {
  const scopeSegments = scopePath.split("/").filter((s) => s);
  const pathSegments = requestPath.split("/").filter((s) => s);

  if (scopeSegments.length !== pathSegments.length) {
    return false;
  }

  for (let i = 0; i < scopeSegments.length; i++) {
    const scopeSeg = scopeSegments[i];
    const pathSeg = pathSegments[i];

    // {param}形式のパラメータは任意の値とマッチ
    if (scopeSeg.startsWith("{") && scopeSeg.endsWith("}")) {
      continue;
    }

    if (scopeSeg !== pathSeg) {
      return false;
    }
  }

  return true;
};

/**
 * Discord API Proxyハンドラー
 */
export default (app: AppType) => {
  app.all("/proxy/discord/api/v10/*", async (c: Context<HonoEnv>) => {
    // Authorization ヘッダーの取得
    const authHeader = c.req.header("authorization");

    if (!authHeader) {
      return c.json(
        { error: "Authorization header is required" },
        {
          status: 400
        }
      );
    }

    if (!authHeader.startsWith("Bot ")) {
      return c.json(
        { error: "Invalid authorization header format. Expected: Bearer {JWT}" },
        {
          status: 400
        }
      );
    }

    const jwt = authHeader.substring(4); // "Bot " を除去

    // JWT検証
    let jwtPayload;
    try {
      jwtPayload = await verifyJWT(c.env.JWT_SECRET, jwt);
    } catch (error) {
      console.error("JWT verification failed:", error);
      return c.json(
        {
          error: "JWT verification failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        {
          status: 401
        }
      );
    }

    // Manifestの取得
    const manifests = await getManifest(c);
    const manifest = manifests.find((m) => m.id === jwtPayload.manifest_id);

    if (!manifest) {
      return c.json(
        {
          error: "Manifest not found",
          manifest_id: jwtPayload.manifest_id,
        },
        {
          status: 404
        }
      );
    }

    // リクエストパスとメソッドの取得
    const proxyPath = c.req.path.replace("/proxy/discord/api/v10", "");
    const method = c.req.method;

    // 権限チェック
    if (!checkPermission(manifest, method, proxyPath)) {
      return c.json(
        {
          error: "Permission denied",
          required_scope: `${method} ${proxyPath}`,
          manifest_id: manifest.id,
        },
        {
          status: 403
        }
      );
    }

    // Discord APIへリクエスト転送
    const discordApiUrl = `https://discord.com/api/v10${proxyPath}`;

    // ヘッダーのコピー（一部除外）
    const headers = new Headers();
    const excludeHeaders = [
      "host",
      "authorization", // JWTをBot Tokenに置き換える
      "x-hiyocord-signature",
      "x-hiyocord-timestamp",
      "x-manifest-id",
    ];

    c.req.raw.headers.forEach((value, key) => {
      if (!excludeHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Bot Token付与
    headers.set("Authorization", `Bot ${c.env.DISCORD_BOT_TOKEN}`);

    try {
      // リクエストボディの取得
      const body =
        method !== "GET" && method !== "HEAD"
          ? await c.req.arrayBuffer()
          : null;

      // Discord APIへのリクエスト
      const response = await fetch(discordApiUrl, {
        method,
        headers,
        body,
      });

      // レスポンスヘッダーのコピー
      const responseHeaders = new Headers();
      response.headers.forEach((value, key) => {
        responseHeaders.set(key, value);
      });

      // レスポンスの返却
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("Discord API proxy error:", error);
      return c.json(
        {
          error: "Discord API request failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        {
          status: 502
        }
      );
    }
  });
};
