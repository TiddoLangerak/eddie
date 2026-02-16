import { type ServerResponse, createServer } from "node:http";
import type { RouteContext } from "./beancountController.ts";
import { createRouter } from "./router.ts";

function sendError(res: ServerResponse, message: string, status = 400) {
  res.writeHead(status, { "Content-Type": "text/plain" });
  res.end(message);
}

export function createEditorServer(workspace: string) {
  const router = createRouter({ workspace });

  return createServer(async (req, res) => {
    if (!req.url) {
      sendError(res, "Bad request", 400);
      return;
    }

    try {
      const route = router.find(req);
      if (route) {
        await route.handle(req, res);
      } else {
        sendError(res, "Not found", 404);
      }
    } catch (error) {
      console.error("Server error:", error);
      sendError(res, "Internal server error", 500);
    }
  });
}
