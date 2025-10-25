import type { WranglerConfigurerOptions } from '@hiyocord/wrangler-configurer'

export default {
  params: {
    name: "hiyocord-nexus",
    main: "./src/index.ts",
    compatibility_date: "2025-10-08",
    compatibility_flags: [
      "nodejs_compat"
    ],
    preview_urls: true,
    workers_dev: false,
    observability: {
      enabled: true
    },
    upload_source_maps: true,
    kv_namespaces: [{
      binding: "KV",
      id: process.env["HIYOCORD_NEXUS_KV_ID"]
    }]
  }
} satisfies WranglerConfigurerOptions
