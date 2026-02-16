import { parseArgs } from "./src/cli.ts";
import { createEditorServer } from "./src/server.ts";

const config = parseArgs(process.argv);

const server = createEditorServer(config.workspace);

server.listen(config.port, () => {
  console.log(`Eddie UI server running at http://localhost:${config.port}`);
  console.log(`Workspace: ${config.workspace}`);
  console.log("Press Ctrl+C to stop");
});
