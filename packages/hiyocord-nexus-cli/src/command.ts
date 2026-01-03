import { parseArgs, ParseArgsConfig } from "node:util"

export type Command<T extends ParseArgsConfig = Omit<ParseArgsConfig, "args">> = Omit<ParseArgsConfig, "args"> & {
  name: string,
  execute: (args: ReturnType<typeof parseArgs<ParseArgsConfig & T>>) => number | Promise<number>
}

export function defineCommand<T extends ParseArgsConfig>(
  name: string,
  config: T,
  execute: (args: ReturnType<typeof parseArgs<T>>) => Promise<number>
): Command<T> {
  return {
    name,
    ...config,
    execute
  }
}
