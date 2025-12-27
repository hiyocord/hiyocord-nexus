import { AppType, HonoEnv } from "./types";
import { APIApplicationCommandAutocompleteInteraction, APIApplicationCommandInteraction, APIInteraction, APIMessageComponentInteraction, APIModalSubmitInteraction, InteractionType } from "discord-api-types/v10";
import { Context } from "hono";
import { Manifest } from "@hiyocord/hiyocord-nexus-types";
import { sign } from "@hiyocord/hiyocord-nexus-core";
import verify from "./verify";
import { getManifest } from "./manifest";
import { StatusCode } from "hono/utils/http-status";
import { issueJWT } from "./jwt";

type ApplicationCmdInteraction = APIApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction
const getApplicationCmdManifest = (body: ApplicationCmdInteraction, manifests: Manifest[]) => {
  if(body.guild) { // guild command
    for(const it of manifests) {
      const command = it.application_commands.guild
          .filter(cmd => cmd.guild_id.includes(body.guild?.id!))
          .find(cmd => body.data.name === cmd.name)
      if(command) {
        return it;
      }
    }
  }

  // global command
  for(const it of manifests) {
    const command = it.application_commands.global.find(cmd => body.data.name === cmd.name);
    if(command) {
        return it;
    }
  }

  return null;
}

const getMessageComponentManifest = (body: APIMessageComponentInteraction, manifests: Manifest[]) => {
  return manifests.find(it => (it.message_component_ids??[]).includes(body.data.custom_id))
}

const getModalSubmitManifest = (body: APIModalSubmitInteraction, manifests: Manifest[]) => {
  return manifests.find(it => (it.modal_submit_ids??[]).includes(body.data.custom_id))
}

const findManifest = async (c: Context<HonoEnv, "/interactions", {}>, body: APIInteraction) => {
  const manifests = await getManifest(c)

  switch (body.type) {
    case InteractionType.ApplicationCommand:
    case InteractionType.ApplicationCommandAutocomplete:
      return getApplicationCmdManifest(body, manifests);
    case InteractionType.MessageComponent:
      return getMessageComponentManifest(body, manifests);
    case InteractionType.ModalSubmit:
      return getModalSubmitManifest(body, manifests);
    default:
      throw new Error("unknown interaction type");
  }
}

const transferRequest = async (
  c: Context<HonoEnv, "/interactions", {}>,
  manifest: Manifest,
  interactionId: string
) => {
  const headers = new Headers(c.req.header())
  headers.set('Host', new URL(manifest.base_url).host)
  const body = await c.req.arrayBuffer()

  // JWT発行（有効期限15秒）
  const jwt = await issueJWT(
    c.env.JWT_SECRET,
    manifest.id,
    interactionId,
    15
  );

  // HMAC署名ヘッダーを追加
  const signedHeaders = await sign(c.env.HIYOCORD_SECRET, c.req.header(), body);

  // Authorizationヘッダーを追加
  headers.set('Authorization', `Bearer ${jwt}`);

  // その他の署名ヘッダーをコピー
  for (const [key, value] of Object.entries(signedHeaders)) {
    headers.set(key, value);
  }

  const request = new Request(
    manifest.base_url + "/interactions",
    {
      method: c.req.method,
      headers: headers,
      body: body
    }
  )
  const response = await fetch(request)
  if(response.ok) {
    return response
  } else {
    console.log(await response.text())
    throw new Error("");
  }
}

export default (app: AppType) => {
  app.post("/interactions", verify, async (c) => {
    const body = await c.req.json() as APIInteraction;
    if(body.type === InteractionType.Ping) {
      return c.json({ type: 1 });
    }

    const manifest = await findManifest(c, body);

    if(manifest) {
      const response = await transferRequest(c, manifest, body.id);
      c.status(response.status as StatusCode);
      response.headers.forEach((value, key) => {
        c.header(key, value);
      })
      return c.body(await response.arrayBuffer());
    } else {
      return await c.json({
        type: 4,
        data: {
          content: "This interaction is not registered in Hiyocord Nexus."
        }
      });
    }
  });
}

