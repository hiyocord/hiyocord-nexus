import { APIInteraction } from "@hiyocord/hiyocord-nexus-types";
import { ApplicationContext } from "../application-context";
import { ManifestStore } from "../infrastructure/manifest";
import { InteractionTransfer } from "../infrastructure/service-workers";


export const InteractionTransferService = async (ctx: ApplicationContext, request: Request, interaction: APIInteraction) => {
  const manifest = await ManifestStore(ctx).findByInteraction(interaction);

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

