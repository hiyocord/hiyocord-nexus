import { ApplicationContext } from '../../application-context'

export type ApprovalStatus = {
  status: 'pending' | 'approved' | 'rejected'
  updated_at: number
  updated_by?: string
}

export const ApprovalStore = (ctx: ApplicationContext) => {
  const kv = ctx.getManifestKv()

  const get = async (manifestId: string): Promise<ApprovalStatus | null> => {
    const data = await kv.get(`approval:${manifestId}`, 'json')
    if (!data) {
      return null
    }
    return data as ApprovalStatus
  }

  const set = async (manifestId: string, status: ApprovalStatus): Promise<void> => {
    await kv.put(`approval:${manifestId}`, JSON.stringify(status))
  }

  return {
    get,
    set
  }
}
