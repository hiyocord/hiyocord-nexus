import { SignJWT, jwtVerify } from "jose";

export interface JWTPayload {
  manifest_id: string;
  interaction_id: string;
  exp: number;
}

/**
 * JWT発行
 * @param secret JWT署名用のシークレット
 * @param manifestId ManifestのID
 * @param interactionId InteractionのID
 * @param expiresIn 有効期限（秒）デフォルト: 15秒
 * @returns JWT文字列
 */
export async function issueJWT(
  secret: string,
  manifestId: string,
  interactionId: string,
  expiresIn: number = 15
): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const jwt = await new SignJWT({
    manifest_id: manifestId,
    interaction_id: interactionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secretKey);

  return jwt;
}

/**
 * JWT検証
 * @param secret JWT署名用のシークレット
 * @param token JWT文字列
 * @returns JWTペイロード
 * @throws JWT検証失敗時
 */
export async function verifyJWT(
  secret: string,
  token: string
): Promise<JWTPayload> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    // payloadの型検証
    if (
      typeof payload.manifest_id !== "string" ||
      typeof payload.interaction_id !== "string" ||
      typeof payload.exp !== "number"
    ) {
      throw new Error("Invalid JWT payload structure");
    }

    return {
      manifest_id: payload.manifest_id,
      interaction_id: payload.interaction_id,
      exp: payload.exp,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`JWT verification failed: ${error.message}`);
    }
    throw new Error("JWT verification failed");
  }
}
