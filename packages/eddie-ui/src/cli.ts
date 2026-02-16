import { resolve } from "node:path";

export interface Config {
  workspace: string;
  port: number;
}

function arg(args: string[], key: string): string | undefined {
  const prefix = `--${key}`;

  const equalsIndex = args.findIndex((arg) => arg.startsWith(`${prefix}=`));
  if (equalsIndex !== -1) {
    return args[equalsIndex].slice(prefix.length + 1);
  }

  const spaceIndex = args.findIndex((arg) => arg === prefix);
  if (spaceIndex !== -1) {
    return args[spaceIndex + 1];
  }

  return undefined;
}

export function parseArgs(argv: string[]): Config {
  const args = argv.slice(2);

  const workspaceArg = arg(args, "workspace");
  const workspace = resolve(process.cwd(), workspaceArg ?? "");

  const portArg = arg(args, "port");
  const port = portArg ? Number.parseInt(portArg, 10) : 3000;

  return { workspace, port };
}
