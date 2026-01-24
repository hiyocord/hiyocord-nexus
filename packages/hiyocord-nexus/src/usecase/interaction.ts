import { APIInteraction } from "@hiyocord/hiyocord-nexus-types";
import { ApplicationContext } from "../application-context";
import { ManifestStore } from "../infrastructure/manifest";
import { ApprovalStore } from "../infrastructure/approval";
import { InteractionTransfer } from "../infrastructure/service-workers";


export const InteractionTransferService = async (ctx: ApplicationContext, request: Request, interaction: APIInteraction) => {
  const manifest = await ManifestStore(ctx).findByInteraction(interaction);

  if(manifest) {
    // 承認状態を確認
    const approvalStatus = await ApprovalStore(ctx).get(manifest.id);
    // 承認状態が存在しない場合はapprovedとして扱う（後方互換性）
    const status = approvalStatus ?? { status: 'approved' as const, updated_at: 0 };

    if (status.status === 'approved') {
      return await InteractionTransfer(ctx).transfer(manifest, interaction, request);
    } else {
      return {
        type: 4,
        data: {
          content: "This service is not approved yet."
        }
      }
    }
  } else {
    return {
      type: 4,
      data: {
        content: "This interaction is not registered in Hiyocord Nexus."
      }
    }
  }
}

