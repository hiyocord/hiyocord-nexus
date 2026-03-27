import { paths as nexus_paths } from "@hiyocord/hiyocord-nexus-types";
import { AlgorithmName, signRequest } from "../authentication";
import { createMiddleware } from "hono/factory";
import createClient, { ClientOptions } from "openapi-fetch";
import { getClient, paths as discord_paths } from "@hiyocord/discord-rest-api";
import { url } from "node:inspector";

export type Env = {
  Bindings: {
    NEXUS_URL: string
    HIYOCORD_PRIVATE_KEY: string
    HIYOCORD_KEY_ALGORITHM: AlgorithmName
  },
  Variables: {
    nexus: ReturnType<typeof createNexusFetch>
    proxy: {
      discord: ReturnType<typeof createDiscordApiProxy>
    }
  }
}

export const createDiscordApiProxy = (url: string, privateKey: string, algorithm: AlgorithmName, options?: ClientOptions) => {
  const client = createClient<discord_paths>({
    baseUrl: url,
    ...options,
  });

  client.use({
    onRequest: async ({request}) => {
      let headers: Record<string, string> = {};
      request.headers.forEach((v, k) => headers[k] = v)
      const body = await request.arrayBuffer();

      const signedHeaders = await signRequest(
        algorithm,
        privateKey,
        headers,
        body
      )

      return new Request(request.url, {
        ...request,
        headers: signedHeaders,
        body: body
      })
    }
  })

  return client;
}



export const createNexusFetch = (url: string, privateKey: string, algorithm: AlgorithmName) => {
  const client = createClient<nexus_paths>({
    baseUrl: url
  })

  client.use({
    onRequest: async ({request}) => {
      let headers: Record<string, string> = {};
      request.headers.forEach((v, k) => headers[k] = v)
      const body = await request.arrayBuffer();

      const signedHeaders = await signRequest(
        algorithm,
        privateKey,
        headers,
        body
      )

      return new Request(request.url, {
        ...request,
        headers: signedHeaders,
        body: body
      })
    }
  })

  return client
}

export const useNexusFetch = createMiddleware<Env>((c, next) => {
  const nexusFetch = createNexusFetch(c.env.NEXUS_URL, c.env.HIYOCORD_PRIVATE_KEY, c.env.HIYOCORD_KEY_ALGORITHM);
  c.set("nexus", nexusFetch);
  c.set("proxy", {
    discord: createDiscordApiProxy(`${c.env.NEXUS_URL}/api/proxy/discord/v10`, c.env.HIYOCORD_PRIVATE_KEY, c.env.HIYOCORD_KEY_ALGORITHM)
  });
  return next()
})

