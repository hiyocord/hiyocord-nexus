import type { WranglerConfigurerOptions } from '@hiyocord/wrangler-configurer'

export default {
  params: {
    name: "hiyocord-nexus-workers",
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
  }
} satisfies WranglerConfigurerOptions
