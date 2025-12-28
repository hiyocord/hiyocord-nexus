import { APIInteraction } from "@hiyocord/hiyocord-nexus-types";
import { ApplicationContext } from "../application-context";
import { ManifestResolver } from "../domain/manifest";
import { ManifestStore } from "../infrastructure/manifest";
import { InteractionTransfer } from "../infrastructure/service-workers";


export const InteractionTransferService = async (ctx: ApplicationContext, request: Request, interaction: APIInteraction) => {
  const manifestStore = ManifestStore(ctx);
  const manifests = await manifestStore.findAll();
  const manifest = ManifestResolver(manifests, interaction).byInteraction();

  if(manifest) {
    return await InteractionTransfer(ctx).transfer(manifest, interaction, request);
  } else {
    return {
      type: 4,
      data: {
        content: "This interaction is not registered in Hiyocord Nexus."
      }
    }
  }
}

