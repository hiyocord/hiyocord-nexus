import { AppType, HonoEnv } from "./types";
import { APIApplicationCommandAutocompleteInteraction, APIApplicationCommandInteraction, APIInteraction, APIMessageComponentInteraction, APIModalSubmitInteraction, InteractionType } from "discord-api-types/v10";
import { Context } from "hono";
import { Manifest } from "@hiyocord/hiyocord-nexus-types";
import { sign } from "@hiyocord/hiyocord-nexus-core";
import verify from "./verify";
import { getManifest } from "./manifest";

type ApplicationCmdInteraction = APIApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction
const getApplicationCmdManifest = (body: ApplicationCmdInteraction, manifests: Manifest[]) => {
  if(body.guild) { // guild command
    for(const it of manifests) {
      const command = it.application_commands.guild
          .filter(cmd => cmd.guild_id.includes(body.guild?.id!))
          .find(cmd => body.data.name === cmd.name)
      if(command) {
        return {manifest: it, command};
      }
    }
  }

  // global command
  for(const it of manifests) {
    const command = it.application_commands.global.find(cmd => body.data.name === cmd.name);
    if(command) {
        return {manifest: it, command};
    }
  }

  return {manifest: null, command: null};
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
      return  {manifest: getMessageComponentManifest(body, manifests), command: null};
    case InteractionType.ModalSubmit:
      return {manifest: getModalSubmitManifest(body, manifests), command: null};
    default:
      throw new Error("");
  }
}

const transferRequest = async (
  c: Context<HonoEnv, "/interactions", {}>,
  manifest: Manifest
) => {
  const headers = new Headers(c.req.header())
  headers.set('Host', new URL(manifest.base_url).host)
  const body = await c.req.arrayBuffer()

  const request = new Request(
    manifest.base_url + "/interactions",
    {
      method: c.req.method,
      headers: new Headers(await sign(c.env.HIYOCORD_SECRET, c.req.header(), body)),
      body: body
    }
  )
  const response = await fetch(request)
  if(response.ok) {
    return await response.json()
  } else {
    console.log(await response.text())
    throw new Error("");
  }
}

export default (app: AppType) => {
  app.all("/test/interactions", async (c) => {
    console.log(JSON.stringify(c.req.json()))
    return c.json({message: "ok"});
  })

  app.post("/interactions", verify, async (c) => {
    const body = await c.req.json() as APIInteraction;
    if(body.type === InteractionType.Ping) {
      return c.json({ type: 1 });
    }

    const {manifest, command} = await findManifest(c, body);

    if(!manifest) {
      return c.json({"type": 5});
    }

    if(body.type == InteractionType.ApplicationCommand) {
      if(command?.defer??true) {
        c.executionCtx.waitUntil(transferRequest(c, manifest));
      } else {
        return c.json(await transferRequest(c, manifest))
      }
    } else {
      c.executionCtx.waitUntil(transferRequest(c, manifest));
    }
    return c.json({"type": 5});
  });
}

