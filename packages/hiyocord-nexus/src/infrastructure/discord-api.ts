import { ApplicationContext } from "../application-context";


export const DiscordApiRepository = (ctx: ApplicationContext) => {
  const client = async (request: Request) => {
    const headers = new Headers(request.headers);
    headers.set("Host", "discord.com");
    headers.set("Authorization", "Bot " + ctx.discord.getToken());
    const req = new Request("https://discord.com" + new URL(request.url).pathname.substring("/proxy/discord".length), {
      ...request,
      headers
    })
    return await fetch(req)
  }

  return {
    client
  }
}

