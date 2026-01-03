import { paths } from "@hiyocord/hiyocord-nexus-types";
import createClient from "openapi-fetch";

export type NexusClient = ReturnType<typeof useFetch>

export const useFetch = () => {
  const client = createClient<paths>({
    baseUrl: import.meta.env.VITE_NEXUS_URL,
    credentials: 'include'
  })
  return client;
}

