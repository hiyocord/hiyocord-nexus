import { APIInteraction, Manifest } from "@hiyocord/hiyocord-nexus-types";
import { ApplicationContext } from "../../application-context";
import { issueJWT } from "../../jwt";
import { sign } from "@hiyocord/hiyocord-nexus-core";

export const InteractionTransfer = (ctx: ApplicationContext) => {
  const createJwt = async (manifest: Manifest, interactionId: string) => {
    return await issueJWT(
      ctx.getTransferInteractionJwtSecret(),
      manifest.id,
      interactionId,
      60 * 5
    );
  }

  const getHeaders = (request: Request) => {
    let headers: Record<string, string> = {};
    request.headers.forEach((v,k) => headers[k] = v)
    return headers;
  }

  const transfer = async (manifest: Manifest, interaction: APIInteraction, request: Request) => {
    let headers = getHeaders(request);
    const body = await request.arrayBuffer();

    const jwtToken = await createJwt(manifest, interaction.id);

    headers['Host'] = new URL(manifest.base_url).host
    headers['X-Hiyocord-Discord-Token'] = jwtToken;

    const signedHeaders = await sign(ctx.getTransferInteractionSignatureSecret(), headers, body);
    const transferRequest = new Request(
      manifest.base_url + "/interactions",
      {
        method: request.method,
        headers: signedHeaders,
        body: body
      }
    )

    const response = await fetch(transferRequest)
    if (response.ok) {
      return await response.json()
    } else {
      throw new Error();
    }
  }

  return {
    transfer
  }
}

