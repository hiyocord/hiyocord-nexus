#!/usr/bin/env node
import { parseArgs } from "node:util";
import { Command } from "./command.js";
import { exit } from "node:process";
import genKey from "./gen-key.js";
import path from "node:path";

async function main() {
  const commandName = path.basename(process.argv[1]);
  const command = [
    genKey
  ].find(it => it.name === commandName);

  if(command == undefined) {
    return 127
  }

  const { name, execute, ...config } = command as Command<any>;
  const parsedResult = parseArgs({
    ...config,
    args: process.argv.slice(2)
  })

  const exitCode = execute(parsedResult)
  if(typeof exitCode === "number") {
    return exitCode
  } else {
    return await exitCode;
  }
}

exit(await main())
