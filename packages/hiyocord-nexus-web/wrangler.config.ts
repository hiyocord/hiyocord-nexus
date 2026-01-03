import type { WranglerConfigurerOptions } from '@hiyocord/wrangler-configurer'

export default {
  params: {
    name: "hiyocord-nexus-web",
    upload_source_maps: true,
    pages_build_output_dir: "dist"
  }
} satisfies WranglerConfigurerOptions
