import { ManifestAnyVersion } from "../../../hiyocord-nexus-types/dist/index.js";
import { defineCommand, } from "../command.js";
import { z } from "zod";
import type { InteractionHandlerRegistry } from "@hiyocord/discord-interaction-client";
import { createManifest } from "@hiyocord/hiyocord-nexus-core";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

export type HiyocordExport = {
  registry: InteractionHandlerRegistry,
  service: {
    baseUrl: string,
    iconUrl?: string,
    id: string,
    name: string,
    description: string,
    permissions: ManifestAnyVersion["permissions"],
    messageComponentIds: string[],
    modalSubmitIds: string[],
  },
  signing: {
    algorithm: "ed25519" | "secp256k1" | "rsa-pss",
    publicKey: string
  }
}

const validator = z.object({
  registry: z.any(),
  service: z.object({
    baseUrl: z.url(),
    iconUrl: z.url().optional(),
    id: z.string().regex(/^[a-z0-9.-]+$/),
    name: z.string(),
    description: z.string(),
    permissions: z.array(z.any()),
    messageComponentIds: z.array(z.string()),
    modalSubmitIds:z.array(z.string())
  }),
  signing: z.object({
    algorithm: z.enum(["ed25519", "secp256k1", "rsa-pss"]),
    publicKey: z.string()
  })
}) satisfies z.ZodType<HiyocordExport>;

export default defineCommand("manifest",
  {
    options: {
      entryPoint: {
        type: "string",
        default: "./dist/index.js"
      },
      nexusUrl: {
        type: "string",
        default: process.env.NEXUS_URL??""
      },
      baseUrl: {
        type: "string"
      },
      signatureAlgorithm: {
        type: "string",
        default: process.env.SIGNATURE_ALGORITHM??""
      },
      publicKey: {
        type: "string",
        default: process.env.PUBLIC_KEY??"",
      },
      dryrun: {
        type: "boolean",
        default: false
      }
    }
  },
  async ({ values }) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const file = `${relative(__dirname, process.cwd())}/${values.entryPoint}`

    const filePath = resolve(process.cwd(), values.entryPoint);
    if (!existsSync(filePath)) {
      console.error(`entryPoint not found: ${filePath}`);
      return 1
    }
    console.error(`loading: ${file}`)
    const {default: hiyocord} = await import(file) as {default: HiyocordExport};

    console.error(`loading: ${JSON.stringify(hiyocord)}`)
    validator.parse(hiyocord);


    const manifest = createManifest(hiyocord.registry, {
      id: hiyocord.service.id,
      name: hiyocord.service.name,
      description: hiyocord.service.description,
      baseUrl: hiyocord.service.baseUrl,
      iconUrl: hiyocord.service.iconUrl,
      permissions: hiyocord.service.permissions,
      messageComponentIds: hiyocord.service.messageComponentIds,
      modalSubmitIds:  hiyocord.service.modalSubmitIds,

      signatureAlgorithm: hiyocord.signing.algorithm,
      publicKey: hiyocord.signing.publicKey
    });

    console.log(JSON.stringify(manifest, null, 2));

    if(values.dryrun) {
      console.log("Dry run successful. The exported HiyocordExport is valid.");
      return 0;
    }

    if(!values.nexusUrl) {
      console.error("requires nexusUrl")
      return 1
    }
    const nexusUrl = (values.nexusUrl.endsWith("/") ? values.nexusUrl : values.nexusUrl + "/") + "api/manifests";

    const response = await fetch(nexusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(manifest),
    })

    if(response.ok) {
      console.log(`OK: Nexus POST /manifest ${response.status}`)
      return 0;
    } else {
      console.error(`Fail: Nexus POST /manifest ${response.status}`)
      console.error(await response.text())
      return 1
    }
  }
)
