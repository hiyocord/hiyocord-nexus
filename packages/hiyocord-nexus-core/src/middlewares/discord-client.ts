import { paths } from "@hiyocord/hiyocord-nexus-types";
import { AlgorithmName, signRequest } from "../authentication";
import { createMiddleware } from "hono/factory";
import createClient from "openapi-fetch";

export type Env = {
  Bindings: {
    NEXUS_URL: string
    HIYOCORD_PRIVATE_KEY: string
    HIYOCORD_KEY_ALGORITHM: AlgorithmName
  },
  Variables: {
    nexusFetch: ReturnType<typeof createNexusFetch>
  }
}

export const createNexusFetch = (url: string, privateKey: string, algorithm: AlgorithmName) => {
  const client = createClient<paths>({
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
}

export const useNexusFetch = createMiddleware<Env>((c, next) => {
  const nexusFetch = createNexusFetch(c.env.NEXUS_URL, c.env.HIYOCORD_PRIVATE_KEY, c.env.HIYOCORD_KEY_ALGORITHM);
  c.set("nexusFetch", nexusFetch);
  return next()
})

